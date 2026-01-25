require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for creating index');

  try {
    await Project.collection.createIndex({ code: 1 }, { unique: true, sparse: true });
    console.log('Created unique sparse index on projects.code');
  } catch (err) {
    console.error('Index creation error:', err);
  }

  await mongoose.disconnect();
  console.log('Index script done and disconnected.');
}

run().catch(err => {
  console.error('Index script error:', err);
  mongoose.disconnect();
});



