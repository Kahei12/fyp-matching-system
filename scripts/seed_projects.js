require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const projects = require('../data/projects_real');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for project seeding');

  for (const p of projects) {
    // upsert by code if available, otherwise by title
    const query = p.code ? { code: p.code } : { title: p.title };
    const update = {
      $set: {
        code: p.code,
        title: p.title,
        supervisor: p.supervisor,
        supervisorId: p.supervisorId || null,
        description: p.description,
        skills: p.skills || [],
        capacity: p.capacity || 1,
        popularity: p.popularity || 0,
        status: p.status || 'active',
        createdAt: p.createdAt || new Date(),
        department: p.department || null,
        category: p.category || null,
        // keep other fields as-is
      }
    };
    await Project.updateOne(query, update, { upsert: true }).exec();
    console.log(`Upserted project ${p.code || p.title}`);
  }

  await mongoose.disconnect();
  console.log('Project seeding done and disconnected.');
}

run().catch(err => {
  console.error('Project seeding error:', err);
  mongoose.disconnect();
});



