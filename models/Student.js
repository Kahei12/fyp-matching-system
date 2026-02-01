const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id: String, // student id like "S001"
  name: String,
  email: String,
  gpa: Number,
  major: String,
  year: String,
  preferences: [String], // array of project ids (can be code or ObjectId string)
  proposalSubmitted: { type: Boolean, default: false },
  assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }
});

module.exports = mongoose.model('Student', StudentSchema);











