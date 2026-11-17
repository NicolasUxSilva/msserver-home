// robots.txt para a publicação deste site no domínio (docs/ROTEAMENTO.md: servido pelo site novo).
// Mantém as regras do All in One SEO do WordPress (/wp-admin/ fora, admin-ajax permitido) e lista os
// dois sitemaps: o das páginas deste site e o do WordPress (páginas que continuam lá). Em homologação
// e previews (PUBLIC_NOINDEX=true), nada é rastreado.
import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = () => {
  const body =
    import.meta.env.PUBLIC_NOINDEX === 'true'
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nDisallow: /parciais/\n\nSitemap: ${SITE.origin}/sitemap-site.xml\nSitemap: ${SITE.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
