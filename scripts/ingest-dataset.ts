/**
 * Ingests Receita Federal SOCIOCSV files into SQLite.
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/ingest-dataset.ts <path-to-socio-csv>
 *
 * CSV format: semicolon-separated, Latin-1 encoding, no header row.
 * Columns: cnpj_basico; identificador_socio; nome_socio; cnpj_cpf_socio;
 *          qualificacao_socio; data_entrada_sociedade; pais; representante_legal;
 *          nome_representante; qualificacao_representante_legal; faixa_etaria
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createReadStream } from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'trustcheck.db');
const BATCH_SIZE = 10_000;
const LOG_INTERVAL = 100_000;

function normalizarNome(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

async function ingest(csvPath: string) {
  if (!fs.existsSync(csvPath)) {
    console.error(`Arquivo não encontrado: ${csvPath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS socios (
      cnpj_basico TEXT,
      identificador_socio TEXT,
      nome_socio TEXT,
      cnpj_cpf_socio TEXT,
      qualificacao_socio TEXT,
      data_entrada_sociedade TEXT,
      faixa_etaria TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_nome_socio ON socios(nome_socio);
    CREATE INDEX IF NOT EXISTS idx_cnpj_basico ON socios(cnpj_basico);
  `);

  const insert = db.prepare(`
    INSERT INTO socios (cnpj_basico, identificador_socio, nome_socio, cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade, faixa_etaria)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: string[][]) => {
    for (const row of rows) insert.run(...(row as [string, string, string, string, string, string, string]));
  });

  const stream = createReadStream(csvPath, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let batch: string[][] = [];
  let total = 0;
  const start = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(';');
    if (cols.length < 11) continue;

    const row = [
      cols[0]?.trim() ?? '',
      cols[1]?.trim() ?? '',
      normalizarNome(cols[2]?.trim() ?? ''),
      cols[3]?.trim() ?? '',
      cols[4]?.trim() ?? '',
      cols[5]?.trim() ?? '',
      cols[10]?.trim() ?? '',
    ];

    batch.push(row);

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % LOG_INTERVAL === 0) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  ${total.toLocaleString()} linhas inseridas — ${elapsed}s`);
      }
    }
  }

  if (batch.length > 0) {
    insertMany(batch);
    total += batch.length;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nConcluído: ${total.toLocaleString()} registros em ${elapsed}s`);
  db.close();
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: npx ts-node scripts/ingest-dataset.ts <caminho-do-csv>');
  process.exit(1);
}

ingest(csvPath).catch(console.error);
