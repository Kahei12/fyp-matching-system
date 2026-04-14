const mongoose = require('mongoose');
require('dotenv').config();

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });

    console.log('✅ Connected to MongoDB');

    const Project = require('../models/Project');
    const projects = await Project.find({}).lean().exec();

    console.log(`\n📊 Total projects: ${projects.length}\n`);

    projects.forEach((p, idx) => {
      console.log(`${idx + 1}. Code: ${p.code || 'N/A'} | Title: ${p.title.substring(0, 40)} | Popularity: ${p.popularity} (type: ${typeof p.popularity}) | Supervisor: ${p.supervisor}`);
    });

    // Check specific student preferences
    const Student = require('../models/Student');
    const student = await Student.findOne({ id: 's001' }).lean().exec();
    if (student) {
      console.log(`\n👤 Student s001 preferences: ${JSON.stringify(student.preferences)}`);
      console.log(`   preferencesSubmitted: ${student.preferencesSubmitted}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkProjects();
