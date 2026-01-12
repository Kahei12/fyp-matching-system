const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  department: String
});

module.exports = mongoose.model('Teacher', TeacherSchema);



