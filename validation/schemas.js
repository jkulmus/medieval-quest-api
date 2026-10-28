const Joi = require('joi');

// Required text fields are trimmed and cannot be blank
function requiredText(field) {
    return Joi.string().trim().required().messages({
        'string.base': `${field} must be a nonempty string`,
        'string.empty': `${field} must be a nonempty string`,
        'any.required': `${field} must be a nonempty string`
    });
}

const levelMessage =
    'minimumLevel must be a whole number of at least 1';

// Strict validation rejects strings such as "1"
const minimumLevel = Joi.number()
    .integer()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER)
    .strict()
    .required()
    .messages({
        'number.base': levelMessage,
        'number.integer': levelMessage,
        'number.min': levelMessage,
        'number.max': levelMessage,
        'number.unsafe': levelMessage,
        'any.required': levelMessage
    });

// Shared rules for creating and updating quests
const questSchema = Joi.object({
    title: requiredText('title'),
    description: requiredText('description'),

    difficulty: requiredText('difficulty')
        .lowercase()
        .valid('easy', 'medium', 'hard')
        .messages({
            'any.only': 'difficulty must be easy, medium, or hard'
        }),

    location: requiredText('location'),
    reward: requiredText('reward'),
    minimumLevel,

    guildId: Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/)
        .allow(null)
        .default(null)
        .messages({
            'string.base': 'guildId must be a valid MongoDB ID or null',
            'string.empty': 'guildId must be a valid MongoDB ID or null',
            'string.pattern.base':
                'guildId must be a valid MongoDB ID or null'
        })
})
    .required()
    .messages({
        'object.base': 'Please provide a JSON object',
        'any.required': 'Please provide a JSON object'
    });

// Shared rules for creating and updating guilds
const guildSchema = Joi.object({
    name: requiredText('name'),
    description: requiredText('description'),
    headquarters: requiredText('headquarters'),
    leader: requiredText('leader'),
    minimumLevel
})
    .required()
    .messages({
        'object.base': 'Please provide a JSON object',
        'any.required': 'Please provide a JSON object'
    });

const validationOptions = {
    // Return the first validation error
    abortEarly: true,

    // Ignore additional fields, matching the previous behavior
    stripUnknown: { objects: true }
};

module.exports = {
    questSchema,
    guildSchema,
    validationOptions
};