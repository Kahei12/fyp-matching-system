require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

const keywordToSkills = [
  { k: /machine learning|ml|deep learning/iu, skills: ['Machine Learning', 'Python'] },
  { k: /blockchain|smart contract|ethereum|hyperledger/iu, skills: ['Blockchain', 'Smart Contracts'] },
  { k: /iot|internet of things/iu, skills: ['IoT', 'Embedded Systems'] },
  { k: /mobile|android|ios/iu, skills: ['Mobile Development'] },
  { k: /data visualization|d3|visualization/iu, skills: ['Data Visualization', 'JavaScript'] },
  { k: /security|cybersecurity|vulnerability|intrusion|ids|nmap/iu, skills: ['Security', 'Penetration Testing'] },
  { k: /health|healthcare|medical/iu, skills: ['Healthcare', 'Data Analysis'] },
  { k: /network|nmap|scanner|wireshark/iu, skills: ['Network Security', 'Nmap'] },
  { k: /blockchain voting|voting/iu, skills: ['Blockchain', 'Security'] },
];

function deriveTitleFromDescription(desc) {
  if (!desc) return 'Untitled Project';
  // take first sentence up to punctuation
  const m = desc.match(/^(.*?[\.\!\?])\s/);
  let s = m ? m[1] : desc;
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > 80) s = s.slice(0, 77) + '...';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function inferSkills(desc) {
  const skills = new Set();
  for (const rule of keywordToSkills) {
    if (rule.k.test(desc || '')) {
      rule.skills.forEach(s => skills.add(s));
    }
  }
  return Array.from(skills);
}

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for auto-fill projects');

  const projects = await Project.find({}).exec();
  let updated = 0;
  for (const p of projects) {
    const updates = {};
    const title = (p.title || '').trim();
    if (!title || title.length <= 3) {
      updates.title = deriveTitleFromDescription(p.description || '');
    }
    // normalize supervisor
    if (!p.supervisor || (typeof p.supervisor === 'string' && p.supervisor.length <= 2)) {
      // try to infer from description by finding "Supervisor: Name"
      const supMatch = (p.description || '').match(/Supervisor[:\s]+([A-Z][a-zA-Z\s\.]+)/);
      if (supMatch) updates.supervisor = supMatch[1].trim();
      else if (!p.supervisor || p.supervisor.length <= 2) updates.supervisor = 'TBD';
    }
    // fill skills if empty
    if (!Array.isArray(p.skills) || p.skills.length === 0) {
      const inferred = inferSkills(p.description || p.title || '');
      if (inferred.length > 0) updates.skills = inferred;
    }
    // ensure capacity
    if (!p.capacity || typeof p.capacity !== 'number') updates.capacity = p.capacity || 2;

    if (Object.keys(updates).length > 0) {
      await Project.updateOne({ _id: p._id }, { $set: updates }).exec();
      updated++;
    }
  }

  await mongoose.disconnect();
  console.log(`Auto-fill complete. Updated ${updated} projects.`);
}

run().catch(err => {
  console.error('Auto-fill error:', err);
  mongoose.disconnect();
});


