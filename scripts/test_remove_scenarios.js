const mongoose = require('mongoose');
require('dotenv').config();

async function testFullRemoveScenario() {
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

    // Scenario 1: Student with NOT submitted preferences (should allow delete)
    console.log('=== Scenario 1: preferencesSubmitted = false ===');
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: ['D11', 'D12', 'D13'], preferencesSubmitted: false } }
    ).exec();

    await Project.updateMany(
      { code: { $in: ['D11', 'D12', 'D13'] } },
      { $set: { popularity: 1 } }
    ).exec();

    const student1Before = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`👤 s001: preferences=${JSON.stringify(student1Before.preferences)}, submitted=${student1Before.preferencesSubmitted}`);

    const studentService = require('../services/studentService');
    const result1 = await studentService.removePreference('s001', 'D12');
    console.log(`Remove result: ${result1.success ? '✅ Success' : '❌ Failed'} - ${result1.message}`);

    const student1After = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`After: preferences=${JSON.stringify(student1After.preferences)}, submitted=${student1After.preferencesSubmitted}\n`);

    // Scenario 2: Student with submitted preferences (check if delete still works)
    console.log('=== Scenario 2: preferencesSubmitted = true ===');
    await Student.updateOne(
      { id: 's001' },
      { $set: { preferences: ['D11', 'D14', 'L11'], preferencesSubmitted: true } }
    ).exec();

    await Project.updateMany(
      { code: { $in: ['D11', 'D14', 'L11'] } },
      { $set: { popularity: 1 } }
    ).exec();

    const student2Before = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`👤 s001: preferences=${JSON.stringify(student2Before.preferences)}, submitted=${student2Before.preferencesSubmitted}`);

    const result2 = await studentService.removePreference('s001', 'D11');
    console.log(`Remove result: ${result2.success ? '✅ Success' : '❌ Failed'} - ${result2.message}`);

    const student2After = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`After: preferences=${JSON.stringify(student2After.preferences)}, submitted=${student2After.preferencesSubmitted}`);

    // Check if frontend would allow deletion based on locked state
    const locked = student2After.preferencesSubmitted;
    console.log(`\n🔒 Frontend locked state: ${locked ? 'true (button disabled)' : 'false (button enabled)'}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testFullRemoveScenario();
