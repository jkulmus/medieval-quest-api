const router = require('express').Router();
const questsController = require('../controllers/quests');

router.get('/', questsController.getAllQuests);
router.get('/:id', questsController.getQuestById);
router.post('/', questsController.createQuest);
router.put('/:id', questsController.updateQuest);
router.delete('/:id', questsController.deleteQuest);

module.exports = router;