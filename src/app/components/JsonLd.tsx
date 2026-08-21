const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.meutrevo.com/#website',
      url: 'https://www.meutrevo.com',
      name: 'Meu Trevo',
      description:
        'Resultados oficiais, planejamento de orçamento, organização e conferência de jogos das loterias da Caixa.',
      publisher: { '@id': 'https://www.meutrevo.com/#organization' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.meutrevo.com/#software',
      name: 'Meu Trevo',
      url: 'https://www.meutrevo.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '14.90',
        priceCurrency: 'BRL',
      },
      description:
        'Ferramenta para acompanhar resultados, organizar jogos, planejar orçamento e consultar análises históricas das loterias da Caixa.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O Meu Trevo garante que eu vou ganhar na loteria?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. Loterias dependem de aleatoriedade. O Meu Trevo organiza jogos, custos e dados históricos, mas não prevê resultados nem altera as probabilidades oficiais.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funcionam os desdobramentos (fechamentos)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O desdobramento distribui um grupo de dezenas em vários cartões. A cobertura é condicional e só se aplica quando a quantidade indicada de dezenas sorteadas estiver no grupo selecionado.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funciona a assinatura PRO e a ativação?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A ativação é 100% automatizada. Ao clicar em Assinar PRO, nossa API gera um QR Code Pix dinâmico. Assim que você realiza o pagamento no aplicativo do seu banco, o sistema reconhece a liquidação em segundos e libera a sua conta imediatamente.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso exportar os meus jogos gerados?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! A versão PRO permite baixar os cartões gerados em formato TXT compatível com os principais importadores, ou formatar a impressão física diretamente na impressora.',
          },
        },
      ],
    },
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
