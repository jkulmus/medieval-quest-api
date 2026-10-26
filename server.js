require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const passport = require('passport');

const { connectDB } = require('./data/database');
const configurePassport = require('./config/passport');

const app = express();
const port = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
    try {
        if (
            !process.env.SESSION_SECRET ||
            process.env.SESSION_SECRET.length < 32
        ) {
            throw new Error(
                'SESSION_SECRET must contain at least 32 characters'
            );
        }

        await connectDB();
        await configurePassport(passport);

        // Render forwards HTTPS requests through a proxy
        if (isProduction) {
            app.set('trust proxy', 1);
        }

        app.use(express.json());

        const sessionStore = MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            dbName: process.env.MONGODB_DB,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60
        });

        sessionStore.on('error', (error) => {
            console.error('Session store error:', error.message);
        });

        app.use(
            session({
                name: 'medieval.sid',
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: false,
                store: sessionStore,
                cookie: {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                }
            })
        );

        // Sessions must be available before Passport uses them
        app.use(passport.initialize());
        app.use(passport.session());

        app.use('/', require('./routes'));

        // Handle requests to routes that do not exist.
        app.use((req, res) => {
            return res.status(404).json({
                message: 'Route not found'
            });
        });

        // Handle malformed JSON and errors passed to Express
        app.use((error, req, res, next) => {
            if (res.headersSent) {
                return next(error);
            }

            if (error.type === 'entity.parse.failed') {
                return res.status(400).json({
                    message:
                        'Invalid JSON. Check your commas, quotes, and brackets.'
                });
            }

            if (error.type === 'entity.too.large') {
                return res.status(413).json({
                    message: 'Request body is too large'
                });
            }

            const status =
                Number.isInteger(error.status) &&
                error.status >= 400 &&
                error.status <= 599
                    ? error.status
                    : 500;

            console.error('Request failed:', error.message);

            return res.status(status).json({
                message:
                    status >= 500
                        ? 'An unexpected server error occurred'
                        : 'Unable to process this request'
            });
        });

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Startup failed:', error.message);
        process.exit(1);
    }
}

startServer();