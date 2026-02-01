require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for listing projects');

  const total = await Project.countDocuments().exec();
  const withCode = await Project.countDocuments({ code: { $exists: true, $ne: null } }).exec();
  const withoutCode = total - withCode;

  console.log(`Total projects: ${total}`);
  console.log(`With code: ${withCode}`);
  console.log(`Without code: ${withoutCode}`);

  const samples = await Project.find({}).sort({ createdAt: -1 }).limit(50).lean().exec();
  console.log('--- Sample projects (latest 50) ---');
  samples.forEach(p => {
    console.log({
      _id: String(p._id),
      code: p.code || null,
      title: p.title,
      capacity: p.capacity,
      status: p.status,
      createdAt: p.createdAt
    });
  });

  // list distinct codes
  const codes = await Project.distinct('code').exec();
  console.log('--- distinct codes (count):', codes.length);
  console.log(codes.slice(0, 200));

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Error listing projects:', err);
  mongoose.disconnect();
});





