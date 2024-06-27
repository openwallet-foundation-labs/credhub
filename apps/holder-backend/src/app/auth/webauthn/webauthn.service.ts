import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Passkey } from './entities/passkey.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import {
  VerifiedRegistrationResponse,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { v4 as uuid } from 'uuid';

export const WEBAUTHN_VALIDATION_SCHEMA = {
  WEBAUTHN_RP_ID: Joi.string().required(),
  WEBAUTHN_RP_NAME: Joi.string().required(),
};

@Injectable()
export class WebauthnService {
  /**
   * Human-readable title for your website
   */
  private rpName: string;
  /**
   * A unique identifier for your website. 'localhost' is okay for
   * local dev
   */
  private rpID: string;

  private registerSessions: Map<
    string,
    PublicKeyCredentialCreationOptionsJSON
  > = new Map();

  private loginSessions: Map<string, PublicKeyCredentialRequestOptionsJSON> =
    new Map();

  constructor(
    @InjectRepository(Passkey) private passKeyRepository: Repository<Passkey>,
    private configService: ConfigService
  ) {
    this.rpName = this.configService.get('WEBAUTHN_RP_NAME');
    this.rpID = this.configService.get('WEBAUTHN_RP_ID');
  }

  private getUserPassKeys(user: string) {
    return this.passKeyRepository.find({
      where: { user },
    });
  }

  async generateRegistrationOptions(userId: string, userName: string) {
    // (Pseudocode) Retrieve the user from the database
    // after they've logged in
    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    const userPasskeys: Passkey[] = await this.getUserPassKeys(userId);

    const options: PublicKeyCredentialCreationOptionsJSON =
      await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userName,
        userDisplayName: userName,
        // Don't prompt users for additional information about the authenticator
        // (Recommended for smoother UX)
        attestationType: 'none',
        // Prevent users from re-registering existing authenticators
        excludeCredentials: userPasskeys.map((passkey) => ({
          id: passkey.id,
          // Optional
          transports: passkey.transports,
        })),
        // See "Guiding use of authenticators via authenticatorSelection" below
        authenticatorSelection: {
          // Defaults
          residentKey: 'preferred',
          userVerification: 'preferred',
          // Optional
          authenticatorAttachment: 'platform',
        },
      });

    this.setCurrentRegistrationOptions(userId, options);

    return options;
  }

  /**
   * Store the registration options for the user
   * @param user
   * @param options
   */
  private setCurrentRegistrationOptions(
    user: string,
    options: PublicKeyCredentialCreationOptionsJSON
  ) {
    this.registerSessions.set(user, options);
  }

  private getCurrentRegistrationOptions(user: string) {
    return this.registerSessions.get(user);
  }

  async startRegistration(
    user: string,
    body: RegistrationResponseJSON,
    expectedOrigin: string
  ) {
    // (Pseudocode) Get `options.challenge` that was saved above
    const currentOptions: PublicKeyCredentialCreationOptionsJSON =
      this.getCurrentRegistrationOptions(user);

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      });
    } catch (error) {
      throw new ConflictException(error.message);
    }

    const { registrationInfo } = verification;
    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;
    const el = this.passKeyRepository.create({
      user,
      webauthnUserID: currentOptions.user.id,
      id: credentialID,
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: body.response.transports,
    });
    await this.passKeyRepository.save(el);
  }

  async generateAuthenticationOptions(user: string) {
    const userPasskeys: Passkey[] = await this.getUserPassKeys(user);
    const session = uuid();

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID: this.rpID,
        userVerification: 'preferred',
        // Require users to use a previously-registered authenticator
        allowCredentials: userPasskeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports,
        })),
      });

    this.setCurrentAuthenticationOptions(session, options);

    return { options, session };
  }

  private setCurrentAuthenticationOptions(
    user: string,
    options: PublicKeyCredentialRequestOptionsJSON
  ) {
    this.loginSessions.set(user, options);
  }

  private getCurrentAuthenticationOptions(key: string) {
    return this.loginSessions.get(key);
  }

  private deleteCurrentAuthenticationOptions(key: string) {
    this.loginSessions.delete(key);
  }

  /**
   * Verify the authentication response
   */
  async verifyAuthenticationResponse(
    session: string,
    user: string,
    body: AuthenticationResponseJSON,
    expectedOrigin: string
  ) {
    const currentOptions: PublicKeyCredentialRequestOptionsJSON =
      this.getCurrentAuthenticationOptions(session);
    if (!currentOptions) {
      throw new ConflictException('No authentication session found');
    }
    const passkey: Passkey = await this.getUserPasskey(user, body.id);

    if (!passkey) {
      throw new ConflictException(
        `Could not find passkey ${body.id} for user ${user}`
      );
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        requireUserVerification: true,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: passkey.id,
          credentialPublicKey: Uint8Array.from(
            Buffer.from(passkey.publicKey, 'base64')
          ),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
    } catch (error) {
      throw new ConflictException(error.message);
    }

    const { verified } = verification;
    if (!verified) {
      throw new ConflictException('Could not verify authentication');
    }
    this.deleteCurrentAuthenticationOptions(session);

    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;

    await this.saveUpdatedCounter(passkey, newCounter);
  }

  /**
   * Save the updated counter for a passkey
   * @param passkey
   * @param newCounter
   */
  private async saveUpdatedCounter(passkey: Passkey, newCounter: number) {
    passkey.counter = newCounter;
    await this.passKeyRepository.save(passkey);
  }

  /**
   * Get a passkey for a user
   * @param user
   * @param id
   * @returns
   */
  private getUserPasskey(user: string, id: string): Promise<Passkey> {
    return this.passKeyRepository.findOne({ where: { id, user } });
  }

  /**
   * Check if a user has any keys
   */
  hasKeys(user: string) {
    return this.passKeyRepository.count({ where: { user } }).then((count) => {
      return count > 0;
    });
  }

  /**
   * Get all keys for a user
   * @param sub
   * @returns
   */
  getKeys(sub: string) {
    return this.passKeyRepository.find({ where: { user: sub } });
  }

  /**
   * Delete a key for a user
   * @param sub
   * @param id
   * @returns
   */
  deleteKey(sub: string, id: string) {
    return this.passKeyRepository.delete({ user: sub, id });
  }
}
