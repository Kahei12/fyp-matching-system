// Quick inspector for the installed pdf-parse module
try {
  const mod = require('pdf-parse');
  console.log('TYPEOF:', typeof mod);
  try { console.log('KEYS:', Object.keys(mod)); } catch (e) { console.log('KEYS: <cannot list>'); }
  console.log('HAS_DEFAULT:', !!(mod && mod.default));
  if (mod && mod.default) {
    console.log('TYPEOF default:', typeof mod.default);
    try { console.log('DEFAULT KEYS:', Object.keys(mod.default)); } catch (e) {}
  }
  console.log('toString:', String(mod).slice(0,200));
} catch (err) {
  console.error('Require error:', err);
  process.exit(1);
}



