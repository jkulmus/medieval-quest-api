require('dotenv').config();

const express = require('express');
const { connectDB } = require('./data/database');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use('/', require('./routes'));

// Handle requests to routes that do not exist
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
      message: 'Invalid JSON. Check your commas, quotes, and brackets.'
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

async function startServer() {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

startServer();