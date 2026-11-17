<?php
/**
 * Modelo das páginas de suporte: a casca do site (app/shell.html) com o conteúdo do Awesome Support.
 *
 * Ordem das chamadas como num tema: wp_head(), conteúdo, wp_footer(). Cada parte é capturada e
 * colocada no seu marcador da casca:
 *  - <meta name="msserver-wp-head">                 → wp_head() (título, SEO, estilos e scripts)
 *  - %%MS_TITULO%% / %%MS_INTRO%%                   → título e texto de apoio da página
 *  - %%MS_CONTEUDO%%                                → formulários e listas do Awesome Support
 *  - <script … data-msserver-wp-footer></script>    → wp_footer()
 *  - {{MS_APP_URL}}                                 → endereço da pasta app/ do plugin (estilos, scripts e imagens do site)
 */

defined( 'ABSPATH' ) || exit;

$atual = msserver_suporte_atual();
$casca = (string) file_get_contents( MSSERVER_SUPORTE_DIR . '/app/shell.html' );

ob_start();
wp_head();
$cabeca = ob_get_clean();

$conteudo = msserver_suporte_conteudo();

ob_start();
wp_footer();
$rodape = ob_get_clean();

echo strtr( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- partes já escapadas ou geradas pelo WordPress.
	$casca,
	array(
		'<meta name="msserver-wp-head">'                       => $cabeca,
		'%%MS_TITULO%%'                                        => esc_html( $atual['titulo'] ),
		'%%MS_INTRO%%'                                         => esc_html( $atual['intro'] ),
		'%%MS_CONTEUDO%%'                                      => $conteudo,
		'<script type="text/plain" data-msserver-wp-footer></script>' => $rodape,
		'{{MS_APP_URL}}'                                       => esc_url( MSSERVER_SUPORTE_URL . '/app' ),
	)
);
