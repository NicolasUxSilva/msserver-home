import { describe, expect, it } from 'vitest';
import { CONTACT, WA, whatsappUrl } from '../../src/data/landings/servidores-fisicos/site';
import { catalog, TIER_TITLE } from '../../src/data/landings/servidores-fisicos/catalog';
import { FAQ, PROCESS, STATS } from '../../src/data/landings/servidores-fisicos/content';
import { FEATURED_MODELS } from '../../src/data/landings/servidores-fisicos/featured';
import { brl } from '../../src/lib/landing-format';

describe('WhatsApp', () => {
  it('usa o número oficial e codifica a mensagem', () => {
    expect(CONTACT.whatsappNumber).toBe('5511985991837');
    const url = new URL(whatsappUrl(WA.general));
    expect(url.origin + url.pathname).toBe('https://wa.me/5511985991837');
    expect(url.searchParams.get('text')).toBe(WA.general);
  });

  it('tem mensagens para os CTAs gerais, do processo e de cada modelo', () => {
    expect(WA.general).toMatch(/servidores físicos.*minha empresa/);
    expect(WA.process).toMatch(/como funciona a compra.*escolher o servidor/i);
    expect(WA.model('Dell PowerEdge R740', 'rack', 'Intel Xeon Scalable')).toBe(
      'Olá! Vim pela página de servidores físicos e tenho interesse no Dell PowerEdge R740 (rack, Intel Xeon Scalable). Pode me passar disponibilidade e valores para a minha empresa?',
    );
  });
});

describe('dados da página', () => {
  it('formata preços em reais', () => {
    expect(brl(2350000)).toBe('R$ 23.500');
    expect(brl(1999)).toBe('R$ 19,99');
  });

  it('os modelos em destaque existem no catálogo com preço publicado', () => {
    for (const [slug] of FEATURED_MODELS) {
      const m = catalog.models.find((x) => x.slug === slug);
      expect(m, slug).toBeDefined();
      expect(m!.minPriceCents).toBeGreaterThan(0);
      expect(TIER_TITLE[m!.tier]).toBeTruthy();
    }
  });

  it('indicadores, processo e FAQ', () => {
    expect(STATS.map((s) => s.value)).toEqual(['+15', '+10.250']);
    expect(PROCESS).toHaveLength(4);
    expect(FAQ).toHaveLength(6);
  });
});
