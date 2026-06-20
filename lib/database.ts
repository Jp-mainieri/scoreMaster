import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'trustcheck.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
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
  seedMockData(db);
}

function seedMockData(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM socios').get() as { c: number }).c;
  if (count > 0) return;

  const insertSocio = db.prepare(`
    INSERT INTO socios (cnpj_basico, identificador_socio, nome_socio, cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade, faixa_etaria)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmpresa = db.prepare(`
    INSERT OR IGNORE INTO empresas (cnpj_basico, razao_social, natureza_juridica, capital_social, porte_empresa)
    VALUES (?, ?, ?, ?, ?)
  `);

  const mockData: Array<[string, string, string, string, string, string, string]> = [
    // Sócio 1: CARLOS EDUARDO MENDES — perfil limpo, 2 empresas
    ['11111111', '2', 'CARLOS EDUARDO MENDES', '***111111**', '49', '20150301', '4'],
    ['22222222', '2', 'CARLOS EDUARDO MENDES', '***111111**', '49', '20180615', '4'],
    // Sócio 2: FERNANDA SOUZA LIMA — investidor diversificado, 4 empresas
    ['33333333', '2', 'FERNANDA SOUZA LIMA', '***222222**', '49', '20120101', '3'],
    ['44444444', '2', 'FERNANDA SOUZA LIMA', '***222222**', '22', '20140520', '3'],
    ['55555555', '2', 'FERNANDA SOUZA LIMA', '***222222**', '49', '20160801', '3'],
    ['66666666', '2', 'FERNANDA SOUZA LIMA', '***222222**', '49', '20190301', '3'],
    // Sócio 3: ROBERTO ALVES COSTA — empresa passagem, várias baixadas
    ['77777777', '2', 'ROBERTO ALVES COSTA', '***333333**', '49', '20200101', '5'],
    ['88888888', '2', 'ROBERTO ALVES COSTA', '***333333**', '49', '20200201', '5'],
    ['99999999', '2', 'ROBERTO ALVES COSTA', '***333333**', '49', '20210301', '5'],
    // Sócio 4: PATRICIA GOMES FERREIRA — blindagem patrimonial
    ['10101010', '2', 'PATRICIA GOMES FERREIRA', '***444444**', '49', '20100101', '4'],
    ['20202020', '2', 'PATRICIA GOMES FERREIRA', '***444444**', '49', '20100201', '4'],
    ['30303030', '2', 'PATRICIA GOMES FERREIRA', '***444444**', '05', '20100301', '4'],
    // Sócio 5: JOAO BATISTA NUNES — concentracao serial, 8 empresas
    ['40404040', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20180101', '5'],
    ['50505050', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20180201', '5'],
    ['60606060', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20180301', '5'],
    ['70707070', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20190101', '5'],
    ['80808080', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20190201', '5'],
    ['90909090', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20200101', '5'],
    ['01010101', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20210101', '5'],
    ['12121212', '2', 'JOAO BATISTA NUNES', '***555555**', '49', '20220101', '5'],
  ];

  const insertMany = db.transaction((rows: typeof mockData) => {
    for (const row of rows) insertSocio.run(...row);
  });
  insertMany(mockData);

  const empresasMock: Array<[string, string, string, string, string]> = [
    ['11111111', 'MENDES SOLUCOES LTDA', '206-2', '50000.00', '01'],
    ['22222222', 'MENDES TECH SERVICOS LTDA', '206-2', '100000.00', '03'],
    ['33333333', 'LIMA CONSTRUCOES LTDA', '206-2', '500000.00', '03'],
    ['44444444', 'FL PARTICIPACOES SA', '204-6', '2000000.00', '05'],
    ['55555555', 'SOUZA LIMA AGRO LTDA', '206-2', '250000.00', '03'],
    ['66666666', 'FL LOGISTICA LTDA', '206-2', '180000.00', '03'],
    ['77777777', 'COSTA EXPRESS LTDA', '206-2', '1000.00', '01'],
    ['88888888', 'RC SERVICOS RAPIDOS LTDA', '206-2', '1000.00', '01'],
    ['99999999', 'ALVES COSTA COMERCIO ME', '213-5', '1000.00', '01'],
    ['10101010', 'PGF HOLDING SA', '204-6', '5000000.00', '05'],
    ['20202020', 'GOMES FERREIRA IMOVEIS LTDA', '206-2', '800000.00', '03'],
    ['30303030', 'PGF GESTAO PATRIMONIAL LTDA', '206-2', '300000.00', '03'],
    ['40404040', 'NUNES TRANSPORTES LTDA', '206-2', '50000.00', '01'],
    ['50505050', 'JBN CONSTRUCOES LTDA', '206-2', '50000.00', '01'],
    ['60606060', 'BATISTA CONSULTORIA LTDA', '206-2', '50000.00', '01'],
    ['70707070', 'NUNES ALIMENTOS LTDA', '206-2', '50000.00', '01'],
    ['80808080', 'JN TECNOLOGIA LTDA', '206-2', '50000.00', '01'],
    ['90909090', 'NUNES E CIA LTDA', '206-2', '50000.00', '01'],
    ['01010101', 'JBN COMERCIO LTDA', '206-2', '50000.00', '01'],
    ['12121212', 'BATISTA NUNES SERVICOS LTDA', '206-2', '50000.00', '01'],
  ];

  const insertEmpresasMany = db.transaction((rows: typeof empresasMock) => {
    for (const row of rows) insertEmpresa.run(...row);
  });
  insertEmpresasMany(empresasMock);
}

export function normalizarNome(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export interface SocioNaRede {
  cnpj_basico: string;
  razao_social: string | null;
  natureza_juridica: string | null;
  capital_social: string | null;
  porte_empresa: string | null;
  situacao_cadastral: string | null;
  situacao_especial: string | null;
  cnae_principal: string | null;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
}

export function buscarEmpresasDeSocio(nomeSocio: string, cpfMascarado?: string | null): SocioNaRede[] {
  const db = getDb();
  const nomeNorm = normalizarNome(nomeSocio);

  // Nomes comuns (ex: "JOSE CARLOS DA SILVA") colidem entre pessoas distintas.
  // O CPF mascarado (6 dígitos centrais visíveis) desambigua quando disponível.
  if (cpfMascarado) {
    const rows = db.prepare(`
      SELECT
        s.cnpj_basico,
        e.razao_social,
        e.natureza_juridica,
        e.capital_social,
        e.porte_empresa,
        sit.situacao_cadastral,
        sit.situacao_especial,
        sit.cnae_principal,
        s.qualificacao_socio,
        s.data_entrada_sociedade
      FROM socios s
      LEFT JOIN empresas e ON s.cnpj_basico = e.cnpj_basico
      LEFT JOIN situacoes sit ON s.cnpj_basico = sit.cnpj_basico
      WHERE s.nome_socio = ? AND s.cnpj_cpf_socio = ?
    `).all(nomeNorm, cpfMascarado) as SocioNaRede[];
    return rows;
  }

  const rows = db.prepare(`
    SELECT
      s.cnpj_basico,
      e.razao_social,
      e.natureza_juridica,
      e.capital_social,
      e.porte_empresa,
      sit.situacao_cadastral,
      sit.situacao_especial,
      sit.cnae_principal,
      s.qualificacao_socio,
      s.data_entrada_sociedade
    FROM socios s
    LEFT JOIN empresas e ON s.cnpj_basico = e.cnpj_basico
    LEFT JOIN situacoes sit ON s.cnpj_basico = sit.cnpj_basico
    WHERE s.nome_socio = ?
  `).all(nomeNorm) as SocioNaRede[];

  return rows;
}

export function upsertSituacao(cnpjBasico: string, data: {
  situacao_cadastral: string;
  situacao_especial?: string;
  cnae_principal?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO situacoes (cnpj_basico, situacao_cadastral, situacao_especial, cnae_principal, data_consulta)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(cnpj_basico) DO UPDATE SET
      situacao_cadastral = excluded.situacao_cadastral,
      situacao_especial = excluded.situacao_especial,
      cnae_principal = excluded.cnae_principal,
      data_consulta = excluded.data_consulta
  `).run(cnpjBasico, data.situacao_cadastral, data.situacao_especial ?? null, data.cnae_principal ?? null, new Date().toISOString());
}
