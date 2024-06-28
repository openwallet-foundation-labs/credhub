import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  Base64URLString,
} from '@simplewebauthn/types';

@Entity()
export class Passkey {
  // SQL: Store as `TEXT`. Index this column
  @PrimaryColumn()
  id: Base64URLString;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  //      Caution: Node ORM's may map this to a Buffer on retrieval,
  //      convert to Uint8Array as necessary
  @Column()
  publicKey: string;

  // SQL: Foreign Key to an instance of your internal user model
  @Column()
  user: string;
  // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
  //      (webAuthnUserID + user) also achieves maximum user privacy
  @Column()
  webauthnUserID: Base64URLString;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  @Column({ type: 'bigint' })
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  @Column()
  deviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  @Column({ type: 'boolean' })
  backedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
  @Column({ nullable: true, type: 'json' })
  transports?: AuthenticatorTransportFuture[];
}
