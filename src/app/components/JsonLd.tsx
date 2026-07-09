const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.meutrevo.com/#website',
      url: 'https://www.meutrevo.com',
      name: 'Meu Trevo',
      description:
        'Resultados em tempo real e gerador de dezenas estatístico para loterias do Brasil.',
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
        'Assistente Lotérico Inteligente com desdobramentos combinatórios matemáticos e análises estatísticas em tempo real das loterias da Caixa.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O Meu Trevo garante que eu vou ganhar na loteria?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. Loterias são jogos baseados em aleatoriedade pura e sorte. Nenhuma ferramenta pode prever os números que vão sair. O Meu Trevo utiliza estatística histórica real e análise combinatória para otimizar suas apostas, permitindo que você cubra mais números com menos cartões de forma matemática.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funcionam os desdobramentos (fechamentos)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O desdobramento combinatório seleciona jogos específicos dentro de um grupo de números escolhidos. Por exemplo, em vez de pagar por todas as combinações de 10 números (o que seria extremamente caro), o algoritmo seleciona um conjunto otimizado de cartões simples que garante 100% de chance de Quadra se pelo menos 4 dos sorteados estiverem no seu grupo.',
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
