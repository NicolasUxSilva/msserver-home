<?php
/**
 * Português nas telas do Awesome Support, qualquer que seja o idioma do WordPress.
 *
 * O WordPress de msserver.com.br está em inglês, então nenhuma tradução do Awesome Support é
 * carregada e o cliente vê "Log in", "Register", "Forgot password?". O mapa (traducoes-awesome-support.php,
 * gerado a partir da tradução oficial do plugin com os termos do site) vale só para o domínio
 * "awesome-support"; o resto do WordPress não muda. Mensagens de erro de login do próprio WordPress
 * ("senha incorreta" etc.) seguem o idioma do site: veja docs/SUPORTE.md (trocar o idioma do site
 * para Português do Brasil resolve também as telas do wp-login.php).
 */

defined( 'ABSPATH' ) || exit;

/** @return array<string, string> */
function msserver_suporte_traducoes() {
	static $mapa = null;
	if ( null === $mapa ) {
		$mapa = (array) require __DIR__ . '/traducoes-awesome-support.php';
	}
	return $mapa;
}

add_filter(
	'gettext_awesome-support',
	function ( $traducao, $texto ) {
		// Respeita uma tradução já carregada (site em português com o pacote de idioma do plugin).
		if ( $traducao !== $texto ) {
			return $traducao;
		}
		$mapa = msserver_suporte_traducoes();
		return $mapa[ $texto ] ?? $traducao;
	},
	10,
	2
);
