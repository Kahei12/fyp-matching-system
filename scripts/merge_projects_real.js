require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const projectsReal = require('../data/projects_real');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for merging projects');

  // ensure unique index on code (sparse so null codes allowed)
  try {
    await Project.collection.createIndex({ code: 1 }, { unique: true, sparse: true });
    console.log('Ensured unique index on code (sparse).');
  } catch (err) {
    console.log('Index creation warning:', err.message);
  }

  for (const p of projectsReal) {
    // Try to find existing project by exact title (case-sensitive)
    const existing = await Project.findOne({ title: p.title }).exec();
    if (existing) {
      // update fields but do not overwrite arbitrary existing fields
      existing.code = p.code || existing.code;
      existing.supervisor = p.supervisor || existing.supervisor;
      existing.description = p.description || existing.description;
      existing.skills = p.skills && p.skills.length ? p.skills : existing.skills;
      existing.capacity = p.capacity || existing.capacity || 1;
      existing.popularity = p.popularity || existing.popularity || 0;
      existing.status = p.status || existing.status || 'active';
      existing.department = p.department || existing.department;
      existing.category = p.category || existing.category;
      existing.createdAt = existing.createdAt || p.createdAt || new Date();
      await existing.save();
      console.log(`Updated existing project by title: ${p.title}`);
    } else {
      // insert new document
      const doc = new Project({
        code: p.code,
        title: p.title,
        supervisor: p.supervisor,
        description: p.description,
        skills: p.skills || [],
        capacity: p.capacity || 1,
        popularity: p.popularity || 0,
        status: p.status || 'active',
        createdAt: p.createdAt || new Date(),
        department: p.department || null,
        category: p.category || null
      });
      await doc.save();
      console.log(`Inserted new project: ${p.title}`);
    }
  }

  await mongoose.disconnect();
  console.log('Merge complete and disconnected.');
}

run().catch(err => {
  console.error('Merge error:', err);
  mongoose.disconnect();
});


