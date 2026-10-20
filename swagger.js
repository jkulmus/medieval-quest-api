const fs = require('node:fs');
const path = require('node:path');

const questExample = {
  title: 'A Message for the Gatekeeper',
  description: 'Deliver a sealed message to the kingdom gatekeeper.',
  difficulty: 'easy',
  location: 'Main Gate',
  reward: '5 gold coins',
  minimumLevel: 1,
  guildId: null
};

const idSchema = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  example: '6acd46de25042f01b90c3644'
};

const questProperties = {
  title: {
    type: 'string',
    pattern: '\\S',
    description: 'Quest title. Cannot be blank.'
  },
  description: {
    type: 'string',
    pattern: '\\S',
    description: 'Instructions for completing the quest. Cannot be blank.'
  },
  difficulty: {
    type: 'string',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty is trimmed and converted to lowercase.'
  },
  location: {
    type: 'string',
    pattern: '\\S',
    description: 'Where the quest takes place. Cannot be blank.'
  },
  reward: {
    type: 'string',
    pattern: '\\S',
    description: 'Reward for completing the quest. Cannot be blank.'
  },
  minimumLevel: {
    type: 'integer',
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
    description: 'Minimum player level. Must be a whole number.'
  },
  guildId: {
    type: 'string',
    nullable: true,
    pattern: '^[a-fA-F0-9]{24}$',
    description:
      'Existing guild ID, or null for an unassigned quest. ' +
      'Omitting this field also makes the quest unassigned.'
  }
};

const requiredFields = [
  'title',
  'description',
  'difficulty',
  'location',
  'reward',
  'minimumLevel'
];

const errorSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' }
  }
};

// Build a documented JSON response
function jsonResponse(description, schema, example) {
  return {
    description,
    content: {
      'application/json': {
        schema,
        example
      }
    }
  };
}

// Build a documented error response
function errorResponse(description, message) {
  return jsonResponse(description, errorSchema, { message });
}

const invalidIdResponse = errorResponse(
  'The quest ID is not a valid 24-character hexadecimal MongoDB ID.',
  'Please provide a valid quest ID'
);

const notFoundResponse = errorResponse(
  'The ID is valid, but no quest has that ID.',
  'Quest not found'
);

const validationResponse = errorResponse(
  'Invalid JSON or quest data. Check the response message for details.',
  'minimumLevel must be a whole number of at least 1'
);

const tooLargeResponse = errorResponse(
  'The JSON request exceeds the server body-size limit.',
  'Request body is too large'
);

const questBody = {
  required: true,
  description:
    'Provide all six required fields. Additional fields are ignored. ' +
    'Omit guildId or use null for an unassigned quest. ' +
    'On PUT, omitting guildId clears any previous guild assignment.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/QuestInput' },
      example: questExample
    }
  }
};

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'Medieval Quest API',
    version: '1.1.0',
    description:
      'Lesson 6: Create, retrieve, update, and delete medieval quests. ' +
      'Includes input validation and error handling. ' +
      'Quests may optionally be linked to an existing guild.'
  },
  servers: [
    {
      url: '/',
      description: 'Server hosting this documentation'
    }
  ],
  tags: [
    {
      name: 'General',
      description: 'API welcome route.'
    },
    {
      name: 'Quests',
      description: 'Create, retrieve, update, and delete quests.'
    }
  ],
  paths: {
    '/': {
      get: {
        tags: ['General'],
        summary: 'Get the welcome message',
        responses: {
          200: jsonResponse(
            'API welcome message.',
            errorSchema,
            { message: 'Welcome to the Medieval Quest API!' }
          )
        }
      }
    },

    '/quests': {
      get: {
        tags: ['Quests'],
        summary: 'Get all quests',
        description:
          'Returns all quests, optionally filtered by difficulty. ' +
          'An empty result returns []. ' +
          'Only the difficulty query parameter is supported.',
        parameters: [
          {
            name: 'difficulty',
            in: 'query',
            required: false,
            description:
              'Optional filter. Use exactly easy, medium, or hard.',
            schema: {
              type: 'string',
              enum: ['easy', 'medium', 'hard']
            }
          }
        ],
        responses: {
          200: jsonResponse(
            'Quests retrieved successfully.',
            {
              type: 'array',
              items: { $ref: '#/components/schemas/Quest' }
            },
            [
              {
                _id: idSchema.example,
                ...questExample
              }
            ]
          ),
          400: errorResponse(
            'Invalid difficulty or an unsupported query parameter.',
            'difficulty must be easy, medium, or hard'
          ),
          500: errorResponse(
            'Unable to retrieve quests.',
            'Unable to retrieve quests'
          )
        }
      },

      post: {
        tags: ['Quests'],
        summary: 'Create a quest',
        description:
          'Validates the quest fields and any supplied guild ID, ' +
          'saves the quest in MongoDB, and returns its new ID.',
        requestBody: questBody,
        responses: {
          201: jsonResponse(
            'Quest created successfully.',
            {
              type: 'object',
              required: ['message', 'id'],
              properties: {
                message: { type: 'string' },
                id: idSchema
              }
            },
            {
              message: 'Quest created successfully!',
              id: idSchema.example
            }
          ),
          400: validationResponse,
          413: tooLargeResponse,
          500: errorResponse(
            'Unable to create quest.',
            'Unable to create quest'
          )
        }
      }
    },

    '/quests/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description:
            'MongoDB quest ID. Copy an actual _id from GET /quests.',
          schema: idSchema
        }
      ],

      get: {
        tags: ['Quests'],
        summary: 'Get a quest by ID',
        description: 'Returns the quest matching the supplied ID.',
        responses: {
          200: jsonResponse(
            'Quest retrieved successfully.',
            { $ref: '#/components/schemas/Quest' },
            {
              _id: idSchema.example,
              ...questExample
            }
          ),
          400: invalidIdResponse,
          404: notFoundResponse,
          500: errorResponse(
            'Unable to retrieve quest.',
            'Unable to retrieve quest'
          )
        }
      },

      put: {
        tags: ['Quests'],
        summary: 'Update a quest',
        description:
          'Updates all seven editable fields of an existing quest. ' +
          'All six required fields must be supplied. ' +
          'Returns 204 with no response body on success, ' +
          'including when the submitted values are unchanged.',
        requestBody: questBody,
        responses: {
          204: {
            description: 'Quest updated successfully. No response body.'
          },
          400: errorResponse(
            'Invalid quest ID, malformed JSON, or invalid quest fields.',
            'minimumLevel must be a whole number of at least 1'
          ),
          404: notFoundResponse,
          413: tooLargeResponse,
          500: errorResponse(
            'Unable to update quest.',
            'Unable to update quest'
          )
        }
      },

      delete: {
        tags: ['Quests'],
        summary: 'Delete a quest',
        description: 'Permanently removes the quest matching the supplied ID.',
        responses: {
          200: jsonResponse(
            'Quest deleted successfully.',
            errorSchema,
            { message: 'Quest deleted successfully!' }
          ),
          400: invalidIdResponse,
          404: notFoundResponse,
          500: errorResponse(
            'Unable to delete quest.',
            'Unable to delete quest'
          )
        }
      }
    }
  },
  components: {
    schemas: {
      QuestInput: {
        type: 'object',
        required: requiredFields,
        properties: questProperties
      },
      Quest: {
        type: 'object',
        required: ['_id', ...requiredFields, 'guildId'],
        properties: {
          _id: idSchema,
          ...questProperties
        }
      }
    }
  }
};

fs.writeFileSync(
  path.join(__dirname, 'swagger-output.json'),
  JSON.stringify(doc, null, 2)
);

console.log('Swagger documentation generated successfully!');