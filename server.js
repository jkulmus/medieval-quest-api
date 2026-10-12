require('dotenv').config();

const express = require('express');
const { connectDB } = require('./data/database');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use('/', require('./routes'));

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