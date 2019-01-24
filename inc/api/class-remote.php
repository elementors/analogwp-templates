<?php
/**
 * APIs.
 *
 * @package AnalogWP
 */

namespace Analog\API;

use \Analog\Base;

defined( 'ABSPATH' ) || exit;

class Remote extends Base {
	const TRANSIENT_KEY = 'analogwp_template_info';
	const ENDPOINT      = 'https://analogwp.com/wp-json/analogwp/v1/templates/';

	/**
	 * API template URL.
	 * Holds the URL for getting a single template data.
	 *
	 * @var string API template URL.
	 */
	private static $template_url = 'https://analogwp.com/wp-json/analogwp/v1/templates/%d';

	/**
	 * Common API call args.
	 *
	 * @var array
	 */
	public static $api_call_args = [];

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'ang_loaded', [ $this, 'set_templates_info' ] );

		self::$api_call_args = [
			'plugin_version' => ANG_VERSION,
			'site_lang'      => get_bloginfo( 'language' ),
		];
	}

	/**
	 * Retrieve template library and save as a transient.
	 *
	 * @param boolean $force_update Force new info from remote API.
	 * @return void
	 */
	public static function set_templates_info( $force_update = false ) {
		$transient = get_transient( self::TRANSIENT_KEY );

		if ( ! $transient || $force_update ) {
			$info = self::request_remote_templates_info( $force_update );
			set_transient( self::TRANSIENT_KEY, $info, DAY_IN_SECONDS );
		}
	}

	/**
	 * Get template info.
	 *
	 * @param boolean $force_update Force new info from remote API.
	 *
	 * @return array
	 */
	public function get_templates_info( $force_update = false ) {
		if ( ! get_transient( self::TRANSIENT_KEY ) || $force_update ) {
			self::set_templates_info( true );
		}
		return get_transient( self::TRANSIENT_KEY );
	}

	/**
	 * Fetch remote template library info.
	 *
	 * @param boolean $force_update Force update.
	 * @return array $response AnalogWP Templates library.
	 */
	public static function request_remote_templates_info( $force_update ) {
		global $wp_version;

		$body_args = apply_filters( 'analog/api/get_templates/body_args', self::$api_call_args );

		$request = wp_remote_get(
			self::ENDPOINT, [
				'timeout'    => $force_update ? 25 : 8,
				'user-agent' => 'WordPress/' . $wp_version . '; ' . home_url(),
			]
		);

		$response = json_decode( wp_remote_retrieve_body( $request ), true );

		return $response;
	}

	/**
	 * Get a single template content.
	 *
	 * @param int $template_id Template ID.
	 * @return mixed|void
	 */
	public function get_template_content( $template_id ) {
		$url = sprintf( self::$template_url, $template_id );

		$body_args = apply_filters( 'analog/api/get_template_content/body_args', self::$api_call_args );

		$response = wp_remote_get( $url, [
			'timeout' => 40,
			'body'    => $body_args,
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new \WP_Error( 'response_code_error', sprintf( 'The request returned with a status code of %s.', $response_code ) );
		}

		$template_content = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $template_content['error'] ) ) {
			return new \WP_Error( 'response_error', $template_content['error'] );
		}

		if ( empty( $template_content['data'] ) && empty( $template_content['content'] ) ) {
			return new \WP_Error( 'template_data_error', 'An invalid data was returned.' );
		}

		return $template_content;
	}
}

new \Analog\API\Remote();