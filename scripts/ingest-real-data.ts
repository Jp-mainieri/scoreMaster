/**
 * Ingests real Receita Federal CNPJ data (volume 1 of the 2026-06 release) into SQLite.
 * Source files live in data/rfb-raw/ (downloaded via WebDAV from arquivos.receitafederal.gov.br).
 *
 * Usage: npx tsx scripts/ingest-real-data.ts
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createReadStream } from 'fs';

const RAW_DIR = path.join(process.cwd(), 'data', 'rfb-raw');
const DB_PATH = path.join(process.cwd(), 'data', 'trustcheck.db');
const BATCH_SIZE = 10_000;
const LOG_INTERVAL = 200_000;

function normalizarNome(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Fields are quoted and semicolon-separated: "a";"b";"c"
function parseLine(line: string): string[] {
  if (line.length < 2) return [];
  return line.slice(1, -1).split('";"');
}

function findFile(suffix: string): string {
  const files = fs.readdirSync(RAW_DIR);
  const match = files.find((f) => f.endsWith(suffix));
  if (!match) throw new Error(`Arquivo ${suffix} não encontrado em ${RAW_DIR}`);
  return path.join(RAW_DIR, match);
}

function loadDomainTable(suffix: string): Map<string, string> {
  const filePath = findFile(suffix);
  const content = fs.readFileSync(filePath, { encoding: 'latin1' });
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    const [codigo, descricao] = parseLine(line.trim());
    if (codigo) map.set(codigo, descricao ?? '');
  }
  return map;
}

async function ingestEmpresas(db: Database.Database) {
  const filePath = findFile('EMPRECSV');
  const insert = db.prepare(`
    INSERT OR REPLACE INTO empresas (cnpj_basico, razao_social, natureza_juridica, capital_social, porte_empresa)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: string[][]) => {
    for (const r of rows) insert.run(r[0], r[1], r[2], r[3], r[4]);
  });

  const stream = createReadStream(filePath, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let batch: string[][] = [];
  let total = 0;
  const start = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseLine(line);
    if (cols.length < 6) continue;

    const cnpjBasico = cols[0];
    const razaoSocial = cols[1];
    const naturezaJuridica = cols[2];
    const capitalSocial = (cols[4] ?? '0').replace(',', '.');
    const porteEmpresa = cols[5];

    batch.push([cnpjBasico, razaoSocial, naturezaJuridica, capitalSocial, porteEmpresa]);

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % LOG_INTERVAL === 0) {
        console.log(`  Empresas: ${total.toLocaleString()} — ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
    }
  }
  if (batch.length > 0) {
    insertMany(batch);
    total += batch.length;
  }
  console.log(`Empresas concluído: ${total.toLocaleString()} registros em ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

async function ingestSocios(db: Database.Database) {
  const filePath = findFile('SOCIOCSV');
  const insert = db.prepare(`
    INSERT INTO socios (cnpj_basico, identificador_socio, nome_socio, cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade, faixa_etaria)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: string[][]) => {
    for (const r of rows) insert.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6]);
  });

  const stream = createReadStream(filePath, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let batch: string[][] = [];
  let total = 0;
  const start = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseLine(line);
    if (cols.length < 11) continue;

    batch.push([
      cols[0],
      cols[1],
      normalizarNome(cols[2] ?? ''),
      cols[3],
      cols[4],
      cols[5],
      cols[10],
    ]);

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % LOG_INTERVAL === 0) {
        console.log(`  Sócios: ${total.toLocaleString()} — ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
    }
  }
  if (batch.length > 0) {
    insertMany(batch);
    total += batch.length;
  }
  console.log(`Sócios concluído: ${total.toLocaleString()} registros em ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

const STATUS_MAP: Record<string, string> = {
  '01': 'Nula',
  '02': 'Ativa',
  '03': 'Suspensa',
  '04': 'Inapta',
  '08': 'Baixada',
};

async function ingestEstabelecimentos(db: Database.Database, cnaes: Map<string, string>) {
  const filePath = findFile('ESTABELE');
  const insert = db.prepare(`
    INSERT OR REPLACE INTO situacoes (cnpj_basico, situacao_cadastral, situacao_especial, cnae_principal, data_consulta)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: string[][]) => {
    for (const r of rows) insert.run(r[0], r[1], r[2], r[3], r[4]);
  });

  const stream = createReadStream(filePath, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let batch: string[][] = [];
  let total = 0;
  let skipped = 0;
  const start = Date.now();
  const now = new Date().toISOString();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseLine(line);
    if (cols.length < 30) continue;

    // Only matriz rows (cnpj_ordem = 0001) — situacoes is keyed by cnpj_basico
    if (cols[1] !== '0001') {
      skipped++;
      continue;
    }

    const cnpjBasico = cols[0];
    const situacaoCadastral = STATUS_MAP[cols[5]] ?? cols[5];
    const situacaoEspecial = cols[28] || '';
    const cnaeId = cols[11];
    const cnaeDescricao = cnaes.get(cnaeId) ?? cnaeId;

    batch.push([cnpjBasico, situacaoCadastral, situacaoEspecial, `${cnaeId} - ${cnaeDescricao}`, now]);

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % LOG_INTERVAL === 0) {
        console.log(`  Estabelecimentos (matriz): ${total.toLocaleString()} — ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
    }
  }
  if (batch.length > 0) {
    insertMany(batch);
    total += batch.length;
  }
  console.log(`Estabelecimentos concluído: ${total.toLocaleString()} matrizes (${skipped.toLocaleString()} filiais ignoradas) em ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Pasta não encontrada: ${RAW_DIR}`);
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
    CREATE TABLE IF NOT EXISTS empresas (
      cnpj_basico TEXT PRIMARY KEY,
      razao_social TEXT,
      natureza_juridica TEXT,
      capital_social TEXT,
      porte_empresa TEXT
    );
    CREATE TABLE IF NOT EXISTS situacoes (
      cnpj_basico TEXT PRIMARY KEY,
      situacao_cadastral TEXT,
      situacao_especial TEXT,
      cnae_principal TEXT,
      data_consulta TEXT
    );
  `);

  console.log('Limpando dados mockados...');
  db.exec('DELETE FROM socios; DELETE FROM empresas; DELETE FROM situacoes;');

  console.log('Carregando tabela de domínio Cnaes...');
  const cnaes = loadDomainTable('CNAECSV');
  console.log(`  ${cnaes.size.toLocaleString()} CNAEs carregados`);

  console.log('\nIngerindo Empresas...');
  await ingestEmpresas(db);

  console.log('\nIngerindo Sócios...');
  await ingestSocios(db);

  console.log('\nIngerindo Estabelecimentos (situação cadastral)...');
  await ingestEstabelecimentos(db, cnaes);

  console.log('\nCriando índices...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_nome_socio ON socios(nome_socio);
    CREATE INDEX IF NOT EXISTS idx_cnpj_basico ON socios(cnpj_basico);
  `);

  console.log('\nConcluído!');
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
