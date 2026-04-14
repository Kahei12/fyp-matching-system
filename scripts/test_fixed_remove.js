const mongoose = require('mongoose');
require('dotenv').config();

async function testFixedRemoveFlow() {
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

    // Reset to clean state
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: [], preferencesSubmitted: false } }
    ).exec();
    await Project.updateMany({}, { $set: { popularity: 0 } }).exec();
    console.log('✅ Reset to clean state\n');

    console.log('=== Scenario: Add 3 projects (not submitted), then remove one ===\n');

    // Simulate frontend localStorage state (after adding 3 projects)
    const localPrefs = [
      { id: 'D11', title: 'Cybersecurity Dashboard', supervisor: 'Alex', popularity: 0 },
      { id: 'D12', title: 'Social Engineering Tool', supervisor: 'Alex', popularity: 0 },
      { id: 'D13', title: 'Blockchain Voting', supervisor: 'Alex', popularity: 0 }
    ];

    console.log('📱 Frontend state (after adding 3 projects, NOT submitted):');
    console.log(`   preferences: ${localPrefs.map(p => p.id)}`);
    console.log(`   localStorage: ${JSON.stringify(localPrefs.map(p => p.id))}\n`);

    // Simulate remove "D12"
    console.log('🗑️ User clicks Remove on D12...');
    console.log('   → handleRemovePreference detects preferencesSubmitted=false');
    console.log('   → Updates local state only (no API call)');

    const newPrefs = localPrefs.filter(p => p.id !== 'D12');
    console.log(`\n✅ After removal (local only):`);
    console.log(`   preferences: ${newPrefs.map(p => p.id)}`);
    console.log(`   DB unchanged: preferences still []`);

    // Now simulate Submit
    console.log('\n📤 User clicks Submit Preferences...');
    console.log('   → Calls POST /api/student/s001/preferences/set with ["D11","D13"]');

    const studentService = require('../services/studentService');
    const submitResult = await studentService.setPreferences('s001', ['D11', 'D13']);
    console.log(`   Result: ${submitResult.success ? '✅ Success' : '❌ Failed'}`);

    // Check DB
    const student = await Student.findOne({ id: 's001' }).lean().exec();
    const projects = await Project.find({ code: { $in: ['D11', 'D12', 'D13'] } }).lean().exec();

    console.log('\n📊 DB state after submit:');
    console.log(`   s001.preferences: ${JSON.stringify(student.preferences)}`);
    console.log(`   s001.preferencesSubmitted: ${student.preferencesSubmitted}`);
    console.log('\n   Project popularity:');
    projects.forEach(p => {
      console.log(`     ${p.code}: ${p.popularity}`);
    });

    // Now test remove AFTER submit
    console.log('\n🗑️ Now try removing D11 (after submit)...');
    const removeResult = await studentService.removePreference('s001', 'D11');
    console.log(`   Result: ${removeResult.success ? '✅ Success' : '❌ Failed'}`);

    const finalStudent = await Student.findOne({ id: 's001' }).lean().exec();
    const finalProjects = await Project.find({ code: { $in: ['D11', 'D12', 'D13'] } }).lean().exec();

    console.log('\n📊 Final DB state:');
    console.log(`   s001.preferences: ${JSON.stringify(finalStudent.preferences)}`);
    console.log(`   s001.preferencesSubmitted: ${finalStudent.preferencesSubmitted}`);
    console.log('\n   Project popularity:');
    finalProjects.forEach(p => {
      console.log(`     ${p.code}: ${p.popularity}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testFixedRemoveFlow();
