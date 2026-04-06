const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  department: String,
  major: { 
    type: String, 
    enum: ['Computer and Cyber Security', 'Electronics and Computer Engineering', 'Computer and Cyber Security + Electronics and Computer Engineering'], 
    default: 'Computer and Cyber Security' 
  }, // Teacher's major
  password: String,               // hashed password
  mustChangePassword: { type: Boolean, default: true },
  initialPassword: String
});

module.exports = mongoose.model('Teacher', TeacherSchema);











