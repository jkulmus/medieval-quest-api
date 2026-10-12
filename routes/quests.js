const router = require('express').Router();
const questsController = require('../controllers/quests');

router.get('/', questsController.getAllQuests);
router.post('/', questsController.createQuest);

module.exports = router;