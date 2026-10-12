const router = require('express').Router();

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Medieval Quest API!'
    });
});

router.use('/quests', require('./quests'));
router.use('/api-docs', require('./swagger'));

module.exports = router;