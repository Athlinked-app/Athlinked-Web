#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir, cb) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file === '.next' || file === 'dist') return;
      walk(fp, cb);
    } else {
      cb(fp);
    }
  });
}

function isCodeFile(file) {
  return exts.includes(path.extname(file));
}

let changed = 0;
walk(root, file => {
  if (!isCodeFile(file)) return;
  // skip config and script files
  if (file.includes('eslint.config') || file.includes('prefix-unused-vars.js')) return;
  let src = fs.readFileSync(file, 'utf8');

  // find simple top-level const/let/var declarations: const name =
  const declRegex = /(^|\n)\s*(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s/gm;
  let match;
  const toReplace = [];
  while ((match = declRegex.exec(src)) !== null) {
    const name = match[3];
    // ignore names that already start with _
    if (name.startsWith('_')) continue;
    // count occurrences
    const occurrences = (src.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length;
    if (occurrences === 1) {
      toReplace.push(name);
    }
  }

  if (toReplace.length > 0) {
    const unique = Array.from(new Set(toReplace));
    unique.forEach(name => {
      const re = new RegExp('\\b' + name + '\\b', 'g');
      src = src.replace(re, '_' + name);
    });
    fs.writeFileSync(file, src, 'utf8');
    changed += unique.length;
    console.log(`Patched ${file}: ${unique.join(', ')}`);
  }
});

console.log(`Total renamed identifiers: ${changed}`);
