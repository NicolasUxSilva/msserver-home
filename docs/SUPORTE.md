# Suporte (Awesome Support) na identidade do site novo

## 1. Decisão

O sistema de chamados continua sendo o **Awesome Support 6.1.5 no WordPress**. Ele cuida de:
- login e cadastro;
- abertura de chamado;
- lista de chamados;
- respostas e anexos.

Essas telas usam nonces e sessão do WordPress, que mudam a cada visita. Por isso não podem virar páginas estáticas do site novo.

O que muda é a **aparência**: o plugin `wordpress/msserver-suporte` mostra essas páginas com o cabeçalho, o rodapé, as fontes e as cores do site novo. Também traduz a interface do Awesome Support para o português.

| Endereço (WordPress) | Conteúdo |
| --- | --- |
| `/obter-suporte/` | Login, cadastro e atalhos (shortcodes do Awesome Support) |
| `/enviar-chamado/` | `[ticket-submit]`: formulário de novo chamado (exige login) |
| `/meus-chamados/` | `[tickets]`: lista dos chamados da pessoa |
| `/ticket/{id}/` | Um chamado, com histórico e respostas |

O menu e o rodapé do site novo levam a `https://msserver.com.br/obter-suporte/`.

## 2. Como o plugin funciona

**Modelo próprio:**
- Nas páginas de suporte (slugs em `msserver_suporte_paginas()`, ajustáveis pelo filtro `msserver_suporte_paginas`, e o tipo `ticket`), o plugin troca o modelo do tema por `templates/suporte.php`.
- Esse modelo usa a **casca** gerada pelo build do site, em `app/shell.html`: cabeçalho, abertura com título e texto de apoio, rodapé, estilos e scripts do site.
- Dentro da casca entra o conteúdo do Awesome Support.

**O que continua igual:**
- `wp_head()` e `wp_footer()` continuam sendo chamados. Os nonces, scripts e estilos do Awesome Support, a barra do administrador e o All in One SEO funcionam como antes.

**O que sai:**
- Só nessas páginas, saem os estilos e scripts do tema e de outros plugins (Elementor etc.). Os do WordPress e do Awesome Support ficam.
- Os estilos do Awesome Support recebem um complemento (`src/styles/suporte.css`, embutido na casca) para usar as cores e os campos do site.

**Tradução:**
- `includes/traducoes-awesome-support.php` traz 198 textos.
- O arquivo é gerado por `scripts/traducoes-suporte.mjs` a partir da tradução oficial pt-BR do plugin, com os termos do site.
- Vale só para o domínio `awesome-support`. Se o WordPress já tiver uma tradução carregada, ela é respeitada.

**Sem a casca:** se a pasta `app/` não existir, o plugin não interfere: as páginas continuam com o tema atual.

## 3. Empacotar e instalar

```bash
npm run build
```

```bash
npm run build:suporte
```

O resultado é `dist-plugins/msserver-suporte.zip`.

A instalação depende de autorização e deve começar pela homologação:

1. Faça backup do WordPress (arquivos e banco).
2. No painel: *Plugins → Adicionar novo → Enviar plugin*, envie o zip e ative.
3. Abra `/obter-suporte/` deslogado e logado, `/enviar-chamado/`, `/meus-chamados/` e um chamado existente.
4. Siga o roteiro de `docs/HOMOLOGACAO.md` (seção 6).

**Atualização:** a cada mudança de cabeçalho ou rodapé no site novo, gere o zip de novo e reinstale. A casca leva os arquivos do build em `app/`, então o suporte não depende da versão publicada do site.

**Para desfazer:** desative o plugin. Nada no banco é alterado.

## 4. Dependências no WordPress

| Dependência | Situação em 17/11/2026 | Observação |
| --- | --- | --- |
| Awesome Support | 6.1.5, ativo | O plugin novo não muda o funcionamento. Atualizações do Awesome Support podem trazer textos novos ainda não traduzidos: rode `node scripts/traducoes-suporte.mjs` e reempacote. |
| Páginas `obter-suporte`, `enviar-chamado`, `meus-chamados` | Publicadas | Se mudarem de slug, ajuste pelo filtro `msserver_suporte_paginas`. |
| Idioma do WordPress | Inglês (`en_US`) | As telas do Awesome Support ficam em português pelo plugin. Já o `wp-login.php` e as mensagens de erro de login do próprio WordPress continuam em inglês. **Recomendação:** mudar o idioma do site para Português do Brasil (*Configurações → Geral → Idioma do site*), depois de conferir o painel e os e-mails. |
| E-mails do Awesome Support | Configurados no WordPress | Não foram alterados. Os textos dos e-mails de notificação estão nas configurações do plugin. |
| Cadastro aberto | Habilitado no Awesome Support | Mantido. |
| `/ticket_channel/standard-ticket-form/` | Arquivo vazio, indexado | Ver `docs/ROTEAMENTO.md`, seção 4. |

## 5. O que foi verificado e o que falta

**Verificado aqui:**
- O build gera a casca (`dist/parciais/suporte/`) com cabeçalho, rodapé e os estilos do suporte. A casca está fora das rotas públicas e do sitemap.
- O empacotamento gera o zip com a casca sem as tags de SEO, que ficam com o WordPress.
- O modelo `templates/suporte.php` e a tradução foram executados com o PHP 8 contra o HTML real dos formulários do Awesome Support publicados (login, cadastro, novo chamado). O teste rodou num ambiente com as funções do WordPress simuladas e conferiu:
  - os formulários dentro da casca;
  - os campos e nonces intactos;
  - os textos em português.

**Não verificado (depende de um WordPress de homologação):**
- login, cadastro, abertura de chamado, lista, resposta e anexo de ponta a ponta;
- os e-mails disparados;
- a convivência com os outros plugins ativos.

Não foi possível instalar um WordPress local neste ambiente, e o WordPress de produção não pode ser alterado sem autorização. O roteiro está em `docs/HOMOLOGACAO.md`.
