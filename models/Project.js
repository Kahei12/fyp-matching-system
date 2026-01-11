const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  code: String,
  title: String,
  supervisor: String,
  supervisorId: String,
  description: String,
  skills: [String],
  capacity: Number,
  popularity: { type: Number, default: 0 },
  status: String,
  createdAt: Date,
  department: String,
  category: String
});

module.exports = mongoose.model('Project', ProjectSchema);


