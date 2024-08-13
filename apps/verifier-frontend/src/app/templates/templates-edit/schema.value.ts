export const schema = {
  $schema: 'http://json-schema.org/draft-06/schema#',
  $ref: '#/definitions/Template',
  definitions: {
    Template: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
        },
        metadata: {
          $ref: '#/definitions/Metadata',
        },
        request: {
          $ref: '#/definitions/Request',
        },
      },
      required: ['metadata', 'name', 'request'],
      title: 'Template',
    },
    Metadata: {
      type: 'object',
      additionalProperties: false,
      properties: {
        clientId: {
          type: 'string',
        },
        clientName: {
          type: 'string',
        },
        logo_uri: {
          type: 'string',
          format: 'uri',
          'qt-uri-protocols': ['https'],
          'qt-uri-extensions': ['.jpg'],
        },
      },
      required: ['clientId', 'clientName', 'logo_uri'],
      title: 'Metadata',
    },
    Request: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        purpose: {
          type: 'string',
        },
        format: {
          $ref: '#/definitions/Format',
        },
        input_descriptors: {
          type: 'array',
          items: {
            $ref: '#/definitions/InputDescriptor',
          },
        },
      },
      required: ['format', 'id', 'input_descriptors', 'purpose'],
      title: 'Request',
    },
    Format: {
      type: 'object',
      additionalProperties: false,
      properties: {
        'vc+sd-jwt': {
          $ref: '#/definitions/VcSDJwt',
        },
      },
      required: ['vc+sd-jwt'],
      title: 'Format',
    },
    VcSDJwt: {
      type: 'object',
      additionalProperties: false,
      title: 'VcSDJwt',
    },
    InputDescriptor: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        purpose: {
          type: 'string',
        },
        constraints: {
          $ref: '#/definitions/Constraints',
        },
      },
      required: ['constraints', 'id', 'name', 'purpose'],
      title: 'InputDescriptor',
    },
    Constraints: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit_disclosure: {
          type: 'string',
        },
        fields: {
          type: 'array',
          items: {},
        },
      },
      required: ['fields', 'limit_disclosure'],
      title: 'Constraints',
    },
  },
};
