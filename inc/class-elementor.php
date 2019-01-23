<?php
/**
 * Elementor core integration.
 *
 * @package AnalogWP
 */

namespace Analog;

/**
 * Intializes scripts/styles needed for AnalogWP modal on Elementor editing page.
 */
class Elementor {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'elementor/editor/before_enqueue_scripts', [ $this, 'enqueue_editor_scripts' ] );
		add_action( 'elementor/preview/enqueue_styles', [ $this, 'enqueue_editor_scripts' ] );
	}

	/**
	 * Load styles and scripts for Elementor modal.
	 *
	 * @return void
	 */
	public function enqueue_editor_scripts() {
		do_action( 'ang_loaded' );

		wp_enqueue_script( 'analogwp-elementor-modal', ANG_PLUGIN_URL . 'assets/js/elementor-modal.js', [ 'jquery' ], filemtime( ANG_PLUGIN_DIR . 'assets/js/elementor-modal.js' ), false );
		wp_enqueue_style( 'analogwp-elementor-modal', ANG_PLUGIN_URL . 'assets/css/elementor-modal.css', [], filemtime( ANG_PLUGIN_DIR . 'assets/css/elementor-modal.css' ) );

		wp_enqueue_script( 'analogwp-app', ANG_PLUGIN_URL . 'assets/js/app.js', [ 'react', 'react-dom', 'wp-components' ], ANG_VERSION, true );

		wp_localize_script(
			'analogwp-app', 'AGWP', [
				'ajaxurl'          => admin_url( 'admin-ajax.php' ),
				'is_settings_page' => false,
			]
		);
	}
}

new \Analog\Elementor();
