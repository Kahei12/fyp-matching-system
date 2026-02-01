require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Project = require('../models/Project');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for backup & delete null-code projects');

  const docs = await Project.find({ code: null }).lean().exec();
  console.log(`Found ${docs.length} projects with code=null`);
  if (docs.length > 0) {
    const backupPath = 'data/backup_null_code_projects.json';
    fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`Backed up null-code projects to ${backupPath}`);
    const ids = docs.map(d => d._id);
    const res = await Project.deleteMany({ _id: { $in: ids } }).exec();
    console.log(`Deleted ${res.deletedCount} projects with code=null`);
  } else {
    console.log('No null-code projects found; nothing to delete.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Error in backup/delete:', err);
  mongoose.disconnect();
});


