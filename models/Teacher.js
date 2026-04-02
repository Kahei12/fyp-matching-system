const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  department: String,
  password: String,               // hashed password
  mustChangePassword: { type: Boolean, default: true },
  initialPassword: String
});

module.exports = mongoose.model('Teacher', TeacherSchema);











