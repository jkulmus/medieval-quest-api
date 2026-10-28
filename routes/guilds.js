const router = require('express').Router();
const guildsController = require('../controllers/guilds');
const { requireWriteAccess } = require('../middleware/auth');

// Public routes
router.get('/', guildsController.getAllGuilds);
router.get('/:id', guildsController.getGuildById);

// Everything below requires login and the request checks
router.use(requireWriteAccess);

router.post('/', guildsController.createGuild);
router.put('/:id', guildsController.updateGuild);
router.delete('/:id', guildsController.deleteGuild);

module.exports = router;