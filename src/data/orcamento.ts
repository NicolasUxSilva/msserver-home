// Página "Orçamento" (https://msserver.com.br/orcamento/, página 509 do WordPress). O formulário é
// o mesmo widget de formulário do Elementor Pro: as mesmas 5 etapas, os mesmos campos (nomes, ids,
// tipos, rótulos e textos de exemplo) e o mesmo envio. Fonte: HTML publicado, capturado em
// 08/11/2026 (tests/fixtures/original-orcamento.json). O que mudou de texto está em docs/PRESERVACAO.md.

/** SEO da página, como publicado pelo All in One SEO. */
export const ORCAMENTO_SEO = {
  title: 'Orçamento - MSSERVER',
  description: 'ORÇAMENTO',
  canonical: 'https://msserver.com.br/orcamento/',
} as const;

export type QuoteField = {
  /** Id do campo no Elementor: as respostas de erro do servidor chegam por este id. */
  id: string;
  name: string;
  label: string;
  placeholder: string;
  control: 'input' | 'textarea';
  type?: 'text' | 'email' | 'tel';
  autocomplete?: string;
  inputmode?: 'text' | 'email' | 'tel';
  autocapitalize?: 'words' | 'sentences' | 'off';
  /** Mensagens de validação (o original só tinha as mensagens padrão do navegador e do Elementor). */
  messages: { required: string; format?: string };
};

export type QuoteStep = { key: string; label: string; fields: QuoteField[] };

export const QUOTE = {
  /** Título publicado: "ORÇAMENTO" (caixa de frase, como no resto do site). */
  title: 'Orçamento',
  /** Contexto curto da solicitação (novo; sem promessas de prazo ou condições). */
  lead: 'Cinco passos rápidos para a equipe comercial da MSSERVER entender o seu projeto.',
  requiredNote: 'Todos os campos são obrigatórios.',

  /** Envio: o mesmo do Elementor Pro (admin-ajax.php do WordPress, ação do formulário do Elementor). */
  endpoint: import.meta.env.PUBLIC_QUOTE_ENDPOINT || 'https://msserver.com.br/wp-admin/admin-ajax.php',
  action: 'elementor_pro_forms_send_form',
  hidden: { post_id: '509', referer_title: 'Orçamento - MSSERVER', queried_id: '509' },
  /** Dois widgets no WordPress, com as mesmas perguntas: um no desktop/tablet e outro no celular
   *  (até 767 px, o ponto do Elementor). Cada um tem as próprias ações no servidor (email,
   *  integrações), então o envio usa o id do widget que a pessoa veria naquela tela. */
  formIds: { desktop: '3c9067f', mobile: '65ca7d8' },
  mobileQuery: '(max-width: 767px)',

  buttons: {
    next: 'Próximo',
    previous: 'Anterior',
    /** No original: "Enviar". O texto deixa claro o que o botão envia. */
    submit: 'Enviar solicitação de orçamento',
    sending: 'Enviando solicitação…',
  },

  steps: [
    {
      key: 'pessoais',
      label: 'Dados Pessoais',
      fields: [
        {
          id: 'name',
          name: 'form_fields[name]',
          label: 'Nome e Sobrenome',
          placeholder: 'Digite seu nome e Sobrenome',
          control: 'input',
          type: 'text',
          autocomplete: 'name',
          autocapitalize: 'words',
          messages: { required: 'Informe seu nome e sobrenome.' },
        },
      ],
    },
    {
      key: 'empresa',
      label: 'Dados da Empresa',
      fields: [
        {
          id: 'field_ba71415',
          name: 'form_fields[field_ba71415]',
          label: 'Razão Social',
          placeholder: 'Digite a razão social da sua empresa',
          control: 'input',
          type: 'text',
          autocomplete: 'organization',
          autocapitalize: 'words',
          messages: { required: 'Informe a razão social da empresa.' },
        },
      ],
    },
    {
      key: 'contato',
      label: 'Email e Telefone',
      fields: [
        {
          id: 'field_f66ed12',
          name: 'form_fields[field_f66ed12]',
          label: 'Email',
          placeholder: 'Digite seu email',
          control: 'input',
          type: 'email',
          autocomplete: 'email',
          inputmode: 'email',
          autocapitalize: 'off',
          messages: { required: 'Informe seu email.', format: 'Informe um email válido, como nome@empresa.com.br.' },
        },
        {
          id: 'field_2e1002c',
          name: 'form_fields[field_2e1002c]',
          label: 'Telefone',
          placeholder: 'Digite seu telefone',
          control: 'input',
          type: 'tel',
          autocomplete: 'tel',
          inputmode: 'tel',
          // Mesma regra do campo no Elementor ("Only numbers and phone characters (#, -, *, etc)
          // are accepted."), em português. Espaços são aceitos na digitação e retirados no envio.
          messages: { required: 'Informe seu telefone.', format: 'Use apenas números e caracteres de telefone, como ( ) - + # *.' },
        },
      ],
    },
    {
      key: 'aplicacao',
      label: 'Aplicação',
      fields: [
        {
          id: 'field_1d74bd8',
          name: 'form_fields[field_1d74bd8]',
          label: 'Nos dê uma breve descrição da aplicação de uso do seu servidor ou configuração desejada.',
          placeholder: 'Digite aqui...',
          // Campo de texto de uma linha no original; aqui, área de texto (a resposta é uma descrição).
          control: 'textarea',
          autocapitalize: 'sentences',
          messages: { required: 'Descreva a aplicação do servidor ou a configuração desejada.' },
        },
      ],
    },
    {
      key: 'servico',
      label: 'Serviço especializado',
      fields: [
        {
          id: 'field_9919f95',
          name: 'form_fields[field_9919f95]',
          label: 'Necessita de mão de obra especializada para o projeto?',
          placeholder: 'Digite aqui...',
          control: 'input',
          type: 'text',
          autocapitalize: 'sentences',
          messages: { required: 'Responda se o projeto precisa de mão de obra especializada.' },
        },
      ],
    },
  ] as QuoteStep[],

  /** Mensagens do envio. A de sucesso vem do servidor (configurada no Elementor); esta só é usada
   *  se ele não mandar nenhuma. */
  status: {
    successTitle: 'Solicitação de orçamento enviada',
    successFallback: 'Recebemos a sua solicitação.',
    summaryTitle: 'Resumo do que foi enviado',
    again: 'Enviar outra solicitação',
    home: 'Voltar para o início',
    errorTitle: 'Não foi possível enviar a sua solicitação',
    networkError: 'A conexão com o servidor falhou. Seus dados continuam preenchidos: tente enviar de novo em instantes.',
    serverError: 'O servidor não confirmou o recebimento. Seus dados continuam preenchidos: confira os campos indicados e envie de novo.',
    fallbackContact: 'Se preferir, fale com a equipe comercial pelo WhatsApp ou pelo email',
  },

  help: {
    title: 'Prefere falar com a equipe?',
    // Mesma mensagem do botão "Conte conosco" da página "Sobre nós" (pedido de orçamento).
    whatsappText: 'Olá! Venha através do site e preciso de orcamento para o meu projeto.',
  },
} as const;
