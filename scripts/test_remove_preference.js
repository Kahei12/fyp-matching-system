const mongoose = require('mongoose');
require('dotenv').config();

async function testRemovePreference() {
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

    // Setup: give s001 some preferences to start with
    console.log('📝 Setting up: giving s001 preferences ["D11", "D12", "D13"]');
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: ['D11', 'D12', 'D13'], preferencesSubmitted: false } }
    ).exec();

    // Update popularity for these projects (simulating addPreference behavior)
    await Project.updateMany(
      { code: { $in: ['D11', 'D12', 'D13'] } },
      { $set: { popularity: 1 } }
    ).exec();

    console.log('✅ Setup complete\n');

    // Check initial state
    const studentBefore = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`👤 Student s001 before remove:`);
    console.log(`   Preferences: ${JSON.stringify(studentBefore.preferences)}`);
    console.log(`   PreferencesSubmitted: ${studentBefore.preferencesSubmitted}`);

    const projectsBefore = await Project.find({ code: { $in: ['D11', 'D12', 'D13'] } }).lean().exec();
    console.log('\n📁 Project popularity before:');
    projectsBefore.forEach(p => {
      console.log(`   ${p.code}: ${p.popularity}`);
    });

    // Simulate removePreference API call
    console.log('\n🗑️ Removing preference "D12"...');

    const studentService = require('../services/studentService');
    const result = await studentService.removePreference('s001', 'D12');

    console.log(`Result: ${result.success ? '✅ Success' : '❌ Failed'} - ${result.message}`);

    // Check state after removal
    const studentAfter = await Student.findOne({ id: 's001' }).lean().exec();
    console.log('\n👤 Student s001 after remove:');
    console.log(`   Preferences: ${JSON.stringify(studentAfter.preferences)}`);
    console.log(`   PreferencesSubmitted: ${studentAfter.preferencesSubmitted}`);

    const projectsAfter = await Project.find({ code: { $in: ['D11', 'D12', 'D13'] } }).lean().exec();
    console.log('\n📁 Project popularity after:');
    projectsAfter.forEach(p => {
      console.log(`   ${p.code}: ${p.popularity}`);
    });

    // Test what happens when removing a non-existent preference
    console.log('\n⚠️ Testing removal of non-existent preference "ZZZ":');
    const result2 = await studentService.removePreference('s001', 'ZZZ');
    console.log(`Result: ${result2.success ? '✅ Success' : '❌ Failed'} - ${result2.message}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testRemovePreference();
