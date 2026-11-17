<?php
/**
 * Páginas de suporte: identificação, modelo próprio e limpeza de estilos do tema.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Endereços (slugs) das páginas de suporte publicadas e o texto de apoio de cada uma. Ajustável pelo
 * filtro "msserver_suporte_paginas" (ex.: se uma página mudar de endereço).
 *
 * @return array<string, array{titulo: string, intro: string}>
 */
function msserver_suporte_paginas() {
	return apply_filters(
		'msserver_suporte_paginas',
		array(
			'obter-suporte'  => array(
				'titulo' => 'Obter suporte',
				'intro'  => 'Abra e acompanhe chamados de suporte técnico. Entre com a sua conta ou crie um cadastro para começar.',
			),
			'enviar-chamado' => array(
				'titulo' => 'Enviar chamado',
				'intro'  => 'Descreva o problema e envie o chamado para a equipe técnica da MSSERVER.',
			),
			'meus-chamados'  => array(
				'titulo' => 'Meus chamados',
				'intro'  => 'Acompanhe o andamento dos chamados que você abriu e responda à equipe.',
			),
		)
	);
}

/** A casca do site existe (o plugin foi empacotado com o build)? */
function msserver_suporte_tem_casca() {
	return is_readable( MSSERVER_SUPORTE_DIR . '/app/shell.html' );
}

/**
 * Dados da página de suporte atual, ou null quando não é uma página de suporte.
 *
 * @return array{titulo: string, intro: string, tipo: string}|null
 */
function msserver_suporte_atual() {
	static $atual = false;
	if ( false !== $atual ) {
		return $atual;
	}
	$atual = null;
	if ( is_admin() || ! msserver_suporte_tem_casca() ) {
		return $atual;
	}
	if ( is_singular( 'ticket' ) ) {
		$atual = array(
			'titulo' => single_post_title( '', false ),
			'intro'  => 'Acompanhe e responda este chamado.',
			'tipo'   => 'chamado',
		);
	} elseif ( is_page() ) {
		$pagina = get_queried_object();
		$mapa   = msserver_suporte_paginas();
		if ( $pagina instanceof WP_Post && isset( $mapa[ $pagina->post_name ] ) ) {
			$atual = $mapa[ $pagina->post_name ] + array( 'tipo' => 'pagina' );
		}
	}
	return $atual;
}

// Modelo próprio nas páginas de suporte.
add_filter(
	'template_include',
	function ( $template ) {
		return msserver_suporte_atual() ? MSSERVER_SUPORTE_DIR . '/templates/suporte.php' : $template;
	},
	99
);

/**
 * Estilos e scripts do tema e de outros plugins saem das páginas de suporte; ficam os do WordPress
 * (wp-includes) e os do Awesome Support. Rodando por último, depois que todos enfileiraram.
 */
function msserver_suporte_limpa_fila( WP_Dependencies $fila ) {
	foreach ( $fila->queue as $handle ) {
		$item = $fila->registered[ $handle ] ?? null;
		$src  = $item && is_string( $item->src ) ? $item->src : '';
		$de_terceiros = false !== strpos( $src, '/wp-content/themes/' ) || ( false !== strpos( $src, '/wp-content/plugins/' ) && false === strpos( $src, '/awesome-support/' ) );
		// Estilos globais do editor de blocos (cores e fontes do tema) também saem.
		$estilo_do_tema = in_array( $handle, array( 'global-styles', 'wp-block-library', 'wp-block-library-theme', 'classic-theme-styles', 'core-block-supports' ), true );
		if ( $de_terceiros || $estilo_do_tema ) {
			$fila->dequeue( $handle );
		}
	}
}

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! msserver_suporte_atual() ) {
			return;
		}
		msserver_suporte_limpa_fila( wp_styles() );
		msserver_suporte_limpa_fila( wp_scripts() );
	},
	PHP_INT_MAX
);

/**
 * Conteúdo do Awesome Support da página: os shortcodes do sistema de chamados que a página usa
 * (também quando estão dentro do Elementor), sem os blocos de layout do construtor de páginas. Sem
 * shortcode conhecido, o conteúdo normal da página.
 */
function msserver_suporte_conteudo() {
	$atual = msserver_suporte_atual();
	if ( ! $atual ) {
		return '';
	}
	if ( 'chamado' === $atual['tipo'] ) {
		// No chamado, o Awesome Support monta a conversa pelo filtro the_content.
		ob_start();
		while ( have_posts() ) {
			the_post();
			the_content();
		}
		return ob_get_clean();
	}
	$pagina = get_queried_object();
	$fonte  = $pagina->post_content . ' ' . (string) get_post_meta( $pagina->ID, '_elementor_data', true );
	if ( preg_match_all( '/\[(ticket-submit|tickets)\b[^\]]*\]/', wp_unslash( $fonte ), $m ) ) {
		return implode( '', array_map( 'do_shortcode', array_unique( $m[0] ) ) );
	}
	setup_postdata( $pagina );
	$html = apply_filters( 'the_content', $pagina->post_content );
	wp_reset_postdata();
	return $html;
}
