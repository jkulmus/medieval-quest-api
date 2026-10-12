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
    description: 'Instructions for completing the quest.'
  },
  difficulty: {
    type: 'string',
    enum: ['easy', 'medium', 'hard'],
    description: 'Difficulty is trimmed and converted to lowercase.'
  },
  location: {
    type: 'string',
    pattern: '\\S',
    description: 'Where the quest takes place.'
  },
  reward: {
    type: 'string',
    pattern: '\\S',
    description: 'Reward for completing the quest.'
  },
  minimumLevel: {
    type: 'integer',
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
    description: 'Minimum player level.'
  },
  guildId: {
    type: 'string',
    nullable: true,
    pattern: '^[a-fA-F0-9]{24}$',
    description: 'Existing guild ID, or null for an unassigned quest.'
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

// Build a documented JSON response.
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

const errorSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' }
  }
};

const questBody = {
  required: true,
  description:
    'Provide all six required fields. Omit guildId or use null until a guild is assigned.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/QuestInput' },
      example: questExample
    }
  }
};

const plannedDescription =
  'Design planned for a later lesson. This route is not implemented yet. ' +
  'Trying it now returns 404 and does not modify the database.';

const plannedResponses = {
  404: {
    description: 'Current behavior: route has not been implemented.'
  }
};

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'Medieval Quest API',
    version: '1.0.0',
    description:
      'Manage medieval quests and guilds. ' +
      'Lesson 5 implements GET all quests and POST a quest. ' +
      'GET by ID, PUT, and DELETE are documented as planned operations.'
  },
  servers: [
    {
      url: '/',
      description: 'Server hosting this documentation'
    }
  ],
  tags: [
    { name: 'General', description: 'API welcome route.' },
    { name: 'Quests', description: 'Create and retrieve quests.' }
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
          'Returns every quest in MongoDB. An empty collection returns [].',
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
          500: jsonResponse(
            'Unable to retrieve quests.',
            errorSchema,
            { message: 'Unable to retrieve quests.' }
          )
        }
      },
      post: {
        tags: ['Quests'],
        summary: 'Create a quest',
        description:
          'Validates the submitted fields, saves a quest in MongoDB, ' +
          'and returns its new ID. Additional fields are ignored.',
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
          400: jsonResponse(
            'Validation failed. Correct the field identified in the message.',
            errorSchema,
            { message: 'difficulty must be easy, medium, or hard.' }
          ),
          500: jsonResponse(
            'Unable to create quest.',
            errorSchema,
            { message: 'Unable to create quest.' }
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
          description: 'MongoDB quest ID. Copy an _id from GET /quests.',
          schema: idSchema
        }
      ],
      get: {
        tags: ['Quests'],
        summary: 'Get a quest by ID — planned',
        description:
          plannedDescription +
          ' Intended behavior: return one quest, or 404 if it does not exist.',
        responses: plannedResponses
      },
      put: {
        tags: ['Quests'],
        summary: 'Update a quest — planned',
        description:
          plannedDescription +
          ' Intended behavior: replace the editable fields of an existing quest.',
        requestBody: questBody,
        responses: plannedResponses
      },
      delete: {
        tags: ['Quests'],
        summary: 'Delete a quest — planned',
        description:
          plannedDescription +
          ' Intended behavior: remove the quest matching the supplied ID.',
        responses: plannedResponses
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