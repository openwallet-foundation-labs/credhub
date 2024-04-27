import { ApiProperty } from '@nestjs/swagger';
import { CredentialSupported, MetadataDisplay } from '@sphereon/oid4vci-common';
import { Column, Entity, PrimaryColumn } from 'typeorm';

class IssuerMetadataLogo {
  url: string;
  alt_text: string;
}

class CredentialIssuer {
  name: string;
  locale: string;
  logo?: IssuerMetadataLogo;
}

@Entity()
export class Credential {
  /**
   * ID of the credential, has to be unique in combination with the user id.
   */
  @PrimaryColumn({ primary: true })
  id: string;

  /**
   * The user that owns the key
   */
  @Column({ primary: true })
  user: string;

  /**
   * The value of the credential
   */
  @Column()
  value: string;

  /**
   * Metadata to render the display
   */
  @Column({ nullable: true, type: 'json' })
  metaData: CredentialSupported;

  /**
   * Metadata for the issuer representation
   */
  @Column({ nullable: true, type: 'json' })
  @ApiProperty({ type: CredentialIssuer })
  issuer: MetadataDisplay;
}
