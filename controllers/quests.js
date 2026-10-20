const { ObjectId } = require('mongodb');
const { getDB } = require('../data/database');

// Check IDs before using them in MongoDB queries
function isValidId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

// Shared validation for creating and updating quests
async function validateQuest(body, db) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Please provide a JSON object' };
    }

    const textFields = [
        'title',
        'description',
        'difficulty',
        'location',
        'reward'
    ];

    for (const field of textFields) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            return { error: `${field} must be a nonempty string` };
        }
    }

    const difficulty = body.difficulty.trim().toLowerCase();

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return { error: 'difficulty must be easy, medium, or hard' };
    }

    if (!Number.isSafeInteger(body.minimumLevel) || body.minimumLevel < 1) {
        return { error: 'minimumLevel must be a whole number of at least 1' };
    }

    let guildId = null;

    // Quests can be unassigned or linked to an existing guild
    if (body.guildId !== undefined && body.guildId !== null) {
        if (!isValidId(body.guildId)) {
            return { error: 'guildId must be a valid MongoDB ID or null' };
        }

        guildId = new ObjectId(body.guildId);

        const guild = await db.collection('guilds').findOne({
            _id: guildId
        });

        if (!guild) {
            return { error: 'The selected guild does not exist' };
        }
    }

    return {
        quest: {
            title: body.title.trim(),
            description: body.description.trim(),
            difficulty,
            location: body.location.trim(),
            reward: body.reward.trim(),
            minimumLevel: body.minimumLevel,
            guildId
        }
    };
}

// GET all quests (filtered by difficulty)
async function getAllQuests(req, res) {
    try {
        const allowedQueryFields = ['difficulty'];

        if (
            Object.keys(req.query).some(
                (field) => !allowedQueryFields.includes(field)
            )
        ) {
            return res.status(400).json({
                message: 'Only the difficulty query parameter is supported'
            });
        }

        const filter = {};

        if (req.query.difficulty !== undefined) {
            if (
                typeof req.query.difficulty !== 'string' ||
                !['easy', 'medium', 'hard'].includes(req.query.difficulty)
            ) {
                return res.status(400).json({
                    message: 'difficulty must be easy, medium, or hard'
                });
            }

            filter.difficulty = req.query.difficulty;
        }

        const quests = await getDB()
            .collection('quests')
            .find(filter)
            .toArray();

        return res.status(200).json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error.message);

        return res.status(500).json({
            message: 'Unable to retrieve quests'
        });
    }
}

// GET one quest by ID
async function getQuestById(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid quest ID'
            });
        }

        const quest = await getDB().collection('quests').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!quest) {
            return res.status(404).json({
                message: 'Quest not found'
            });
        }

        return res.status(200).json(quest);
    } catch (error) {
        console.error('Error fetching quest:', error.message);

        return res.status(500).json({
            message: 'Unable to retrieve quest'
        });
    }
}

// POST a new quest
async function createQuest(req, res) {
    try {
        const db = getDB();
        const validation = await validateQuest(req.body, db);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await db
            .collection('quests')
            .insertOne(validation.quest);

        return res.status(201).json({
            message: 'Quest created successfully!',
            id: result.insertedId
        });
    } catch (error) {
        console.error('Error creating quest:', error.message);

        return res.status(500).json({
            message: 'Unable to create quest'
        });
    }
}

// PUT updated quest information
async function updateQuest(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid quest ID'
            });
        }

        const db = getDB();
        const validation = await validateQuest(req.body, db);

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await db.collection('quests').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: validation.quest }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Quest not found'
            });
        }

        // A 204 response does not include a response body
        return res.status(204).send();
    } catch (error) {
        console.error('Error updating quest:', error.message);

        return res.status(500).json({
            message: 'Unable to update quest'
        });
    }
}

// DELETE one quest
async function deleteQuest(req, res) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Please provide a valid quest ID'
            });
        }

        const result = await getDB().collection('quests').deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Quest not found'
            });
        }

        return res.status(200).json({
            message: 'Quest deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting quest:', error.message);

        return res.status(500).json({
            message: 'Unable to delete quest'
        });
    }
}

module.exports = {
    getAllQuests,
    getQuestById,
    createQuest,
    updateQuest,
    deleteQuest
};