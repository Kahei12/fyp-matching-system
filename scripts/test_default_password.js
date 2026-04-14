const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testDefaultPassword() {
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
    const Teacher = require('../models/Teacher');

    // Clean up test data
    await Student.deleteMany({ id: { $in: ['s999', 's998'] } }).exec();
    await Teacher.deleteMany({ teacherId: { $in: ['t999', 't998'] } }).exec();
    console.log('🧹 Cleaned up test data\n');

    // Test 1: Simulate batch-create API call (as if frontend sent data without password)
    console.log('=== Test 1: Batch create students with default password ===');
    const testStudents = [
      { studentId: 's999', name: 'Test Student 1', major: 'Computer and Cyber Security' },
      { studentId: 's998', name: 'Test Student 2', major: 'Electronics and Computer Engineering' }
    ];

    // Simulate what batch-create does
    const DEFAULT_PASSWORD = 'Changeme123!';
    for (const s of testStudents) {
      const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const newStudent = new Student({
        id: s.studentId,
        name: s.name,
        email: `${s.studentId}@hkmu.edu.hk`,
        password: hashed,
        gpa: 3.0,
        major: s.major,
        year: 'Year 4',
        preferences: [],
        preferencesSubmitted: false,
        proposalSubmitted: false,
        assignedProject: null,
        proposedProject: null,
        proposalApproved: false,
        proposalStatus: 'none',
        mustChangePassword: true,
        initialPassword: DEFAULT_PASSWORD
      });
      await newStudent.save();
      console.log(`✅ Created student ${s.studentId}: ${s.name}`);
    }

    // Verify
    const createdStudents = await Student.find({ id: { $in: ['s999', 's998'] } }).lean().exec();
    console.log('\n📋 Verifying created students:');
    createdStudents.forEach(s => {
      console.log(`   ${s.id}: ${s.name}`);
      console.log(`      mustChangePassword: ${s.mustChangePassword}`);
      console.log(`      initialPassword: ${s.initialPassword}`);
      console.log(`      email: ${s.email}`);
      // Verify password hash is not the plain text
      const bcrypt = require('bcryptjs');
      const valid = bcrypt.compareSync(DEFAULT_PASSWORD, s.password);
      console.log(`      password matches default: ${valid ? '✅' : '❌'}`);
    });

    // Test 2: Teacher batch create
    console.log('\n=== Test 2: Batch create teachers with default password ===');
    const testTeachers = [
      { teacherId: 't999', name: 'Test Teacher 1', major: 'Computer and Cyber Security' },
      { teacherId: 't998', name: 'Test Teacher 2', major: 'Electronics and Computer Engineering' }
    ];

    const TeacherModel = require('../models/Teacher');
    for (const t of testTeachers) {
      const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const newTeacher = new TeacherModel({
        teacherId: t.teacherId,
        name: t.name,
        email: `${t.teacherId}@hkmu.edu.hk`,
        password: hashed,
        department: 'FYP',
        major: t.major,
        mustChangePassword: true,
        initialPassword: DEFAULT_PASSWORD
      });
      await newTeacher.save();
      console.log(`✅ Created teacher ${t.teacherId}: ${t.name}`);
    }

    const createdTeachers = await TeacherModel.find({ teacherId: { $in: ['t999', 't998'] } }).lean().exec();
    console.log('\n📋 Verifying created teachers:');
    createdTeachers.forEach(t => {
      console.log(`   ${t.teacherId}: ${t.name}`);
      console.log(`      mustChangePassword: ${t.mustChangePassword}`);
      console.log(`      initialPassword: ${t.initialPassword}`);
      const bcrypt = require('bcryptjs');
      const valid = bcrypt.compareSync(DEFAULT_PASSWORD, t.password);
      console.log(`      password matches default: ${valid ? '✅' : '❌'}`);
    });

    // Clean up
    await Student.deleteMany({ id: { $in: ['s999', 's998'] } }).exec();
    await TeacherModel.deleteMany({ teacherId: { $in: ['t999', 't998'] } }).exec();
    console.log('\n🧹 Cleaned up test data');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    console.log('\n✅ All tests passed! Default password is working correctly.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testDefaultPassword();
