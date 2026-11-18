// Fatos de contato da landing de Soluções Cloud (repositório cloud-ms, src/config/site.ts, commit
// 3199d6f), com os mesmos valores. Ficaram de fora LINKS, APP_STORES e ANALYTICS, que só o
// cabeçalho, o rodapé e o layout próprios da landing usavam: na integração, eles são os do site
// (src/config/site.ts), e o rastreamento segue o consentimento do site.

export const SITE = {
  name: 'MSSERVER',
  origin: 'https://msserver.com.br',
  // Endereço publicado da landing (definido na etapa de conclusão: /solucoes-cloud/ é a versão
  // oficial da oferta, com canonical próprio e indexável).
  canonical: 'https://msserver.com.br/solucoes-cloud/',
  title: 'Infraestrutura Cloud para a TI da sua Empresa | MSSERVER',
  description:
    'Servidor no limite, ERP lento ou ambiente que precisa crescer? Nuvem privada sob medida, migração, monitoramento e suporte da MSSERVER. Avalie seu ambiente.',
  locale: 'pt_BR',
  ogImage: 'https://msserver.com.br/og-cloud-msserver.jpg',
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
