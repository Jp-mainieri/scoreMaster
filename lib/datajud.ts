export interface ProcessoJudicial {
  numeroProcesso: string;
  tribunal: string;
  classe: { nome: string };
  assuntos: Array<{ nome: string }>;
  dataAjuizamento: string;
  grau: string;
  situacao: string;
}

// DataJud requires manual registration at datajud-wiki.cnj.jus.br
// Using realistic mock data until credentials are obtained
export async function consultarProcessos(cnpj: string): Promise<ProcessoJudicial[]> {
  const clean = cnpj.replace(/\D/g, '');

  // Deterministic mock based on CNPJ digits sum for demo consistency
  const digitSum = clean.split('').reduce((a, b) => a + parseInt(b), 0);

  if (digitSum % 5 === 0) return [];

  if (digitSum % 3 === 0) {
    return [
      {
        numeroProcesso: `${clean.slice(0, 7)}-${new Date().getFullYear()}.8.26.0100`,
        tribunal: 'TJSP',
        classe: { nome: 'Execução Fiscal' },
        assuntos: [{ nome: 'Tributos Municipais' }],
        dataAjuizamento: '2022-03-15',
        grau: 'G1',
        situacao: 'Em andamento',
      },
    ];
  }

  return [
    {
      numeroProcesso: `${clean.slice(0, 7)}-${new Date().getFullYear() - 1}.8.26.0050`,
      tribunal: 'TJSP',
      classe: { nome: 'Ação Trabalhista' },
      assuntos: [{ nome: 'Rescisão do Contrato de Trabalho' }],
      dataAjuizamento: '2021-09-20',
      grau: 'G1',
      situacao: 'Em andamento',
    },
    {
      numeroProcesso: `${clean.slice(0, 7)}-${new Date().getFullYear() - 2}.8.26.0100`,
      tribunal: 'TJSP',
      classe: { nome: 'Cobrança' },
      assuntos: [{ nome: 'Inadimplemento contratual' }],
      dataAjuizamento: '2020-01-10',
      grau: 'G1',
      situacao: 'Em andamento',
    },
  ];
}
