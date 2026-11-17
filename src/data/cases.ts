// "Cases de sucesso" (/cases-de-sucesso/): o conteúdo publicado na página 8165 do WordPress, sem
// alteração de texto (fonte: HTML publicado em 17/11/2026; versão desktop da página, a completa).
// Imagens: os cartões de cada cliente da versão desktop (src/assets/cases/, scripts/prepare-cases-assets.mjs).
//
// Ajustes documentados em docs/PRESERVACAO.md:
//  - "Ver case completo →" não era link no WordPress (não existe página de case): não é exibido.
//  - Botões que levavam a um protótipo externo (figma.site) e o "Falar no WhatsApp" com o número
//    fictício 5511999999999 (versão do celular) usam o WhatsApp comercial do site.
//  - "Solicitar Orçamento" leva ao formulário de orçamento do site (no WordPress, ao WhatsApp).
//  - "Industria" (versão desktop) segue a grafia da versão do celular: "Indústria".
//  - Os números e as certificações são os publicados; a confirmação está na lista de pendências
//    externas (docs/PENDENCIAS-EXTERNAS.md).
import type { ImageMetadata } from 'astro';
import lumiar from '../assets/cases/lumiar.jpg';
import terracom from '../assets/cases/terracom.jpg';
import ourominas from '../assets/cases/ourominas.jpg';
import datasafer from '../assets/cases/datasafer.jpg';
import forcas from '../assets/cases/forcas-armadas.jpg';
import rumo from '../assets/cases/rumo.jpg';

export const CASES_HERO = {
  title: 'Cases de Sucesso',
  lead: 'Resultados reais entregues a empresas que confiaram na nossa expertise em infraestrutura de TI, cloud computing e cibersegurança',
  primary: 'Falar com especialista',
  secondary: 'Ver cases',
} as const;

/** Números publicados na abertura (ícones do WordPress substituídos pelos do site). */
export const CASES_STATS = [
  { value: '+250', label: 'Projetos Entregues', icon: 'package-check' },
  { value: '99,9%', label: 'Uptime Garantido', icon: 'activity' },
  { value: '+40%', label: 'Redução de Custos', icon: 'trending-down' },
  { value: '+15', label: 'Anos no Mercado', icon: 'award' },
] as const;

export const CASES_SECTION = {
  title: 'Nossos Cases de Sucesso',
  lead: 'Conheça empresas que transformaram sua infraestrutura de TI com nossas soluções especializadas',
} as const;

export type Case = { client: string; sector: string; text: string; image: ImageMetadata; alt: string };

export const CASES: Case[] = [
  {
    client: 'Lumiar',
    sector: 'Saúde',
    text: 'Implantação de ambiente em cluster de alta disponibilidade com integração a LTO para retenção de longo prazo, garantindo segurança e continuidade de dados clínicos críticos.',
    image: lumiar,
    alt: 'Lumiar Healthcare',
  },
  {
    client: 'Terracom',
    sector: 'Indústria',
    text: 'Upgrades, servidores e extensão de garantia para modernização completa do parque tecnológico.',
    image: terracom,
    alt: 'Grupo Terracom',
  },
  {
    client: 'Ourominas',
    sector: 'Financeiro',
    text: 'Fornecimento de hardware corporativo com implantação estruturada para garantir segurança e estabilidade de sistemas financeiros.',
    image: ourominas,
    alt: 'Ourominas Ouro e Câmbio',
  },
  {
    client: 'Datasafer',
    sector: 'Tecnologia',
    text: 'Projeto de grande porte envolvendo dezenas de servidores com 12 baias e discos de 20TB, estruturando ambiente robusto para alta demanda de armazenamento.',
    image: datasafer,
    alt: 'Datasafer',
  },
  {
    client: 'Forças Armadas',
    sector: 'Setor Público',
    text: 'Suporte técnico especializado em hardwares legados e recuperação de dados estratégicos, com alto nível de criticidade.',
    image: forcas,
    alt: 'Forças Armadas',
  },
  {
    client: 'Rumo',
    sector: 'Logística e Mobilidade',
    text: 'Implantação de ambiente em cluster com IA para leitura e análise de vagões ferroviários, integrando infraestrutura e inteligência operacional.',
    image: rumo,
    alt: 'Rumo',
  },
];

export const CASES_PROCESS = {
  title: 'Como Atuamos',
  lead: 'Processo estruturado em três etapas para garantir o sucesso do seu projeto',
  steps: [
    { title: 'Diagnóstico', text: 'Análise completa da sua infraestrutura atual, identificando gargalos e oportunidades de melhoria', icon: 'scan-search' },
    { title: 'Implementação', text: 'Execução do projeto com metodologia ágil, minimizando impactos nas suas operações', icon: 'settings-2' },
    { title: 'Suporte Contínuo', text: 'Monitoramento 24/7 e suporte técnico especializado para garantir máxima disponibilidade', icon: 'headset' },
  ],
} as const;

export const CASES_CTA = {
  title: 'Pronto para Transformar Sua Infraestrutura de TI?',
  text: 'Agende uma consulta gratuita com nossos especialistas e descubra como podemos impulsionar seu negócio',
  quote: 'Solicitar Orçamento',
  whatsapp: 'Falar no WhatsApp',
  certsTitle: 'Certificações e Parcerias',
  certs: ['ISO 27001', 'AWS Partner', 'Microsoft Gold', 'VMware Certified'],
} as const;
