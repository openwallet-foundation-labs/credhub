import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Passkey } from './passkey.entity';
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
  /**
   * The URL at which registrations and authentications should occur.
   * 'http://localhost' and 'http://localhost:PORT' are also valid.
   * Do NOT include any trailing /
   */
  private origin: string;

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
    this.origin = `http://${this.rpID}`;
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
          residentKey: 'required',
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

  async startRegistration(user: string, body: RegistrationResponseJSON) {
    // (Pseudocode) Get `options.challenge` that was saved above
    const currentOptions: PublicKeyCredentialCreationOptionsJSON =
      this.getCurrentRegistrationOptions(user);

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
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

    await this.passKeyRepository.save({
      user,
      webauthnUserID: currentOptions.user.id,
      id: credentialID,
      publicKey: credentialPublicKey,
      counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: body.response.transports,
    });
  }

  async generateAuthenticationOptions(user: string) {
    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    const userPasskeys: Passkey[] = await this.getUserPassKeys(user);

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID: this.rpID,
        // Require users to use a previously-registered authenticator
        allowCredentials: userPasskeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports,
        })),
      });

    this.setCurrentAuthenticationOptions(user, options);

    return options;
  }

  private setCurrentAuthenticationOptions(
    user: string,
    options: PublicKeyCredentialRequestOptionsJSON
  ) {
    this.loginSessions.set(user, options);
  }

  private getCurrentAuthenticationOptions(user: string) {
    return this.loginSessions.get(user);
  }

  async verifyAuthenticationResponse(
    user: string,
    body: AuthenticationResponseJSON
  ) {
    // (Pseudocode) Get `options.challenge` that was saved above
    const currentOptions: PublicKeyCredentialRequestOptionsJSON =
      this.getCurrentAuthenticationOptions(user);
    // (Pseudocode} Retrieve a passkey from the DB that
    // should match the `id` in the returned credential
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
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: passkey.id,
          credentialPublicKey: passkey.publicKey,
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
    } catch (error) {
      throw new ConflictException(error.message);
    }

    const { verified } = verification;

    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;

    await this.saveUpdatedCounter(passkey, newCounter);
  }

  private async saveUpdatedCounter(passkey: Passkey, newCounter: number) {
    passkey.counter = newCounter;
    await this.passKeyRepository.save(passkey);
  }

  private getUserPasskey(user: string, id: string): Promise<Passkey> {
    return this.passKeyRepository.findOne({ where: { id, user } });
  }
}
