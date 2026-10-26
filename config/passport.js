const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { ObjectId } = require('mongodb');
const { getDB } = require('../data/database');

async function configurePassport(passport) {
    const requireSettings = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CALLBACK_URL'
    ];

    for (const setting of requireSettings) {
        if (!process.env[setting]?.trim()) {
            throw new Error(`Missing environment setting: ${setting}`);
        }
    }

    const users = getDB().collection('users');

    // Each Google account should have only 1 user record
    await users.createIndex({ googleId: 1 }, { unique: true });

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                state: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    if (
                        typeof profile.id !== 'string' ||
                        !profile.id.trim()
                    ) {
                        return done(
                            new Error('Google did not return a valid user ID')
                        );
                    }

                    const now = new Date();

                    // Create user on 1st login and update the same user on later logins
                    await users.updateOne(
                        { googleId: profile.id },
                        {
                            $set: {
                                displayName: profile.displayName || '',
                                email: profile.email?.[0]?.value || null,
                                lastLoginAt: now
                            },
                            $setOnInsert: {
                                googleId: profile.id,
                                createdAt: now
                            }
                        },
                        { upsert: true }
                    );

                    const user = await users.findOne({
                        googleId: profile.id
                    });

                    return done(null, user || false);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Store only MongoDB user ID in the login session
    passport.serializeUser((user, done) => {
        done(null, user._id.toHexString());
    });

    // Retrieve user when thier session is used
    passport.deserializeUser(async (id, done) => {
        try {
            if (
                typeof id !== 'string' ||
                !/^[a-fA-F0-9]{24}$/.test(id)
            ) {
                return done(null, false);
            }

            const user = await users.findOne({
                _id: new ObjectId(id)
            });

            return done(null, user || false);
        } catch (error) {
            return done(error);
        }
    });
}

module.exports = configurePassport;