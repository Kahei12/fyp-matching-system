const mongoose = require('mongoose');
require('dotenv').config();

async function resetPopularity() {
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

    console.log('✅ Connected to MongoDB\n');

    const Project = require('../models/Project');
    const Student = require('../models/Student');

    // Reset all project popularity to 0
    const result = await Project.updateMany({}, { $set: { popularity: 0 } }).exec();
    console.log(`✅ Reset ${result.modifiedCount} projects to popularity = 0`);

    // Clear all student preferences
    const studentResult = await Student.updateMany({}, { $set: { preferences: [], preferencesSubmitted: false } }).exec();
    console.log(`✅ Cleared ${studentResult.modifiedCount} students' preferences\n`);

    // Verify
    const projects = await Project.find({}).lean().exec();
    console.log('📊 Verifying all projects have popularity 0:');
    let allZero = true;
    projects.forEach(p => {
      if (p.popularity !== 0) {
        console.log(`   ❌ ${p.code}: popularity = ${p.popularity}`);
        allZero = false;
      }
    });
    if (allZero) {
      console.log('   ✅ All projects have popularity 0\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

resetPopularity();
