import { OIDCClient } from './oidc-client';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_DELETED_EVENT, UserDeletedEvent } from '../auth.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeycloakOIDCClient implements OIDCClient {
  private keycloakUrl: string;
  private realm: string;
  private clientId: string;
  private clientSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_AUTH_URL');
    this.realm = this.configService.get('KEYCLOAK_REALM');
    this.clientId = this.configService.get('KEYCLOAK_ADMIN_CLIENT_ID');
    this.clientSecret = this.configService.get('KEYCLOAK_ADMIN_CLIENT_SECRET');
  }

  /**
   * Get access token from Keycloak
   * @returns
   */
  private async getAccessToken(): Promise<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('grant_type', 'client_credentials');

    try {
      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      return response.data.access_token;
    } catch (error) {
      throw new HttpException(
        'Failed to obtain access token',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Get user ID from Keycloak
   * @param username
   * @param accessToken
   * @returns
   */
  private async getUserId(
    username: string,
    accessToken: string
  ): Promise<string> {
    const userUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${username}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(userUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      );
      if (response.data.length === 0) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return response.data[0].id;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch user ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete user from Keycloak
   * @param userId
   * @param accessToken
   */
  private async deleteUser(userId: string, accessToken: string): Promise<void> {
    const deleteUserUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;

    try {
      await firstValueFrom(
        this.httpService.delete(deleteUserUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      );
    } catch (error) {
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle user deleted event
   * @param payload
   */
  @OnEvent(USER_DELETED_EVENT)
  async userDeleteEvent(payload: UserDeletedEvent): Promise<void> {
    const accessToken = await this.getAccessToken();
    const userId = await this.getUserId(payload.id, accessToken);
    await this.deleteUser(userId, accessToken);
  }
}
