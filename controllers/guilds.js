const { ObjectId } = require('mongodb');
const { getDB } = require('../data/database');

function isValidId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

// Shared validation for POST and PUT
function validateGuild(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Please provide a JSON object' };
    }

    const textFields = [
        'name',
        'description',
        'headquarters',
        'leader'
    ];

    for (const field of textFields) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            return { error: `${field} must be a nonempty string` };
        }
    }

    if (!Number.isSafeInteger(body.minimumLevel) || body.minimumLevel < 1) {
        return { error: 'minimumLevel must be a whole number of at least 1' };
    }

    return {
        guild: {
            name: body.name.trim(),
            description: body.description.trim(),
            headquarters: body.headquarters.trim(),
            leader: body.leader.trim(),
            minimumLevel: body.minimumLevel
        }
    };
}

async function getAllGuilds(req, res) {
    try {
        // Optional name filter must be a nonempty string
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