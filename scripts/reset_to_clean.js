const mongoose = require('mongoose');
require('dotenv').config();

async function resetToCleanState() {
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

    const Student = require('../models/Student');
    const Project = require('../models/Project');

    // Reset all projects popularity to 0
    await Project.updateMany({}, { $set: { popularity: 0 } }).exec();
    console.log('✅ Reset all project popularity to 0');

    // Reset s001 to clean state (no preferences, not submitted)
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: [], preferencesSubmitted: false, assignedProject: null } }
    ).exec();
    console.log('✅ Reset s001 to clean state\n');

    const student = await Student.findOne({ id: 's001' }).lean().exec();
    console.log('👤 s001 final state:');
    console.log(`   Preferences: ${JSON.stringify(student.preferences)}`);
    console.log(`   preferencesSubmitted: ${student.preferencesSubmitted}`);
    console.log(`   assignedProject: ${student.assignedProject}`);

    const projects = await Project.find({ popularity: { $gt: 0 } }).lean().exec();
    console.log(`\n📊 Projects with popularity > 0: ${projects.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

resetToCleanState();
