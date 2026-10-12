const { ObjectId } = require('mongodb');
const { getDB } = require('../data/database');

async function getAllQuests(req, res) {
    try {
        const quests = await getDB()
            .collection('quests')
            .find({})
            .toArray();
        
        res.status(200).json(quests)
    } catch (error) {
        console.error('Error fetching quests:', error.message);
        res.status(500).json({
            message: 'Unable to retrieve quests'
        });
    }
}

async function createQuest(req, res) {
    try {
        const body = req.body;

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({
                message: 'Please provide a JSON object'
            });
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
                return res.status(400).json({
                    message: `${field} must be a nonempty string`
                });
            }
        }

        const difficulty = body.difficulty.trim().toLowerCase();

        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({
                message: 'difficulty must be easy, medium, or hard'
            });
        }

        if (!Number.isSafeInteger(body.minimumLevel) || body.minimumLevel < 1) {
            return res.status(400).json({
                message: 'minimumLevel must be a whole number of at least '
            });
        }

        const db = getDB();
        let guildId = null;

        // Quests can be unassigned or linked to an existing guild
        if (body.guildId !== undefined && body.guildId !== null) {
            if (
                typeof body.guildId !== 'string' ||
                !/^[a-fA-F0-9]{24}$/.test(body.guildId)   
            ) {
                return res.status(400).json({
                    message: 'guildId must be a valid MongoDB ID or null'
                });
            }

            guildId = new ObjectId(body.guildId);

            const guild = await db.collection('guilds').findOne({
                _id: guildId
            });

            if (!guild) {
                return res.status(400).json({
                    message: 'The selected guild does not exist'
                });
            }
        }

        const quest = {
            title: body.title.trim(),
            description: body.description.trim(),
            difficulty,
            location: body.location.trim(),
            reward: body.reward.trim(),
            minimumLevel: body.minimumLevel,
            guildId
        };

        const result = await db.collection('quests').insertOne(quest);

        return res.status(201).json({
            message: 'Quest created successfully!',
            id: result.insertedId
        });
    } catch (error) {
        console.error('Error created quest:', error.message);

        return res.status(500).json({
            message: 'Unable to create quest'
        });
    }
}

module.exports = { getAllQuests, createQuest };