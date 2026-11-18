// Fatos e mensagens da landing de Servidores Físicos (repositório landins-servidores-fisicos,
// src/config/site.ts, commit a8439e1), com os mesmos valores. Ficaram de fora LINKS, APP_STORES e
// ANALYTICS, que só o cabeçalho, o rodapé e o layout próprios da landing usavam: na integração, eles
// são os do site (src/config/site.ts), e o rastreamento segue o consentimento do site.

export const SITE = {
  name: 'MSSERVER',
  origin: 'https://msserver.com.br',
  // Endereço publicado da landing (o mesmo canonical da versão no ar em /servidores-fisicos/).
  canonical: 'https://msserver.com.br/servidores-fisicos/',
  title: 'Servidores Físicos para Empresas | Dell, HP e IBM | MSSERVER',
  description:
    'Servidores Dell, HP e IBM seminovos para empresas, com garantia padrão de 1 ano e extensão até 5 anos, suporte especializado e envio para todo o Brasil. Fale com a equipe pelo WhatsApp.',
  locale: 'pt_BR',
  ogImage: 'https://msserver.com.br/og-servidores-dedicados.jpg',
} as const;

export const CONTACT = {
  whatsappNumber: '5511985991837',
  whatsappDisplay: '(11) 98599-1837',
  phoneE164: '+551148585358',
  phoneDisplay: '(11) 4858-5358',
  emailCommercial: 'comercial@msserver.com.br',
  emailGeneral: 'contato@msserver.com.br',
  hours: 'Atendimento das 8h às 18h',
  address: {
    street: 'R. Salvador de Sá, 182',
    district: 'Santa Terezinha',
    city: 'Santo André',
    region: 'SP',
    country: 'BR',
  },
} as const;

export const SOCIAL = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/msserver/' },
  { name: 'Instagram', url: 'https://www.instagram.com/msserver/' },
  { name: 'YouTube', url: 'https://www.youtube.com/@msserversolucoesemservidor9811' },
  { name: 'Facebook', url: 'https://www.facebook.com/msserverinformatica/' },
] as const;

export const whatsappUrl = (text: string) => `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;

/** Mensagens pré-preenchidas do WhatsApp. */
export const WA = {
  // CTAs gerais: deixa claro para a equipe que o contato procura servidores físicos para empresa.
  general: 'Olá! Vim pela página de servidores físicos e procuro um servidor para a minha empresa.',
  // CTA da seção "Como funciona a compra".
  process: 'Olá! Vi como funciona a compra na página de servidores físicos e quero orientação para escolher o servidor da minha empresa.',
  model: (name: string, form: string, tier: string) =>
    `Olá! Vim pela página de servidores físicos e tenho interesse no ${name} (${form}, ${tier}). Pode me passar disponibilidade e valores para a minha empresa?`,
} as const;
