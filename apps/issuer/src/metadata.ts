import { DisclosureFrame } from '@sd-jwt/types';
import { CredentialIssuerMetadataOpts } from '@sphereon/oid4vci-common';

export const metadata: CredentialIssuerMetadataOpts = {
  //TODO: endpoint should be dynamic
  credential_issuer: process.env.ISSUER_BASE_URL,
  display: [
    {
      name: 'German Government',
      locale: 'en-US',
      logo: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Flagge_Deutschland.jpg/640px-Flagge_Deutschland.jpg',
      },
    },
  ],
  credentials_supported: [
    {
      format: 'vc+sd-jwt',
      vct: 'Identity',
      claims: {
        prename: {
          display: [
            {
              name: 'Prename',
              locale: 'en-US',
            },
          ],
        },
        surname: {
          display: [
            {
              name: 'Surname',
              locale: 'en-US',
            },
          ],
        },
      },
      cryptographic_suites_supported: ['ES256K'],
      cryptographic_binding_methods_supported: ['did'],
      id: 'Identity',
      display: [
        {
          name: 'Identity Card',
          locale: 'en-US',
          logo: {
            url: 'https://exampleuniversity.com/public/logo.png',
            alt_text: 'a square logo of a university',
          },
          background_image: {
            url: 'https://www.bmi.bund.de/SharedDocs/bilder/DE/schmuckbilder/moderne-verwaltung/paesse-ausweise/personalausweis_vorderseite_ab_august_2021.jpg?__blob=poster&v=2',
            alt_text: 'a picture of a passport',
          },
          background_color: '#12107c',
          text_color: '#FFFFFF',
        },
      ],
    },
  ],
} as CredentialIssuerMetadataOpts;

/**
 * Define the interface of you credential. If you want to be dynamic and need no IDE support with type checking, leave the class empty.
 */
export interface Credential {
  prename: string;
  surname: string;
}

/**
 * Define the disclosure frame for the credential. In case you are passing Credential as type, all values have to be defined. But of course not all properties have to be disclosed that are defined in the Credential interface.
 */
export const disclosureFrame: DisclosureFrame<Credential> = {
  _sd: ['prename', 'surname'],
};
