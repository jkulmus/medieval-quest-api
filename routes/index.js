const router = require('express').Router();

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Medieval Quest API!'
    });
});

router.use('/auth', require('./auth'));
router.use('/quests', require('./quests'));
router.use('/guilds', require('./guilds'));
router.use('/api-docs', require('./swagger'));

module.exports = router;