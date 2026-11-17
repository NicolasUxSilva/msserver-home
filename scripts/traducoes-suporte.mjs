// Gera wordpress/msserver-suporte/includes/traducoes-awesome-support.php: a tradução em português
// dos textos que o Awesome Support mostra ao cliente (login, cadastro, envio e lista de chamados,
// respostas, anexos, avisos e erros).
//
// Fonte: a tradução oficial do plugin no translate.wordpress.org (pt-br, "Stable"), exportada em PO,
// mais os ajustes de MSSERVER abaixo (termos do site: "chamado", "Entrar", "Criar conta"). Só entram
// os textos usados nas telas públicas (themes/, shortcodes/, funções de usuário, chamado e resposta do
// plugin); os textos do painel administrativo ficam como estão.
//
// Por que um mapa próprio: o idioma do WordPress de msserver.com.br está em inglês (as datas do blog
// saem como "November 14"), então o WordPress não carrega nenhuma tradução do Awesome Support. O
// plugin aplica este mapa só ao domínio "awesome-support", qualquer que seja o idioma do site.
//
// Uso: node scripts/traducoes-suporte.mjs <awesome-support-pt_BR.po> <pasta do awesome-support 6.1.5>
//   PO: https://translate.wordpress.org/projects/wp-plugins/awesome-support/stable/pt-br/default/export-translations/?format=po
//   Plugin: https://downloads.wordpress.org/plugin/awesome-support.6.1.5.zip (versão de produção)
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const [poFile, pluginDir] = process.argv.slice(2);
if (!poFile || !pluginDir) throw new Error('Uso: node scripts/traducoes-suporte.mjs <po> <pasta do plugin>');
const OUT = path.resolve(import.meta.dirname, '../wordpress/msserver-suporte/includes/traducoes-awesome-support.php');

// Ajustes da MSSERVER (prevalecem sobre a tradução da comunidade).
const AJUSTES = {
  'Log in': 'Entrar',
  'Register': 'Criar cadastro',
  'E-mail or username': 'E-mail ou nome de usuário',
  'Password': 'Senha',
  'Remember Me': 'Manter conectado',
  'Logging In...': 'Entrando…',
  'Forgot password?': 'Esqueceu a senha?',
  'First Name': 'Nome',
  'Last Name': 'Sobrenome',
  'Email': 'E-mail',
  'Enter a password': 'Crie uma senha',
  'Show Password': 'Mostrar a senha',
  'Create Account': 'Criar conta',
  'Creating Account...': 'Criando a conta…',
  'Subject': 'Assunto',
  'Description': 'Descrição',
  'Submit ticket': 'Enviar chamado',
  'Submit': 'Enviar',
  'My Tickets': 'Meus chamados',
  'Open a ticket': 'Abrir um chamado',
  'Logout': 'Sair',
  'Any status': 'Qualquer status',
  'Search tickets...': 'Buscar chamados…',
  'Clear Filter': 'Limpar filtro',
  "You haven't submitted a ticket yet. <a href=\"%s\">Click here to submit your first ticket</a>.": 'Você ainda não abriu nenhum chamado. <a href="%s">Clique aqui para abrir o primeiro</a>.',
  'Registrations are currently not allowed.': 'No momento, novos cadastros não estão disponíveis.',
  'You need to <a href="%s">log-in</a> to submit a ticket.': 'Você precisa <a href="%s">entrar</a> para abrir um chamado.',
  'You are not allowed to submit a ticket.': 'Você não tem permissão para abrir chamados.',
  'You are currently logged out.  To view tickets you must first login.': 'Você não está conectado. Para ver seus chamados, entre na sua conta.',
  'Your account has been created. Please log-in.': 'Sua conta foi criada. Entre para continuar.',
  'We were unable to log you in for an unknown reason.': 'Não foi possível entrar. Tente de novo.',
  'Your account is not activated yet. Try again later': 'Sua conta ainda não foi ativada. Tente de novo mais tarde.',
  'Write a reply': 'Escreva uma resposta',
  'Type your reply here.': 'Digite sua resposta aqui.',
  'Reply': 'Responder',
  'Close this ticket': 'Encerrar este chamado',
  'No reply is required to close': 'Para encerrar, não é preciso escrever uma resposta',
  'Your reply has been submitted. Your agent will reply ASAP.': 'Sua resposta foi enviada. A equipe responderá assim que possível.',
  'Thanks for your reply. The ticket is now closed.': 'Obrigado pela resposta. O chamado foi encerrado.',
  'The ticket was successfully closed': 'O chamado foi encerrado.',
  'You are not allowed to view this ticket.': 'Você não tem permissão para ver este chamado.',
  'You are not allowed to reply to this ticket.': 'Você não tem permissão para responder a este chamado.',
  'Title': 'Título',
  'Status': 'Status',
  'Date': 'Data',
  'Open': 'Aberto',
  'Closed': 'Encerrado',
  'No tickets found.': 'Nenhum chamado encontrado.',
  'Previous Page': 'Página anterior',
  'Next Page': 'Próxima página',
  'Loading...': 'Carregando…',
  'Please Wait...': 'Aguarde…',
  'Attachments': 'Anexos',
  'Attachments:': 'Anexos:',
  'Drop files here to upload': 'Solte os arquivos aqui para enviar',
  'Please select': 'Selecione',
  'The field %s is required.': 'O campo %s é obrigatório.',
  'I accept the %sterms and conditions%s': 'Eu aceito os %stermos e condições%s',
  'It is mandatory to provide a title for your issue.': 'Informe um título para o chamado.',
  'It is mandatory to provide a description for your issue.': 'Descreva o problema no chamado.',
  'Only registered accounts can submit a ticket. Please register first.': 'Só contas cadastradas podem abrir chamados. Crie seu cadastro primeiro.',
  "The ticket couldn't be submitted for an unknown reason.": 'Não foi possível enviar o chamado. Tente de novo.',
  'Product': 'Produto',
  'Department': 'Departamento',
  'Priority': 'Prioridade',
  'Ticket Type': 'Tipo de chamado',
  'Load newer replies': 'Carregar respostas mais recentes',
  'Load older replies': 'Carregar respostas anteriores',
  '%s ago': 'há %s',
  'User': 'Usuário',
  'Message': 'Mensagem',
  'ID': 'Nº',
  'You are being redirected...': 'Redirecionando…',
};

// ——— PO (msgctxt, msgid, msgid_plural, msgstr[n]) ———
const unq = (s) => s.slice(1, -1).replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t', '"': '"', '\\': '\\' })[c] ?? c);
function parsePo(text) {
  const out = [];
  let cur = null;
  let field = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      if (cur?.msgid !== undefined) out.push(cur);
      cur = null;
      field = null;
      continue;
    }
    const m = line.match(/^(msgctxt|msgid|msgid_plural|msgstr(?:\[\d+\])?)\s+(".*")$/);
    if (m) {
      cur ??= {};
      field = m[1];
      cur[field] = unq(m[2]);
    } else if (line.startsWith('"') && cur && field) cur[field] += unq(line);
  }
  if (cur?.msgid !== undefined) out.push(cur);
  return out;
}

// Textos das telas públicas do plugin.
async function publicStrings() {
  const files = [];
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.php')) files.push(p);
    }
  };
  for (const d of ['themes/default', 'includes/shortcodes', 'includes/custom-fields', 'includes/file-uploader']) await walk(path.join(pluginDir, d));
  for (const f of ['functions-user.php', 'functions-templating.php', 'functions-post.php', 'functions-reply.php', 'functions-general.php']) files.push(path.join(pluginDir, 'includes', f));
  const set = new Set();
  const re = /(?:__|_e|esc_html__|esc_html_e|esc_attr__|esc_attr_e)\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*,\s*'awesome-support'/g;
  for (const f of files) {
    if (f.includes('/admin')) continue;
    const s = await readFile(f, 'utf8');
    for (const m of s.matchAll(re)) set.add(m[1] === "'" ? m[2].replace(/\\'/g, "'") : m[2].replace(/\\"/g, '"'));
  }
  return set;
}

const po = parsePo(await readFile(poFile, 'utf8'));
const wanted = await publicStrings();
const map = {};
for (const e of po) {
  if (e.msgctxt || e.msgid_plural || !e.msgid || !wanted.has(e.msgid)) continue;
  const t = e.msgstr ?? '';
  if (t) map[e.msgid] = t;
}
Object.assign(map, AJUSTES);
const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
const php = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const body = keys.map((k) => `\t${php(k)} => ${php(map[k])},`).join('\n');
await writeFile(
  OUT,
  `<?php
/**
 * Tradução em português dos textos públicos do Awesome Support (gerado por scripts/traducoes-suporte.mjs
 * no repositório do site; não edite à mão — ajuste o script e gere de novo).
 * Fonte: translate.wordpress.org (pt-br, Stable) + ajustes da MSSERVER. ${keys.length} textos.
 */

defined( 'ABSPATH' ) || exit;

return array(
${body}
);
`,
);
console.log(`Gravado: ${path.relative(process.cwd(), OUT)} (${keys.length} textos; ${wanted.size} textos públicos no plugin, ${Object.keys(AJUSTES).length} ajustes)`);
