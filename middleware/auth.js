function requireWriteAccess(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            message: 'You must log in before making changes'
        });
    }

    if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
        return res.status(403).json({
            message: 'X-Requested-With header must be XMLHttpRequest'
        });
    }

    // Reject browser requests originating from another website
    const allowedOrigin = new URL(
        process.env.GOOGLE_CALLBACK_URL
    ).origin;

    const origin = req.get('Origin');

    if (origin && origin !== allowedOrigin) {
        return res.status(403).json({
            message: 'Requests from this origin are not allowed'
        });
    }

    return next();
}

module.exports = { requireWriteAccess };