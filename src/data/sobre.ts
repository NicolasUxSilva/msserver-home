// Conteúdo da página "Sobre nós" de msserver.com.br (WordPress, página 480), preservado.
// As palavras, a pontuação, os erros de digitação e a ordem são os da página publicada.
// A única mudança é tipográfica, como na home: títulos e botão publicados em CAIXA ALTA passam
// a usar caixa de frase. A grafia original de cada título está em docs/PRESERVACAO.md.

export const SOBRE = {
  title: 'Quem somos',

  /** Coluna da esquerda: retrato, Propósito e foto do evento (nesta ordem). */
  proposito: {
    title: 'Propósito',
    text: 'Em um mundo cada vez mais tecnologico os recursos computacionais se tornaram essenciais e atemporais, o que vai mudar é a forma de entrega desses recursos, nosso proposito é garantir que qualquer pessoa, empresa ou sistema tenha acesso a essa vantagem, respeitando e fortalecendo ideais independente de governo, sonhamos com uma sociedade pronta para a próxima revolução tecnologica, isso é o acesso a informação e poder de criação.',
  },

  /** Coluna da direita: Visão e missão, foto da equipe, Foco no atendimento e botão (nesta ordem). */
  visao: {
    title: 'Visão e missão',
    paragraphs: [
      'Nós da MSServer amamos o que fazemos e nos propomos em entregar Soluções em Servidores para os mais variados segmentos do mercado. Temos como base a continuidade dos serviços e por isso oferecemos uma serie de recursos como garantia estendida, suporte especializado, soluções e processos para mitigar seus riscos com indisponibilidade.',
      'Temos como missão entregar recursos computacionais adequados para diferentes aplicações e cenários, apresentando sempre o melhor custo benefício. Desenvolvendo assim ambientes robustos e sustentáveis para nossos clientes e parceiros.',
    ],
  },

  atendimento: {
    title: 'Foco no atendimento',
    text: 'Sabemos que os servidores são responsaveis por entregas de missão critica e por isso nosso atendimento visa tratar questões tecnicas de forma humanizada e pró-ativa ressaltando sempre nosso compromisso com seus projetos.',
    button: {
      label: 'Conte conosco',
      // Mesmo destino do botão do WordPress (widget 780e246), sem alteração.
      href: 'https://wa.me/5511985991837?text=Ol%C3%A1%21+Venha+atrav%C3%A9s+do+site+e+preciso+de+orcamento+para+o+meu+projeto.',
    },
  },

  /** Textos alternativos: no WordPress as fotos não têm alt; aqui descrevem o que mostram. */
  photos: {
    retrato: 'Retrato no escritório da MSSERVER',
    evento: 'Grupo reunido em evento diante do painel “Conexões que geram negócios”',
    equipe: 'Equipe da MSSERVER reunida no escritório, com camisetas da empresa',
  },

  especialidades: {
    title: 'Especialidades',
    // Ordem da página: primeira fileira (4) e segunda fileira (4).
    items: [
      { icon: '01-servidores-fisicos', title: 'Servidores fisicos', text: 'Venda e locação de servidores com suporte e garantia estendida, atendimento on-site e implantação dos principais serviços para sua empresa crescer de forma ordenada, o melhor pós venda do mercado.' },
      { icon: '02-nuvem-privada', title: 'Servidores em nuvem privada', text: 'Seu projeto sob medida em Datacenters TIER III com alta disponibilidade, a elasticidade e suporte que você precisa para garantir que seus serviços permaneçam online e seguros.' },
      { icon: '03-ciberseguranca', title: 'Cibersegurança', text: 'Um dos pilares de uma infraestrutura de TI. Entregamos uma analise de seu ambiente com base no Framework NIST e ISO27001 alertando, pontuando e agindo nas principais vulnerabilidades do seu negócio.' },
      { icon: '04-extensao-de-garantia', title: 'Extensão de garantia', text: 'Problemas físicos pontuais e incidentes resolvidos de forma eficaz, estenda a garantia de seu parque de servidores e garanta a disponibilidade de seu datacenter.' },
      { icon: '05-monitoramento', title: 'Monitoramento', text: 'Acompanhe em tempo real o uso de seu servidor através de nosso APP. Monitore seus servidores disponibilidade e desempenho de forma rapida e pratica.' },
      { icon: '06-suporte-e-manutencao', title: 'Suporte e manutenção', text: 'Problemas físicos, manutenções preventivas, projetos de infraestrutura, resolvidos e executados rapidamente para garantir que seus recursos não fiquem parados gerando custos para a empresa.' },
      { icon: '07-recompra', title: 'Recompra', text: 'A venda do seu usado conciliado com a aquisição do novo, seja para troca, upgrades oumigração para nuvem.' },
      { icon: '08-rotinas-de-backup', title: 'Rotinas de backup', text: 'Em nuvem ou local garantimos que a rotina ocorra de forma transparente e garanta a segurança de suas informações.' },
    ],
  },

  depoimentos: {
    title: 'O que os clientes dizem',
    // Ordem do carrossel do WordPress (widget 0090bc4).
    items: [
      { quote: 'Nós da perfilados Nardi sempre que precisamoss adquirimos os equipamentos com a MSServer, temos um excelente atendimento sempre nos é ofertado nada mais do que precisamos, gerando economia para nossa empresa, sem contar o pós venda mas ágil que o das próprias fabricantes.', name: 'Fernando', company: 'Perfilados Nardi' },
      { quote: 'A MSServer fez o serviço de implantação de servidores, o que surpreendeu foi a agilidade em realizar essa implantação, facilitou muito nossa rotina por aqui além de garantir a alta disponibilidade de nossa operação.', name: 'Sara', company: 'RD Concretos' },
      { quote: 'A MSServer presta serviço de consultoria e suporte para nós faz em média 2 anos, desde então nosso processo melhorou muito com as implantações de servidores e incidentes atendidos de forma rápida e eficaz.', name: 'Jessica', company: 'Senior Engenharia' },
      { quote: 'A MSServer nos ajudou na migração de todas as aplicações da empresa para a nuvem após a pandemia, conseguimos manter nossa operação ativa e ainda reduzir custos com equipamentos e operacional da nossa empresa.', name: 'Pedro Hermano', company: 'Attri' },
    ],
  },
} as const;

/** SEO da página, como publicado pelo All in One SEO. */
export const SOBRE_SEO = {
  title: 'Sobre - MSSERVER',
  description:
    'QUEM SOMOS PROPÓSITO Em um mundo cada vez mais tecnologico os recursos computacionais se tornaram essenciais e atemporais, o que vai mudar é a forma de entrega desses recursos, nosso proposito é garantir que qualquer pessoa, empresa ou sistema tenha acesso a essa vantagem, respeitando e fortalecendo ideais independente de governo, sonhamos com uma sociedade',
  canonical: 'https://msserver.com.br/sobre/',
} as const;
