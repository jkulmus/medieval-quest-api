const router = require('express').Router();
const questsController = require('../controllers/quests');
const { requireWriteAccess } = require('../middleware/auth');

// Public routes
router.get('/', questsController.getAllQuests);
router.get('/:id', questsController.getQuestById);

// Everything below requires login and the request checks
router.use(requireWriteAccess);

router.post('/', questsController.createQuest);
router.put('/:id', questsController.updateQuest);
router.delete('/:id', questsController.deleteQuest);

module.exports = router;