const { ObjectId } = require('mongodb');
const { getDB } = require('../data/database');
const {
    guildSchema,
    validationOptions
} = require('../validation/schemas');

// Check IDs before using them in MongoDB queries
function isValidId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

// Shared Joi validation for POST and PUT
function validateGuild(body) {
    const { error, value } = guildSchema.validate(
        body,
        validationOptions
    );

    if (error) {
        return { error: error.details[0].message };
    }

    return { guild: value };
}

// GET all guilds, optionally filtered by name
async function getAllGuilds(req, res) {
    try {
        if (Object.keys(req.query).some((field) => field !== 'name')) {
            return res.status(400).json({
                message: 'Only the name query parameter is supported'
            });
        }

        const filter = {};

        if (req.query.name !== undefined) {
            if (
                typeof req.query.name !== 'string' ||
                !req.query.name.trim()
            ) {
                return res.status(400).json({
                    message: 'name must be a nonempty string'
                });
            }

            filter.name = req.query.name.trim();
        }

        const guilds = await getDB()
            .collection('guilds')
            .find(filter)
            .toArray();

        return res.status(200).json(guilds);
    } catch (error) {
        console.error('Error fetching guilds:', error.message);

        return res.status(500).json({
            message: 'Unable to retrieve guilds'
        });
    }
}

// GET one guild by ID
async function getGuildById(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid guild ID'
            });
        }

        const guild = await getDB().collection('guilds').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!guild) {
            return res.status(404).json({
                message: 'Guild not found'
            });
        }

        return res.status(200).json(guild);
    } catch (error) {
        console.error('Error fetching guild:', error.message);

        return res.status(500).json({
            message: 'Unable to retrieve guild'
        });
    }
}

// POST a new guild
async function createGuild(req, res) {
    try {
        const validation = validateGuild(req.body);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await getDB()
            .collection('guilds')
            .insertOne(validation.guild);

        return res.status(201).json({
            message: 'Guild created successfully!',
            id: result.insertedId
        });
    } catch (error) {
        console.error('Error creating guild:', error.message);

        return res.status(500).json({
            message: 'Unable to create guild'
        });
    }
}

// PUT updated guild information
async function updateGuild(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid guild ID'
            });
        }

        const validation = validateGuild(req.body);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await getDB().collection('guilds').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: validation.guild }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Guild not found'
            });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error updating guild:', error.message);

        return res.status(500).json({
            message: 'Unable to update guild'
        });
    }
}

// DELETE a guild only if no quests are assigned to it
async function deleteGuild(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid guild ID'
            });
        }

        const db = getDB();
        const guildId = new ObjectId(req.params.id);

        const guild = await db.collection('guilds').findOne({
            _id: guildId
        });

        if (!guild) {
            return res.status(404).json({
                message: 'Guild not found'
            });
        }

        // Check for assigned quests before allowing deletion
        const assignedQuest = await db.collection('quests').findOne({
            guildId
        });

        if (assignedQuest) {
            return res.status(409).json({
                message:
                    'This guild has assigned quests. Reassign or unassign them before deleting it.'
            });
        }

        const result = await db.collection('guilds').deleteOne({
            _id: guildId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Guild not found'
            });
        }

        return res.status(200).json({
            message: 'Guild deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting guild:', error.message);

        return res.status(500).json({
            message: 'Unable to delete guild'
        });
    }
}

module.exports = {
    getAllGuilds,
    getGuildById,
    createGuild,
    updateGuild,
    deleteGuild
};