const router = require('express').Router();
const guildsController = require('../controllers/guilds');

router.get('/', guildsController.getAllGuilds);
router.get('/:id', guildsController.getGuildById);
router.post('/', guildsController.createGuild);
router.put('/:id', guildsController.updateGuild);
router.delete('/:id', guildsController.deleteGuild);

module.exports = router;