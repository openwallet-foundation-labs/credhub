export const schema = {
  $schema: 'http://json-schema.org/draft-06/schema#',
  $ref: '#/definitions/Template',
  definitions: {
    Template: {
      type: 'object',
      additionalProperties: false,
      properties: {
        schema: {
          $ref: '#/definitions/Schema',
        },
        sd: {
          $ref: '#/definitions/SD',
        },
        ttl: {
          type: 'number',
        },
        name: {
          type: 'string',
        },
      },
      required: ['schema', 'sd'],
      title: 'Template',
    },
    Schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        format: {
          type: 'string',
        },
        vct: {
          type: 'string',
        },
        claims: {
          $ref: '#/definitions/Claims',
        },
        display: {
          type: 'array',
          items: {
            $ref: '#/definitions/SchemaDisplay',
          },
        },
      },
      required: ['claims', 'display', 'format', 'vct'],
      title: 'Schema',
    },
    Claims: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[a-zA-Z]+$': {
          type: 'object',
          properties: {
            display: {
              type: 'array',
              items: {
                $ref: '#/definitions/ClaimDisplay',
              },
            },
          },
          required: ['display'],
        },
      },
      title: 'Claims',
    },
    ClaimDisplay: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
        },
        locale: {
          type: 'string',
        },
      },
      required: ['locale', 'name'],
      title: 'ClaimDisplay',
    },
    SchemaDisplay: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
        },
        locale: {
          type: 'string',
        },
        logo: {
          $ref: '#/definitions/BackgroundImage',
        },
        background_image: {
          $ref: '#/definitions/BackgroundImage',
        },
        background_color: {
          type: 'string',
        },
        text_color: {
          type: 'string',
        },
      },
      required: [
        'background_color',
        'background_image',
        'locale',
        'logo',
        'name',
        'text_color',
      ],
      title: 'SchemaDisplay',
    },
    BackgroundImage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          'qt-uri-protocols': ['https'],
          'qt-uri-extensions': ['.jpg', '.png'],
        },
        alt_text: {
          type: 'string',
        },
      },
      required: ['alt_text', 'url'],
      title: 'BackgroundImage',
    },
    SD: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _sd: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['_sd'],
      title: 'SD',
    },
  },
};
