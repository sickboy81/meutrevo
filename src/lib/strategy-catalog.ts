import { LOTTERY_CONFIGS } from './lottery-math';

export type StrategyCatalogEntry = {
  id: string;
  name: string;
  shortDescription: string;
  analyzed: string[];
  notAnalyzed: string[];
  method: string[];
  example: string;
  backtest: string;
  kind: 'numeric' | 'adapted';
};

const numeric: Record<string, Omit<StrategyCatalogEntry, 'id' | 'name'>> = {
  megasena: {
    kind: 'numeric',
    shortDescription:
      'Leitura descritiva de frequencia, recencia e composicao.',
    analyzed: [
      'Frequencia total e nas janelas recentes',
      'Atraso observado por dezena',
      'Soma, pares e repeticoes do concurso anterior',
      'Pares e trincas recorrentes',
    ],
    notAnalyzed: [
      'Resultado futuro',
      'Probabilidade individual maior por causa do historico',
      'Numeros com garantia de acerto',
    ],
    method: [
      'Seleciona uma composicao equilibrada dentro das faixas historicas',
      'Mistura dezenas quentes, neutras e frias',
      'Exibe score de aderencia, nunca de previsao',
    ],
    example:
      'Um jogo pode ter 3 dezenas quentes, 2 neutras e 1 fria, desde que a composicao fique dentro das faixas observadas.',
    backtest:
      'Quando houver historico suficiente, compara a composicao com tres jogos aleatorios usando apenas dados anteriores ao concurso avaliado.',
  },
  quina: {
    kind: 'numeric',
    shortDescription:
      'Composicao de cinco dezenas baseada em historico e distribuicao.',
    analyzed: [
      'Frequencia e atraso',
      'Soma e paridade',
      'Repeticao do concurso anterior',
      'Coocorrencia de pares e trincas',
    ],
    notAnalyzed: [
      'Previsao de dezenas',
      'Garantia de premio',
      'Vantagem matematica sobre uma aposta simples',
    ],
    method: [
      'Evita concentracao excessiva',
      'Distribui dezenas por faixas do volante',
      'Registra a janela e o corte usados na analise',
    ],
    example:
      'A recomendacao descreve por que um jogo foi montado, mas nao afirma que ele e mais provavel.',
    backtest:
      'A comparacao historica e descritiva e usa corte temporal para evitar vazamento do resultado testado.',
  },
  lotomania: {
    kind: 'numeric',
    shortDescription:
      'Analise de distribuicao ampla para os 50 numeros da Lotomania.',
    analyzed: [
      'Frequencia e atraso',
      'Carga por linhas e colunas',
      'Soma e paridade',
      'Repeticao e sequencias',
    ],
    notAnalyzed: [
      'Previsao do resultado',
      'Garantia de 20 acertos ou 0 acertos',
      'Aumento de chance por classificacao historica',
    ],
    method: [
      'Prioriza cobertura estrutural do volante',
      'Mostra o custo antes da geracao',
      'Permite revisar a composicao antes de salvar',
    ],
    example:
      'O painel informa quais faixas foram atendidas e quais ficaram fora do historico selecionado.',
    backtest:
      'O desempenho passado e comparado com jogos aleatorios equivalentes, sem promessa de repeticao.',
  },
  duplasena: {
    kind: 'numeric',
    shortDescription:
      'Estrategia descritiva para os dois sorteios da Dupla Sena.',
    analyzed: [
      'Frequencia consolidada',
      'Recencia e atraso',
      'Paridade e soma',
      'Repeticoes e coocorrencias',
    ],
    notAnalyzed: [
      'Previsao do primeiro ou segundo sorteio',
      'Dependencia entre sorteios',
      'Garantia de faixa de premio',
    ],
    method: [
      'Trata a combinacao como uma escolha independente do resultado',
      'Mantem registro do concurso de corte',
      'Separa criterio historico de probabilidade',
    ],
    example:
      'Um jogo pode ser equilibrado nas faixas sem ser chamado de ideal ou certeiro.',
    backtest:
      'Avaliacao movel com dados anteriores e comparacao contra jogos aleatorios.',
  },
  diadesorte: {
    kind: 'numeric',
    shortDescription:
      'Historico de dezenas e mes da Dia de Sorte em um painel auditavel.',
    analyzed: [
      'Frequencia das dezenas',
      'Atraso e recencia',
      'Soma, paridade e repeticao',
      'Distribuicao estrutural',
    ],
    notAnalyzed: [
      'Previsao do mes da sorte',
      'Certeza de acerto',
      'Relacao causal entre atraso e resultado futuro',
    ],
    method: [
      'Mostra separadamente o que e historico e o que e escolha do usuario',
      'Evita tratar atraso como sinal de retorno',
      'Permite comparar configuracoes antes de gerar',
    ],
    example:
      'A analise do mes da sorte e apresentada como frequencia observada, nao como indicacao de mes futuro.',
    backtest:
      'Quando aplicavel, compara a regra com aleatorio em janela movel e reporta a diferenca sem superlativos.',
  },
  timemania: {
    kind: 'numeric',
    shortDescription: 'Analise de dezenas e composicao para a Timemania.',
    analyzed: [
      'Frequencia, atraso e recencia',
      'Paridade e soma',
      'Linhas, colunas e sequencias',
      'Repeticao do concurso anterior',
    ],
    notAnalyzed: [
      'Time do Coracao como previsao',
      'Resultado futuro',
      'Maior chance por dezenas quentes',
    ],
    method: [
      'Organiza dezenas em vez de prometer palpite',
      'Explica criterios aceitos e reprovados',
      'Conserva o snapshot usado na geracao',
    ],
    example:
      'A escolha do Time do Coracao fica separada da analise numerica e nao altera a probabilidade do sorteio.',
    backtest:
      'Resultado historico apenas para comparar aderencia da regra contra jogos aleatorios.',
  },
  maismilionaria: {
    kind: 'numeric',
    shortDescription:
      'Leitura de dezenas e trevos com separacao clara entre dados e escolha.',
    analyzed: [
      'Frequencia e atraso das dezenas',
      'Paridade, soma e distribuicao',
      'Recencia e repeticao',
      'Composicao dos trevos quando houver dados',
    ],
    notAnalyzed: [
      'Previsao de trevos',
      'Garantia de premio',
      'Aumento de probabilidade',
    ],
    method: [
      'Exibe os componentes usados na composicao',
      'Mantem criterios historicos em faixas',
      'Permite revisar custo e jogos antes de salvar',
    ],
    example:
      'Dezenas e trevos sao tratados como componentes distintos no resumo da estrategia.',
    backtest:
      'Compara somente o componente numerico que possui historico confiavel e explicita limitacoes.',
  },
};

const adapted: Record<string, Omit<StrategyCatalogEntry, 'id' | 'name'>> = {
  lotofacil: {
    kind: 'numeric',
    shortDescription:
      'Composicao de 15 dezenas com leitura recente e estrutura do volante.',
    analyzed: [
      'Frequencia total e nas janelas de 100, 30 e 10 concursos',
      'Atraso e recencia',
      'Moldura, centro, linhas e colunas',
      'Soma, sequencias e repeticoes',
      'Pares e trincas recorrentes',
    ],
    notAnalyzed: [
      'Numero garantido',
      'Soma que garanta resultado',
      'Aumento de chance por estar atrasado',
    ],
    method: [
      'Mistura quentes, neutras e frias',
      'Mantem 9 a 11 dezenas na moldura quando o historico permitir',
      'Exibe a faixa de repeticao do concurso anterior',
    ],
    example:
      'O jogo e considerado aderente quando atende varias faixas historicas; cada criterio pode ser revisado individualmente.',
    backtest:
      'Backtest movel usa somente concursos anteriores ao avaliado e compara com tres jogos aleatorios.',
  },
  supersete: {
    kind: 'adapted',
    shortDescription:
      'Analise por colunas, respeitando a estrutura especifica do Super Sete.',
    analyzed: [
      'Frequencia por coluna',
      'Recencia e atraso observados',
      'Distribuicao de digitos',
      'Custo e quantidade de combinacoes',
    ],
    notAnalyzed: [
      'Previsao de digitos',
      'Garantia de acertos',
      'Comparacao indevida com loterias de dezenas',
    ],
    method: [
      'Trata cada coluna como componente proprio',
      'Mostra quando uma metrica nao se aplica',
      'Evita score numerico enganoso para estruturas diferentes',
    ],
    example:
      'A estrategia informa a cobertura de cada coluna e deixa claro onde existe apenas descricao historica.',
    backtest:
      'Somente metricas compativeis com o formato do jogo entram na comparacao.',
  },
  loteca: {
    kind: 'adapted',
    shortDescription:
      'Conferencia de resultados esportivos sem transformar historico em palpite.',
    analyzed: [
      'Historico de resultados publicados',
      'Distribuicao de placares e desfechos quando disponivel',
      'Concurso, data e atualizacao da fonte',
    ],
    notAnalyzed: [
      'Desempenho dos times no futuro',
      'Lesoes, escalações ou odds em tempo real',
      'Previsao esportiva',
    ],
    method: [
      'Prioriza fonte oficial e data do resultado',
      'Marca informacao ausente em vez de inventar score',
      'Permite conferir o concurso antes de registrar jogos',
    ],
    example:
      'Se nao houver dado confiavel para um criterio, o painel informa a limitacao explicitamente.',
    backtest:
      'Nao aplica o mesmo modelo de dezenas; qualquer comparacao deve ser especifica para resultados esportivos.',
  },
  loteriafederal: {
    kind: 'adapted',
    shortDescription:
      'Consulta e conferencia dos bilhetes publicados pela fonte oficial.',
    analyzed: [
      'Concurso, data e extracao publicada',
      'Historico de bilhetes quando disponivel',
      'Status da atualizacao da fonte',
    ],
    notAnalyzed: [
      'Geracao de dezenas equivalentes',
      'Previsao de bilhete',
      'Maior chance por frequencia passada',
    ],
    method: [
      'Nao força um gerador numerico onde ele nao se aplica',
      'Prioriza transparencia da fonte',
      'Separa consulta de qualquer escolha de aposta',
    ],
    example:
      'A pagina explica o limite da modalidade e direciona o usuario para conferencia do resultado oficial.',
    backtest:
      'Nao se aplica como estrategia de dezenas; o produto registra a limitacao.',
  },
};

export const STRATEGY_CATALOG: Record<string, StrategyCatalogEntry> =
  Object.fromEntries(
    Object.entries(LOTTERY_CONFIGS).map(([id, config]) => [
      id,
      { id, name: config.name, ...(numeric[id] ?? adapted[id]) },
    ])
  ) as Record<string, StrategyCatalogEntry>;

export const STRATEGY_IDS = Object.keys(STRATEGY_CATALOG);
