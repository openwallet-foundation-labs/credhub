import { PresentationDefinitionV2 } from '@sphereon/pex-models';

/**
 * Presentation Definition for the check-in use case.
 */
export const presentationDefinition: PresentationDefinitionV2 = {
  id: 'check-in',
  purpose: 'We need some information about you.',
  format: {
    'vc+sd-jwt': {},
  },
  input_descriptors: [
    {
      id: 'adult',
      name: 'Identity proof',
      purpose: 'We need some values from your identity card.',
      constraints: {
        limit_disclosure: 'required',
        fields: [
          {
            path: ['$.vct'],
            filter: {
              type: 'string',
              const: 'Identity',
            },
          },
          {
            path: ['$.prename'],
            filter: {
              type: 'string',
            },
          },
        ],
      },
    },
  ],
};
