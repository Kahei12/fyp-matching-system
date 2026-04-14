const mongoose = require('mongoose');
require('dotenv').config();

async function testRemoveWhenNotSubmitted() {
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

    // Scenario: Student has preferences in localStorage but NOT in database
    // (because they added via "Add to Preferences" but didn't click Submit)
    console.log('=== Simulating: Added preferences locally but NOT submitted to DB ===\n');

    // Step 1: Clear DB preferences
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: [], preferencesSubmitted: false } }
    ).exec();
    console.log('✅ Cleared s001 preferences in DB\n');

    // Step 2: Check what frontend would have in localStorage (simulated)
    // Frontend localStorage would have: ["D11","D12","D13"]
    const localPrefs = ['D11', 'D12', 'D13'];
    console.log(`📱 Frontend localStorage preferences: ${JSON.stringify(localPrefs)}`);
    console.log(`   (These were added via "Add to Preferences" but not submitted)\n`);

    // Step 3: User clicks "Remove" on "D12" → calls DELETE API
    console.log('🗑️ User clicks Remove on D12 → calls DELETE /api/student/s001/preferences/D12');

    const studentService = require('../services/studentService');
    const result = await studentService.removePreference('s001', 'D12');

    console.log(`\nAPI Result:`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Current preferences count: ${result.currentPreferences}\n`);

    // Step 4: Check DB state
    const studentAfter = await Student.findOne({ id: 's001' }).lean().exec();
    console.log('👤 s001 DB state after DELETE:');
    console.log(`   preferences: ${JSON.stringify(studentAfter.preferences)}`);
    console.log(`   preferencesSubmitted: ${studentAfter.preferencesSubmitted}\n`);

    // Explanation
    console.log('🔍 Analysis:');
    if (!result.success && result.message === 'Project not in preferences') {
      console.log('   ❌ API returned "Project not in preferences"');
      console.log('   This is because DB preferences array is empty []');
      console.log('   Frontend localStorage has ["D11","D12","D13"] but DB does not');
      console.log('   → This is the BUG you are experiencing!\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testRemoveWhenNotSubmitted();
