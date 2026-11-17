<?php
/**
 * Plugin Name:       MSSERVER — Orçamento sem pagamento online
 * Description:       A MSSERVER trabalha com orçamento e atendimento comercial, sem pagamento pelo site. Este plugin fecha, no WooCommerce, todos os caminhos que levam a um pagamento: o checkout clássico, o checkout da Store API, a página de pagamento de pedidos e o botão "Pagar" de "Minha conta". O carrinho (Store API) continua funcionando para a finalização de orçamento do novo site.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * WC requires at least: 8.2
 * Author:            MSSERVER
 * Text Domain:       msserver-orcamento
 *
 * Instalação somente com autorização da MSSERVER (docs/SEGURANCA-WORDPRESS.md, item "pagamento").
 * Não desativa nem remove o plugin de pagamento: só impede que ele seja oferecido e usado. Para voltar
 * ao comportamento anterior, basta desativar este plugin.
 *
 * O que muda:
 *  1. Nenhum meio de pagamento é oferecido (woocommerce_available_payment_gateways → vazio).
 *  2. O checkout clássico não cria pedidos (validação com aviso) — cobre o POST em /finalizar-compra/
 *     e o /?wc-ajax=checkout.
 *  3. O checkout da Store API (POST /wp-json/wc/store/v1/checkout) responde 403 com a mesma mensagem.
 *  4. A página de pagamento de pedido (/finalizar-compra/order-pay/…) redireciona para a finalização
 *     de orçamento; o botão "Pagar" sai da lista de pedidos de "Minha conta".
 *  5. GET em /finalizar-compra/ servido pelo WordPress (acesso direto, sem o roteamento do novo site)
 *     redireciona para /carrinho/ (o novo site atende /finalizar-compra/ em produção).
 */

defined( 'ABSPATH' ) || exit;

/** Mensagem exibida em todos os bloqueios. */
function msserver_orcamento_mensagem() {
	return 'A MSSERVER não recebe pagamentos pelo site. Envie a sua solicitação de orçamento pelo carrinho ou fale com o comercial pelo WhatsApp (11) 98599-1837.';
}

// 1. Nenhum meio de pagamento oferecido (o formulário de cartão não aparece).
add_filter(
	'woocommerce_available_payment_gateways',
	function ( $gateways ) {
		return is_admin() ? $gateways : array();
	},
	PHP_INT_MAX
);

// 2. Checkout clássico: o pedido não é criado.
add_action(
	'woocommerce_after_checkout_validation',
	function ( $data, $errors ) {
		$errors->add( 'msserver_sem_pagamento', msserver_orcamento_mensagem() );
	},
	PHP_INT_MAX,
	2
);

// 3. Checkout da Store API (blocos e chamadas diretas): 403, sem criar pedido.
add_filter(
	'rest_pre_dispatch',
	function ( $result, $server, $request ) {
		$rota = untrailingslashit( $request->get_route() );
		if ( preg_match( '#^/wc/store(?:/v\d+)?/checkout(?:/\d+)?$#', $rota ) && 'GET' !== $request->get_method() ) {
			return new WP_Error( 'msserver_sem_pagamento', msserver_orcamento_mensagem(), array( 'status' => 403 ) );
		}
		return $result;
	},
	10,
	3
);

// 4. Pagamento de pedido e "Pagar" em "Minha conta".
add_filter(
	'woocommerce_my_account_my_orders_actions',
	function ( $actions ) {
		unset( $actions['pay'] );
		return $actions;
	},
	PHP_INT_MAX
);

add_action(
	'template_redirect',
	function () {
		if ( ! function_exists( 'is_checkout' ) || is_admin() ) {
			return;
		}
		// Página de pagamento de um pedido: a finalização de orçamento do site.
		if ( function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ) {
			wp_safe_redirect( home_url( '/finalizar-compra/' ), 302 );
			exit;
		}
		// 5. Checkout do WooCommerce aberto pelo WordPress (sem o roteamento do novo site): o carrinho.
		// O pedido recebido (order-received) continua acessível para quem já tem o link.
		if ( is_checkout() && ! is_wc_endpoint_url( 'order-received' ) && 'GET' === ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) {
			wp_safe_redirect( home_url( '/carrinho/' ), 302 );
			exit;
		}
	},
	1
);
