import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const KDB_CSV_PATH = '/tmp/alt-kdb/csv/kdb-20260403.csv';
const OUTPUT_FILE = path.join(__dirname, '../data/courses/kdb_dict.json');

interface KdBCourse {
  id: string;             // 科目番号
  name: string;           // 科目名
  credits: number;        // 単位数
  standardYear: string;   // 標準履修年次
  term: string;           // 開講モジュール (春Aなど)
  kdbCategory: string;    // KdB上の科目区分
}

async function run() {
  if (!fs.existsSync(KDB_CSV_PATH)) {
    console.error(`Error: KDB CSV not found at ${KDB_CSV_PATH}`);
    process.exit(1);
  }

  console.log(`Reading from ${KDB_CSV_PATH}...`);
  // CSV from alternative-tsukuba-kdb might be UTF-8 or Shift-JIS.
  // Actually alternative-kdb commits them as UTF-8 in their scripts/ actions.
  // Let's assume UTF-8 for now, but handle potential issues.
  
  const fileStream = fs.createReadStream(KDB_CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const kdbDict: Record<string, Partial<KdBCourse>> = {};
  let isFirstLine = true;

  for await (const line of rl) {
    // Basic CSV split for KDB format which is comma separated and possibly quoted
    // The format is typically:
    // 科目番号, 科目名, 授業方法, 単位数, 標準履修年次, 実施学期, 曜時限, 担当教員, 授業概要, 備考, ...
    // e.g. "01KA051", "経営基礎", "1", "1.0", "1", "春A", ...
    
    // Quick and dirty CSV parser for simple rows
    const match = line.match(/(?<=^|,)(?:"([^"]*)"|([^,]*))/g);
    if (!match) continue;
    
    const row = match.map(m => {
      let s = m;
      if (s.startsWith(',')) s = s.slice(1);
      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
      return s;
    });

    if (row.length < 5) continue;

    const id = row[0];
    const name = row[1];
    const creditsStr = row[3];
    const standardYear = row[4];
    const term = row[5];
    // Category or other info might be further down, but standardYear is crucial

    if (!id || id === '科目番号') continue;

    kdbDict[id] = {
      name,
      credits: parseFloat(creditsStr) || 0,
      standardYear,
      term,
    };
  }

  console.log(`Parsed ${Object.keys(kdbDict).length} courses.`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kdbDict, null, 2), 'utf-8');
  console.log(`Wrote KDB dict to ${OUTPUT_FILE}`);
}

run().catch(console.error);
