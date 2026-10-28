const router = require('express').Router();
const passport = require('passport');
const { requireWriteAccess } = require('../middleware/auth');

// Prevent browsers from caching authentication responses
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Send the user to Google to sign in
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Google returns the user here after sign-in
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/failed'
    }),
    (req, res) => {
        return res.redirect('/auth/me');
    }
);

// Handle an unsuccessful or cancelled sign-in
router.get('/failed', (req, res) => {
    return res.status(401).json({
        message: 'Google sign-in was unsuccessful. Please try again.'
    });
});

// Show the currently signed-in user
router.get('/me', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            message: 'You must log in to view your account'
        });
    }

    return res.status(200).json({
        message: 'You are logged in!',
        user: {
            id: req.user._id,
            displayName: req.user.displayName,
            email: req.user.email
        }
    });
});

router.post('/logout', requireWriteAccess, (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        req.session.destroy((error) => {
            if (error) {
                return next(error);
            }

            res.clearCookie('medieval.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            return res.status(200).json({
                message: 'You have been logged out successfully'
            });
        });
    });
});

module.exports = router;