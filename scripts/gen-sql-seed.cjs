const fs = require('fs');
const path = require('path');

const DATA = require('../src/data/bible-complete.json');

let sql = 'BEGIN TRANSACTION;\n';
sql += 'DELETE FROM version_verses;\n';
sql += 'DELETE FROM chapters;\n';

for (const ch of DATA) {
  const bid = ch.bookId;
  const cnum = ch.chapter;
  const sub = (ch.sub || '').replace(/'/g, "''");
  sql += `INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES ('${bid}', ${cnum}, '${sub}');\n`;
  for (const v of ch.verses) {
    if (v.dar) {
      const t = v.dar.replace(/'/g, "''");
      sql += `INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES ('dar','${bid}',${cnum},${v.verse},'${t}');\n`;
    }
    if (v.lsg) {
      const t = v.lsg.replace(/'/g, "''");
      sql += `INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES ('lsg','${bid}',${cnum},${v.verse},'${t}');\n`;
    }
    if (v.kjv) {
      const t = v.kjv.replace(/'/g, "''");
      sql += `INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES ('kjv','${bid}',${cnum},${v.verse},'${t}');\n`;
    }
  }
}

sql += "INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', '2');\n";
sql += 'COMMIT;\n';

// Escape for JS template literal
const escaped = sql
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\${/g, '\\${');

const out = `export const SEED_SQL = \`${escaped}\`;\n`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'bible-seed-sql.ts'), out);
const size = Buffer.byteLength(out, 'utf8');
console.log('Generated bible-seed-sql.ts:', (size / 1024 / 1024).toFixed(1), 'MB');
