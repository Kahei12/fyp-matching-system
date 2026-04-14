const mongoose = require('mongoose');
require('dotenv').config();

async function testRemoveFlow() {
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

    // Simulate s001 having 10 preferences (as in reported bug)
    console.log('📝 Simulating s001 with 10 preferences (as reported in bug)...');
    await Student.updateOne(
      { id: 's001' },
      {
        $set: {
          preferences: ['D11', 'D12', 'D13', 'D14', 'L11', 'L12', 'L13', 'L14', 'L15', 'F11'],
          preferencesSubmitted: true
        }
      }
    ).exec();

    // Set popularity to 1 for all these projects
    await Project.updateMany(
      { code: { $in: ['D11', 'D12', 'D13', 'D14', 'L11', 'L12', 'L13', 'L14', 'L15', 'F11'] } },
      { $set: { popularity: 1 } }
    ).exec();

    const studentBefore = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`👤 s001 preferences: ${JSON.stringify(studentBefore.preferences)}`);
    console.log(`   preferencesSubmitted: ${studentBefore.preferencesSubmitted}\n`);

    // Now simulate trying to remove "L11" via DELETE API
    console.log('🗑️ Simulating DELETE /api/student/s001/preferences/L11');

    const studentService = require('../services/studentService');

    // Call removePreference with project ID as string (like frontend does)
    const result = await studentService.removePreference('s001', 'L11');
    console.log(`Service result: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Message: ${result.message}`);
    console.log(`Current preferences count: ${result.currentPreferences}\n`);

    // Verify
    const studentAfter = await Student.findOne({ id: 's001' }).lean().exec();
    console.log('👤 s001 after removal:');
    console.log(`   Preferences: ${JSON.stringify(studentAfter.preferences)}`);
    console.log(`   preferencesSubmitted: ${studentAfter.preferencesSubmitted}`);

    const proj = await Project.findOne({ code: 'L11' }).lean().exec();
    console.log(`\n📁 Project L11 popularity: ${proj.popularity}`);

    // Now test removing when preferencesSubmitted = true (submitted state)
    console.log('\n⚠️ Testing removal when preferencesSubmitted = true...');
    await Student.updateOne({ id: 's001' }, { $set: { preferencesSubmitted: true } }).exec();

    const result2 = await studentService.removePreference('s001', 'D12');
    console.log(`Result when submitted=true: ${result2.success ? '✅ Success' : '❌ Failed'} - ${result2.message}`);

    const studentFinal = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`   Final preferences: ${JSON.stringify(studentFinal.preferences)}`);
    console.log(`   preferencesSubmitted: ${studentFinal.preferencesSubmitted}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testRemoveFlow();
