require('dotenv').config();
const fs = require('fs');
const path = require('path');
// require pdf-parse with ESM interop guard
const _pdfLib = require('pdf-parse');
const pdf = (_pdfLib && _pdfLib.default) ? _pdfLib.default : _pdfLib;
const mongoose = require('mongoose');
const Project = require('../models/Project');

const PDF_PATH = path.resolve(__dirname, '..', 'ELEC S411F Supervisor Project List (CCS).pdf');

async function extractText() {
  const buffer = fs.readFileSync(PDF_PATH);
  const data = await pdf(buffer);
  return data.text;
}

function parseProjects(text) {
  const projects = [];
  // Try to match blocks that look like:
  // |  Code | D11  |
  // |  Title | Cybersecurity Dashboard... |
  // |  Supervisor | Alex |
  // |  Description | ... |
  // We'll normalize by removing leading/trailing pipes and spaces.
  const normalized = text.replace(/\r\n/g, '\n');
  // capture blocks: Code | ... Title | ... Supervisor | ... Description | ... until next Code or end
  const blockRegex = /Code\s*\|\s*([A-Z0-9\-]+)[\s\S]*?Title\s*\|\s*([\s\S]*?)Supervisor\s*\|\s*([\s\S]*?)Description\s*\|\s*([\s\S]*?)(?=(?:\n\s*Code\s*\|)|$)/gmi;

  let m;
  while ((m = blockRegex.exec(normalized)) !== null) {
    const code = (m[1] || '').trim();
    const title = (m[2] || '').trim().replace(/\|/g, '').trim();
    const supervisor = (m[3] || '').trim().replace(/\|/g, '').trim();
    let description = (m[4] || '').trim();
    // Clean trailing table artifacts
    description = description.split('\n').map(l => l.replace(/^\|?/, '').replace(/\|$/, '').trim()).join(' ');
    if (!title) continue;
    projects.push({
      code,
      title,
      supervisor,
      description,
      skills: [],
      popularity: 0,
      capacity: 2,
      status: 'active',
      createdAt: new Date()
    });
  }

  // Fallback: if nothing matched, try to capture Code: ... Title: ... style
  if (projects.length === 0) {
    const altRegex = /Code[:\s]*([A-Z0-9\-]+)[\s\S]*?Title[:\s]*(.+?)[\s\S]*?Supervisor[:\s]*(.+?)[\s\S]*?Description[:\s]*([\s\S]*?)(?=(?:\nCode[:\s])|$)/gmi;
    while ((m = altRegex.exec(normalized)) !== null) {
      const code = (m[1] || '').trim();
      const title = (m[2] || '').trim();
      const supervisor = (m[3] || '').trim();
      const description = (m[4] || '').trim();
      projects.push({ code, title, supervisor, description, skills: [], popularity: 0, capacity: 2, status: 'active', createdAt: new Date() });
    }
  }

  return projects;
}

async function upsertProjects(projects) {
  const results = { upserted: 0, updated: 0, skipped: 0, errors: [] };
  for (const p of projects) {
    try {
      const query = p.code ? { code: p.code } : { title: p.title };
      const update = {
        $set: {
          title: p.title,
          supervisor: p.supervisor,
          description: p.description,
          skills: p.skills || [],
          capacity: p.capacity || 2,
          popularity: p.popularity || 0,
          status: p.status || 'active',
          createdAt: p.createdAt || new Date(),
          department: p.department || null,
          category: p.category || null,
          code: p.code || null
        }
      };
      const res = await Project.updateOne(query, update, { upsert: true }).exec();
      if (res.upsertedCount && res.upsertedCount > 0) results.upserted++;
      else if (res.modifiedCount && res.modifiedCount > 0) results.updated++;
      else results.skipped++;
    } catch (err) {
      results.errors.push({ project: p.title, err: String(err) });
    }
  }
  return results;
}

async function run() {
  console.log('Parsing PDF and seeding projects (this requires pdf-parse installed).');
  if (!fs.existsSync(PDF_PATH)) {
    console.error('PDF not found at', PDF_PATH);
    process.exit(1);
  }
  const text = await extractText();
  const projects = parseProjects(text);
  console.log(`Parsed ${projects.length} project entries (best-effort).`);
  // save parsed projects for inspection before upsert
  try {
    const outPath = 'data/parsed_projects_raw.json';
    fs.writeFileSync(outPath, JSON.stringify(projects, null, 2), 'utf8');
    console.log(`Wrote parsed projects to ${outPath} for inspection`);
  } catch (e) {
    console.warn('Failed to write parsed projects file:', e);
  }

  // connect and upsert
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for seeding parsed projects');
  const res = await upsertProjects(projects);
  console.log('Seeding result:', res);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Fatal error parsing/seeding PDF:', err);
  process.exit(1);
});


