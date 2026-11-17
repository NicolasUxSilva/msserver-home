<?php
/**
 * Plugin Name:       MSSERVER — Suporte na identidade do site
 * Description:       Exibe as páginas do Awesome Support (Obter suporte, Enviar chamado, Meus chamados e cada chamado) com o cabeçalho, o rodapé e o visual do novo site da MSSERVER, sem mudar o funcionamento do sistema de chamados (login, cadastro, envio, consulta e respostas continuam com o Awesome Support). Traduz a interface do Awesome Support para o português.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            MSSERVER
 * Text Domain:       msserver-suporte
 *
 * Como funciona (docs/SUPORTE.md no repositório do site):
 *  - Nas páginas de suporte, o plugin troca o modelo do tema pelo seu (templates/suporte.php), que
 *    usa a casca gerada pelo build do site (app/shell.html: cabeçalho, abertura, rodapé, estilos e
 *    scripts do site) e coloca dentro dela o conteúdo do Awesome Support (os shortcodes da página ou,
 *    num chamado, o próprio chamado). wp_head() e wp_footer() continuam sendo chamados: nonces,
 *    scripts do Awesome Support, barra do administrador e plugins de SEO funcionam como antes.
 *  - Só nessas páginas, os estilos e scripts do tema e de outros plugins (Elementor etc.) saem; os do
 *    WordPress e do Awesome Support ficam.
 *  - A pasta app/ é gerada pelo empacotamento (npm run build:suporte no repositório do site). Sem ela,
 *    o plugin não interfere em nada (as páginas continuam com o tema).
 */

defined( 'ABSPATH' ) || exit;

define( 'MSSERVER_SUPORTE_DIR', __DIR__ );
define( 'MSSERVER_SUPORTE_URL', plugins_url( '', __FILE__ ) );

require_once __DIR__ . '/includes/paginas.php';
require_once __DIR__ . '/includes/traducoes.php';
