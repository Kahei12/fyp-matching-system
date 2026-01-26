require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const PDF_PATH = path.resolve(__dirname, '..', 'ELEC S411F Supervisor Project List (CCS).pdf');
const OUT_PATH = path.resolve(__dirname, '..', 'data', 'pdf_raw.txt');

async function run() {
  const buffer = fs.readFileSync(PDF_PATH);
  const data = await pdf(buffer);
  fs.writeFileSync(OUT_PATH, data.text, 'utf8');
  console.log('Wrote raw PDF text to', OUT_PATH);
}

run().catch(err => {
  console.error('Error dumping PDF text:', err);
  process.exit(1);
});


