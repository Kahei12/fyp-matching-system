require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for creating partial index (node)');

  try {
    // create partial unique index on code where code is a string
    await Project.collection.createIndex(
      { code: 1 },
      { unique: true, partialFilterExpression: { code: { $type: "string" } } }
    );
    console.log('Created partial unique index on projects.code');
  } catch (err) {
    console.error('Index creation error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Index script done and disconnected.');
  }
}

run().catch(err => {
  console.error('Index script fatal error:', err);
  mongoose.disconnect();
});


