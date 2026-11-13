// Páginas de soluções reconstruídas: Nuvem Privada, Extensão de Garantia, Backup em Nuvem e
// Consultoria. Todo o conteúdo vem das páginas publicadas no WordPress (lidas em 12/11/2026): textos,
// imagens (scripts/prepare-solucoes-assets.mjs), vídeos, links, botões e formulários.
//
// Regra dos textos (a mesma da home e de "Sobre nós"): palavras, pontuação e erros de digitação
// mantidos ("Extenção", "servidore tenha", "Baxe", "dowload"…); a única mudança é tipográfica — o
// que estava em CAIXA ALTA passa para caixa de frase. Os originais estão em docs/PRESERVACAO.md.
import seo from './solucoes-seo.json';

/** Envio dos formulários: o mesmo do Elementor Pro (admin-ajax.php do WordPress). */
export const ELEMENTOR = {
  endpoint: import.meta.env?.PUBLIC_QUOTE_ENDPOINT || 'https://msserver.com.br/wp-admin/admin-ajax.php',
  action: 'elementor_pro_forms_send_form',
  /** Ponto do celular do Elementor (até 767 px), para os formulários que mudam com a tela. */
  mobileQuery: '(max-width: 767px)',
} as const;

const wa = (text: string) => `https://wa.me/5511985991837?text=${text}`;
/** Links de WhatsApp dos botões, exatamente como publicados (mensagem já codificada). */
export const SOL_WHATSAPP = {
  orcamento: wa('Ol%C3%A1%2C+estive+em+seu+site+e+gostaria+de+fazer+um+or%C3%A7amento'),
  // Garantia e Backup usam a mensagem "…saber mais sobre Cloud" (ver docs/PRESERVACAO.md).
  cloud: wa('Ol%C3%A1%2C+estive+em+seu+site+e+gostaria+de+saber+mais+sobre+Cloud'),
} as const;

/** Campos de um formulário do Elementor, com os nomes e textos publicados. */
export type LeadField = {
  /** id do campo no Elementor (form_fields[id]). */
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'tel';
  autocomplete: string;
};

/** Os três campos de contato dos formulários de Garantia, Backup e Consultoria (mesmos ids). */
const CONTACT_FIELDS: LeadField[] = [
  { id: 'name', label: 'Nome', placeholder: 'Digite seu nome', type: 'text', autocomplete: 'name' },
  { id: 'field_f66ed12', label: 'Email', placeholder: 'Digite seu email', type: 'email', autocomplete: 'email' },
  { id: 'field_2702160', label: 'Telefone', placeholder: 'Digite seu Telefone', type: 'tel', autocomplete: 'tel' },
];

export type LeadForm = {
  postId: string;
  formId: string;
  refererTitle: string;
  fields: LeadField[];
  submit: string;
};

// ——— Nuvem Privada (/nuvem-privada/, página 7016) ———
export const NUVEM_PRIVADA = {
  seo: seo.nuvemPrivada,
  hero: {
    title: 'Nuvem Privada',
    lead: 'Conte com toda a nossa expertise para construir uma nuvem sob medida e exclusiva para a sua operação.',
  },
  config: {
    eyebrow: 'Nuvem privada',
    title: 'Monte a configuração ideal para sua empresa dar um salto tecnológico',
    // Formulário em etapas do Elementor (widget 1b2c23a no desktop e no tablet; 74046a9 no celular).
    form: {
      postId: '7016',
      refererTitle: 'Nuvem Privada - MSSERVER',
      formIds: { desktop: '1b2c23a', mobile: '74046a9' },
      next: 'Próximo',
      previous: 'Anterior',
      submit: 'Enviar',
      // Etapas: nos dois widgets são as mesmas perguntas; no celular as etapas não têm nome e as opções
      // são outras (caixas de seleção, várias por etapa). Os valores são os enviados ao WordPress.
      steps: [
        {
          label: 'Processador',
          id: 'field_49faf56',
          desktop: ['4 Cores - 8 Threads', '8  Cores - 16 Threads', '10 Cores - 20 Threads', '12 Cores - 24 Threads', '16 Cores, - 32 Threads', '18 Cores - 36 Threads', '20  Cores - 40 Threads', '22 Cores - 44 Threads'],
          mobile: [
            '1x E3-1200 (4 Cores, 8 Threads, 3.0 GHz)',
            '2x E5-2680v2 (20 Cores, 40 Threads, 2.8 GHz)',
            '2x E5-2680v3 (24 Cores, 48 Threads, 2.0 GHz)',
            '2x E5-2696v4 (44 Cores, 88 Threads, 2.2 GHz)',
            '2x Silver 4314 (32 Cores, 64 Threads, 2.4 GHz)',
            '2x Platinum 8176 (56 Cores, 112 Threads, 2.1 GHz)',
            '2x E5-2650v2 (16 Cores, 32 Threads, 2.6 GHz)',
            '2x E5-2697v2 (24 Cores, 48 Threads, 2.7 GHz)',
            '2x E5-2690v4 (28 Cores, 56 Threads, 2.6 GHz)',
            '2x Gold 6134 (16 Cores, 32 Threads, 3.2 GHz)',
            '2x Gold 6138 (44 Cores, 88 Threads, 2.0 GHz)',
          ],
        },
        { label: 'Memória', id: 'field_f2bee49', desktop: ['8 GB', '16 GB', '32 GB', '48 GB', '64 GB', 'OUTRO'], mobile: ['16 GB', ' 32 GB', ' 64 GB'] },
        {
          label: 'Armazenamento',
          id: 'field_94be79a',
          desktop: ['300 GB', '600 GB', '900 GB', '1.2 TB', '1.5 TB', '2 TB', 'OUTRO'],
          mobile: ['2x 480GB SSD', '2x 1920GB SSD', '2x 7680GB SSD', '2x 2000GB NVME', '10TB HDD', '2x 960GB SSD', '2x 3840GB SSD', '2x 1000GB NVME', '2x 4000GB NVME', '20TB HDD'],
        },
        { label: 'IP', id: 'field_f72c94c', desktop: ['1', '2', '3', '4', '5', '6'], mobile: ['1', '2', '3', '4', '5', '6'] },
      ],
      contactLabel: 'Contato',
      contact: [
        { id: 'field_ec698fd', label: 'Nome', placeholder: 'Digite seu nome', type: 'text', autocomplete: 'name' },
        { id: 'field_77d068a', label: 'E-mail', placeholder: 'Digite seu e-mail', type: 'email', autocomplete: 'email' },
        { id: 'field_b063367', label: 'Telefone', placeholder: 'DDD+número', type: 'tel', autocomplete: 'tel' },
      ] as LeadField[],
    },
  },
  intro: {
    title: 'Uma nuvem feita para você',
    text: 'Conte com a expertise de nossos arquitetos para dimensionar e implementar uma nuvem personalizada e exclusiva, utilizando equipamentos que atendam, sob medida, aos mais variados pré-requisitos, sem extrapolar seu budget. Especifique itens como latência de storage, topologia de rede e criticidade do ambiente, relacione a quantidade de processadores virtuais e memória, selecione periféricos específicos, critérios de segurança e tecnologia de virtualização. Tenha os benefícios de uma nuvem pública, combinados a itens de performance, escalabilidade e custos previsíveis, além de total controle, com requisitos de segurança exclusivos, controle de acesso de rede e isolamento de dados.',
  },
  performance: {
    title: 'A melhor performance pelo menor custo',
    items: [
      { icon: 'icone-io', title: 'Altíssima performance de I/O', text: 'Algumas operações necessitam de recursos de armazenamento com baixíssima latência e altíssimo poder de leitura e/ou gravação. Nossos especialistas podem selecionar tecnologias específicas que melhor atendam às suas necessidades.' },
      { icon: 'icone-perifericos', title: 'Periféricos específicos do cliente', text: 'Por se tratar de equipamentos dedicados para o cliente, dispositivos USB, placas PCI-e entre outros periféricos podem ser instalados, de forma que fique acessível tanto diretamente no servidor físico como em servidores virtuais.' },
      { icon: 'icone-custos', title: 'Redução de custos', text: 'Nem todas as mais recentes tecnologias são necessárias para seu projeto, mas podem inviabilizá-lo financeiramente. Abrindo mão de complexidades, você pode reaproveitar seu orçamento, contratando mais recursos e reduzindo custos.' },
    ],
  },
  diferenciais: {
    title: 'Nossos Diferenciais',
    // Os seis itens do carrossel publicado, com os ícones de cada um (src/assets/solucoes/nuvem-privada).
    items: [
      { image: 'diferencial-personalizavel', title: '100% personalizável', text: 'Nosso time de especialistas elabora o ambiente que melhor se encaixa com a necessidade, de modo que atenda pré-requisitos, preferências de tecnologias, pré-requisitos de segurança, budget e outras especificações.' },
      { image: 'diferencial-seguranca', title: 'Segurança a nível de rede', text: 'Ambiente com controle de acesso a nível de redes, podendo ser interligado ao seu escritório por rede privada (ponto a ponto), VPN ou utilizando regras restritivas de firewall.' },
      { image: 'diferencial-suporte', title: 'Suporte e treinamento', text: 'Em caso de dúvidas, nossos especialistas estão à disposição 24/7, por telefone e portal de atendimento, falando com você em português, com proximidade e autonomia. Fazemos treinamentos para sua equipe, tudo isso sem custos adicionais.' },
      { image: 'diferencial-conectividade', title: 'Conectividade', text: 'Conexão direta com grandes redes como Akamai, CloudFlare, Microsoft, Google, AWS e UPX. Capilaridade através dos maiores peerings nacionais do IX.br. Trânsito por múltiplas operadoras atuantes no Brasil e no mundo.' },
      { image: 'diferencial-nacional', title: 'Empresa nacional', text: 'Somos uma empresa nacional, oferecendo assim, toda a segurança jurídica, tributária e cambial que sua empresa necessita. Faça-nos uma visita e conheça as nossas instalações.' },
      { image: 'diferencial-backup', title: 'Backup diário', text: 'Seus dados armazenados em ambiente externo e a prova de falhas, para que você tenha total segurança e tranquilidade em casos de remoção indevida de arquivos, corrompimento de banco de dados, problemas de sistema operacional, sequestros ransomware, entre outros. (serviço adicional).' },
    ],
  },
  parceiros: {
    eyebrow: 'Parceiros',
    title: 'Juntos fazemos acontecer',
    // Ordem do carrossel; os nomes são os das marcas nos logos (o arquivo "EQUINIZ" mostra Equinix).
    logos: [
      { file: 'redhat', name: 'Red Hat' },
      { file: 'microsoft', name: 'Microsoft' },
      { file: 'intel', name: 'Intel' },
      { file: 'hp', name: 'HP' },
      { file: 'google', name: 'Google Cloud' },
      { file: 'equiniz', name: 'Equinix' },
      { file: 'dell', name: 'Dell' },
      { file: 'cisco', name: 'Cisco' },
      { file: 'cirion', name: 'Cirion' },
      { file: 'azure', name: 'Azure' },
      { file: 'aws', name: 'AWS' },
    ],
  },
  cta: {
    eyebrow: 'Fale com um especialista',
    title: 'Converse com um consultor para receber um orçamento.',
    button: 'Entrar em contato',
    href: SOL_WHATSAPP.orcamento,
  },
} as const;

// ——— Extensão de Garantia (/extencao-de-garantia/, página 6727) ———
export const GARANTIA = {
  seo: seo.garantia,
  hero: {
    eyebrow: 'Extenção de garantia',
    title: 'Proteja seu servidore tenha cobertura adicional de até 5 anos com a Extenção de garantia da MSServer!',
    button: 'Saiba mais',
    href: '#funciona',
  },
  porque: {
    /** Âncora publicada (seção 6790bd7): o "Saiba mais" da abertura leva até aqui. */
    id: 'funciona',
    title: 'Porque contratar a extensão de garantia da MSSERVER?',
    items: [
      { icon: 'refresh-cw', title: 'Non -Stop', text: 'O NON-STOP é nosso plano de substituição antecipada, uma excelente opção para usuários que dispõe de tempo de inatividade mínimo. Em caso de problemas garantimos a substituição imediata de seu(s) servidor(es).' },
      { icon: 'hard-drive', title: 'Garantia das Peças', text: 'Nossa extensão de garantia inclui também os componentes se seu servidor como: HD, fonte, placa mãe etc. Essa modalidade também segue o sistema Non-Stop' },
      { icon: 'headset', title: 'Suporte Técnico', text: 'Nossa equipe de suporte técnico é altamente qualificada e disponível para prestar o atendimento e garantir que os equipamentos estejam sempre disponíveis.' },
      { icon: 'package-check', title: 'Disponibilidade de equipamentos', text: 'Nosso estoque está sempre preparado com peças e servidores prontos para atender qualquer ocorrência.' },
    ],
  },
  app: {
    title: 'Facilidade na aquisição',
    text: 'A aquisição da extensão de garantia da MSServer é fácil e sem burocracias. Basta baixar o aplicativo da MSServer e, além de gerenciar seus servidores, você pode contratar sua extensão de garantia de seu servidor de forma simples e tranquila.',
    qrAlt: 'QR codes para baixar o aplicativo da MSSERVER no Google Play e na App Store',
    phoneAlt: 'Mão segurando um celular com o aplicativo da MSSERVER aberto',
    download: 'Baxe agora o app!',
  },
  video: {
    title: 'Saiba mais sobre a extensão de garantia MSSERVER!',
    id: 'SgYdjULsbBg',
    start: 0,
    /** Título do vídeo no YouTube (rótulo do player). */
    label: 'Conheça a Extensão de Garantia para Servidores da MSServer.',
  },
  form: {
    /** Âncora publicada na seção do formulário (4c216d1). */
    id: 'orcamento',
    title: 'Ficou interessado em saber mais sobre a extensão de garantia da MSServer?',
    text: 'Preencha o formulário ao lado e entraremos em contato em breve para lhe fornecer todas as informações necessárias.',
    form: { postId: '6727', formId: 'f07f805', refererTitle: 'Extenção de Garantia - MSSERVER', fields: CONTACT_FIELDS, submit: 'Enviar' } satisfies LeadForm,
  },
  cta: {
    title: 'Tem alguma dúvida sobre extensão de garantia?',
    button: 'Fale conosco',
    href: SOL_WHATSAPP.cloud,
  },
} as const;

// ——— Backup em Nuvem (/backup-em-nuvem/, página 6641) ———
export const BACKUP = {
  seo: seo.backup,
  hero: {
    eyebrow: 'Cloud',
    title: 'Backup em nuvem',
    text: 'Proteja seus dados com segurança e conveniência incomparáveis! Nosso backup em nuvem é a solução para garantir a integridade de seus arquivos e documentos mais importantes!',
    button: 'Saiba mais',
    // Publicado assim: a página não tem um elemento "funciona" (ver docs/PRESERVACAO.md).
    href: '#funciona',
  },
  vantagens: {
    title: '5 vantagens de contratar o backup em nuvem MSSERVER',
    items: [
      { icon: 'icone-seguranca', title: 'Mais Segurança', text: 'Implementamos medidas rigorosas de proteção de dados como: Criptografia de dados e redundância.' },
      { icon: 'icone-acessibilidade', title: 'Acessibilidade', text: 'Através do App MSServer você acessa seus dados de backup de qualquer lugar e a qualquer momento.' },
      { icon: 'icone-automatizacao', title: 'Automatização', text: 'Programe backups automáticos e elimine a necessidade de intervenções manuais ao seu processo de backup.' },
      { icon: 'icone-espaco', title: 'Economia de Espaço', text: 'Você não precisa de preocupar com a compra de hardware adicional para armazenamento, como discos rígidos externos.' },
      { icon: 'icone-recuperacao', title: 'Recuperação fácil', text: 'Em casos de falha no seu dispositivo principal ou perda de dados, a recuperação é simples. Basta fazer o dowload dos backups armazenados na nuvem.' },
    ],
  },
  form: {
    title: 'Evite perdas de dados e espaço de armazenamento limitado.',
    text: 'Experimente hoje mesmo nossa solução do backup em nuvem e mantenha seus dados protegidos e acessíveis em qualquer lugar, a qualquer momento.',
    certificacoes: 'Nossos processos e competências seguem certificações de mercado, proporcionando qualidade superior aos clientes.',
    call: 'Preencha o formulário e entraremos em contato para entender melhor a sua necessidade!',
    form: {
      postId: '6641',
      formId: '58d3284',
      refererTitle: 'Backup em Nuvem - MSSERVER',
      fields: [...CONTACT_FIELDS, { id: 'field_0d01f80', label: 'Armazenamento', placeholder: 'Digite a quantidade de volume', type: 'text', autocomplete: 'off' }],
      submit: 'Enviar',
    } satisfies LeadForm,
  },
  video: {
    title: 'Saiba mais sobre nossa solução de backup em nuvem',
    id: 'ZebwXutm2Po',
    /** O link publicado começa o vídeo aos 46 s (&t=46s). */
    start: 46,
    label: 'Confira a Solução de Backup em Nuvem da MSServer - Acompanhe e receba alertas de onde estiver!',
  },
  parceiros: {
    title: 'Alguns de nossos parceiros',
    alt: 'Perfil 7, PauliBras Abrasivos e Cartório Ceron (6º Tabelião de Notas de Santos)',
  },
  cta: {
    title: 'Tem alguma dúvida sobre nosso backup em nuvem?',
    button: 'Fale conosco',
    href: SOL_WHATSAPP.cloud,
  },
} as const;

// ——— Consultoria (/consultoria-em-implantacao-de-servidores/, página 7247) ———
export const CONSULTORIA = {
  seo: seo.consultoria,
  hero: {
    eyebrow: 'Consultoria',
    title: 'Projetos personalizados na medida de sua operação.',
    text: 'Transforme sua infraestrutura empresarial com a nossa consultoria especializada em implantação de servidores. Oferecemos soluções personalizadas, seja na nuvem ou local, para impulsionar a eficiência e a segurança dos seus sistemas e previsibilidade de resultados.',
    button: 'Saiba mais',
    href: '#contato',
  },
  eficiencia: {
    title: 'Eficiência Operacional:',
    text: 'Aumente a eficiência operacional da sua empresa com nossos serviços de consultoria. Desde a otimização de servidores locais até a migração para a nuvem, estamos comprometidos em impulsionar a produtividade e reduzir custos.',
  },
  frentes: [
    { image: 'continuidade', icon: 'activity', title: 'Continuidade de Serviços:', text: 'Garanta a continuidade dos seus negócios com nossas soluções avançadas em servidores locais. Mantenha suas operações funcionando sem interrupções, mesmo diante de desafios imprevistos, com estratégias de disaster recovery e sistemas robustos.' },
    { image: 'projetos', icon: 'drafting-compass', title: 'Projetos Personalizados:', text: 'Cada empresa é única, e nossos projetos personalizados refletem essa singularidade. Desenvolvemos soluções sob medida para atender às necessidades específicas do seu negócio, garantindo eficiência e otimização em cada aspecto.' },
    { image: 'multicloud', icon: 'cloud-cog', title: 'Multicloud e Nuvem Híbrida:', text: 'Explore as vantagens da multicloud e da nuvem híbrida para uma escalabilidade sem precedentes. Integre ambientes locais e em nuvem para um desempenho excepcional, proporcionando flexibilidade e eficiência operacional.' },
    { image: 'seguranca', icon: 'shield-check', title: 'Segurança de Dados:', text: 'Proteja seus ativos mais valiosos com as nossas soluções de segurança de dados. Da implementação de servidores locais à migração para a nuvem, garantimos a segurança contra ameaças cibernéticas, proporcionando tranquilidade para seus negócios prosperarem.' },
  ],
  form: {
    /** Âncora publicada (seção 2296226): o "Saiba mais" da abertura leva até aqui. */
    id: 'contato',
    title: 'Ficou interessado em saber mais sobre a Consultoria da MSServer?',
    text: 'Preencha o formulário e entraremos em contato em breve para lhe fornecer todas as informações necessárias.',
    form: { postId: '7247', formId: '716f78c', refererTitle: 'Consultoria em implantação de servidores - MSSERVER', fields: CONTACT_FIELDS, submit: 'Enviar' } satisfies LeadForm,
  },
} as const;

/** Mensagens dos formulários (as do Elementor em português; o servidor pode mandar outra no sucesso). */
export const FORM_TEXTS = {
  required: 'Este campo é obrigatório.',
  email: 'Informe um e-mail válido.',
  tel: 'Informe um telefone válido (só números e os símbolos ( ) # & + * - = .).',
  sending: 'Enviando…',
  successTitle: 'Mensagem enviada',
  successFallback: 'Recebemos o seu contato. Em breve a equipe da MSSERVER retorna.',
  again: 'Enviar outro contato',
  errorTitle: 'Não foi possível enviar',
  networkError: 'A conexão com o servidor falhou. Seus dados continuam preenchidos: tente enviar de novo em instantes.',
  serverError: 'O servidor não confirmou o recebimento. Seus dados continuam preenchidos: confira os campos e envie de novo.',
  fallback: 'Se preferir, fale com a equipe pelo WhatsApp.',
} as const;
