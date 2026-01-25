require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const mockData = require('../services/mockData');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for merging mock projects');

  const projects = mockData.projects || [];
  for (const p of projects) {
    // Prefer matching by code if present, otherwise by title
    const query = p.code ? { code: p.code } : { title: p.title };
    const update = {
      $setOnInsert: {
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
      },
      $set: {
        title: p.title,
        supervisor: p.supervisor,
        description: p.description,
        skills: p.skills || [],
        capacity: p.capacity || 1,
        popularity: p.popularity || 0,
        status: p.status || 'active',
        department: p.department || null,
        category: p.category || null,
        code: p.code || null
      }
    };
    await Project.updateOne(query, update, { upsert: true }).exec();
    console.log(`Merged mock project: ${p.title}`);
  }

  await mongoose.disconnect();
  console.log('Merge complete and disconnected.');
}

run().catch(err => {
  console.error('Merge error:', err);
  mongoose.disconnect();
});



