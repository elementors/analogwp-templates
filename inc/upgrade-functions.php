<?php
/**
 * Run upgrade functions.
 *
 * @package AnalogWP
 * @since 1.2
 */

namespace Analog\Upgrade;

use Analog\Utils;

defined( 'ABSPATH' ) || exit;

use Analog\Options;
use Analog\Install_Stylekits as StyleKits;

/**
 * Perform automatic upgrades when necessary.
 *
 * @return void
 */
function do_automatic_upgrades() {
	$did_upgrade       = false;
	$installed_version = Options::get_instance()->get( 'version' );

	if ( version_compare( $installed_version, ANG_VERSION, '<' ) ) {
		// Let us know that an upgrade has happened.
		$did_upgrade = true;
	}

	if ( version_compare( $installed_version, '1.2', '<' ) ) {
		Utils::clear_elementor_cache();
	}

	if ( version_compare( $installed_version, '1.2.1', '<' ) ) {
		Utils::clear_elementor_cache();
	}

	if ( version_compare( $installed_version, '1.3', '<' ) ) {
		Utils::clear_elementor_cache();
	}

	if ( $did_upgrade ) {
		// Bump version.
		Options::get_instance()->set( 'version', ANG_VERSION );
	}
}
add_action( 'admin_init', __NAMESPACE__ . '\do_automatic_upgrades' );

/**
 * Install Sample Stylekits.
 *
 * @return void
 */
function install_stylekits() {
	$stylekits_installed = Options::get_instance()->get( 'installed_stylekits' );

	if ( ! $stylekits_installed ) {
		require_once ANG_PLUGIN_DIR . 'inc/elementor/class-install-stylekits.php';

		$did_fail = StyleKits::get_instance()->perform_install();

		if ( ! $did_fail ) {
			Options::get_instance()->set( 'installed_stylekits', true );
		}
	}
}
// add_action( 'admin_init', __NAMESPACE__ . '\install_stylekits' );

function ends_with( $string, $end_string ) {
	$len = strlen( $end_string );
	if ( 0 === $len ) {
		return true;
	}

	return ( substr( $string, -$len ) === $end_string );
}

function ang_v13_upgrades() {
	$keys = [
		// Heading Text sizes.
		'ang_size_xxl'                      => 'ang_size_xxl_font_size',
		'ang_size_xxl_tablet'               => 'ang_size_xxl_font_size_tablet',
		'ang_size_xxl_mobile'               => 'ang_size_xxl_font_size_mobile',
		'ang_size_xl'                       => 'ang_size_xl_font_size',
		'ang_size_xl_tablet'                => 'ang_size_xl_font_size_tablet',
		'ang_size_xl_mobile'                => 'ang_size_xl_font_size_mobile',
		'ang_size_large'                    => 'ang_size_large_font_size',
		'ang_size_large_tablet'             => 'ang_size_large_font_size_tablet',
		'ang_size_large_mobile'             => 'ang_size_large_font_size_mobile',
		'ang_size_medium'                   => 'ang_size_medium_font_size',
		'ang_size_medium_tablet'            => 'ang_size_medium_font_size_tablet',
		'ang_size_medium_mobile'            => 'ang_size_medium_font_size_mobile',
		'ang_size_small'                    => 'ang_size_small_font_size',
		'ang_size_small_tablet'             => 'ang_size_small_font_size_tablet',
		'ang_size_small_mobile'             => 'ang_size_small_font_size_mobile',

		// Heading size line heights.
		'ang_heading_size_lh_xxl'           => 'ang_size_xxl_line_height',
		'ang_heading_size_lh_xxl_tablet'    => 'ang_size_xxl_line_height_tablet',
		'ang_heading_size_lh_xxl_mobile'    => 'ang_size_xxl_line_height_mobile',
		'ang_heading_size_lh_xl'            => 'ang_size_xl_line_height',
		'ang_heading_size_lh_xl_tablet'     => 'ang_size_xl_line_height_tablet',
		'ang_heading_size_lh_xl_mobile'     => 'ang_size_xl_line_height_mobile',
		'ang_heading_size_lh_large'         => 'ang_size_large_line_height',
		'ang_heading_size_lh_large_tablet'  => 'ang_size_large_line_height_tablet',
		'ang_heading_size_lh_large_mobile'  => 'ang_size_large_line_height_mobile',
		'ang_heading_size_lh_medium'        => 'ang_size_medium_line_height',
		'ang_heading_size_lh_medium_tablet' => 'ang_size_medium_line_height_tablet',
		'ang_heading_size_lh_medium_mobile' => 'ang_size_medium_line_height_mobile',
		'ang_heading_size_lh_small'         => 'ang_size_small_line_height',
		'ang_heading_size_lh_small_tablet'  => 'ang_size_small_line_height_tablet',
		'ang_heading_size_lh_small_mobile'  => 'ang_size_small_line_height_mobile',

		// Text sizes.
		'ang_text_size_xxl'                 => 'ang_text_size_xxl_font_size',
		'ang_text_size_xxl_tablet'          => 'ang_text_size_xxl_font_size_tablet',
		'ang_text_size_xxl_mobile'          => 'ang_text_size_xxl_font_size_mobile',
		'ang_text_size_xl'                  => 'ang_text_size_xl_font_size',
		'ang_text_size_xl_tablet'           => 'ang_text_size_xl_font_size_tablet',
		'ang_text_size_xl_mobile'           => 'ang_text_size_xl_font_size_mobile',
		'ang_text_size_large'               => 'ang_text_size_large_font_size',
		'ang_text_size_large_tablet'        => 'ang_text_size_large_font_size_tablet',
		'ang_text_size_large_mobile'        => 'ang_text_size_large_font_size_mobile',
		'ang_text_size_medium'              => 'ang_text_size_medium_font_size',
		'ang_text_size_medium_tablet'       => 'ang_text_size_medium_font_size_tablet',
		'ang_text_size_medium_mobile'       => 'ang_text_size_medium_font_size_mobile',
		'ang_text_size_small'               => 'ang_text_size_small_font_size',
		'ang_text_size_small_tablet'        => 'ang_text_size_small_font_size_tablet',
		'ang_text_size_small_mobile'        => 'ang_text_size_small_font_size_mobile',

		// Text size line heights.
		'ang_text_size_lh_xxl'              => 'ang_text_size_xxl_line_height',
		'ang_text_size_lh_xxl_tablet'       => 'ang_text_size_xxl_line_height_tablet',
		'ang_text_size_lh_xxl_mobile'       => 'ang_text_size_xxl_line_height_mobile',
		'ang_text_size_lh_xl'               => 'ang_text_size_xl_line_height',
		'ang_text_size_lh_xl_tablet'        => 'ang_text_size_xl_line_height_tablet',
		'ang_text_size_lh_xl_mobile'        => 'ang_text_size_xl_line_height_mobile',
		'ang_text_size_lh_large'            => 'ang_text_size_large_line_height',
		'ang_text_size_lh_large_tablet'     => 'ang_text_size_large_line_height_tablet',
		'ang_text_size_lh_large_mobile'     => 'ang_text_size_large_line_height_mobile',
		'ang_text_size_lh_medium'           => 'ang_text_size_medium_line_height',
		'ang_text_size_lh_medium_tablet'    => 'ang_text_size_medium_line_height_tablet',
		'ang_text_size_lh_medium_mobile'    => 'ang_text_size_medium_line_height_mobile',
		'ang_text_size_lh_small'            => 'ang_text_size_small_line_height',
		'ang_text_size_lh_small_tablet'     => 'ang_text_size_small_line_height_tablet',
		'ang_text_size_lh_small_mobile'     => 'ang_text_size_small_line_height_mobile',
	];

	$must_haves = [
		'ang_size_xxl'         => 'ang_size_xxl_typography',
		'ang_size_xl'          => 'ang_size_xl_typography',
		'ang_size_large'       => 'ang_size_large_typography',
		'ang_size_medium'      => 'ang_size_medium_typography',
		'ang_size_small'       => 'ang_size_small_typography',
		'ang_text_size_xxl'    => 'ang_text_size_xxl_typography',
		'ang_text_size_xl'     => 'ang_text_size_xl_typography',
		'ang_text_size_large'  => 'ang_text_size_large_typography',
		'ang_text_size_medium' => 'ang_text_size_medium_typography',
		'ang_text_size_small'  => 'ang_text_size_small_typography',
	];

	$query = new \WP_Query(
		[
			'post_type'      => 'ang_tokens',
			'posts_per_page' => -1,
		]
	);

	if ( $query->have_posts() ) {
		$posts = $query->posts;

		foreach ( $posts as $post ) {
			$tokens_raw = get_post_meta( $post->ID, '_tokens_data', true );
			$tokens     = json_decode( $tokens_raw, true );

			foreach ( $keys as $old => $new ) {
				if ( isset( $tokens[ $old ] ) && is_array( $tokens[ $old ] ) && count( $tokens[ $old ] ) ) {
					$tokens[ $new ] = $tokens[ $old ];

					if ( \array_key_exists( $old, $must_haves ) ) {
						$key = $must_haves[ $old ];
						$tokens[ $key ] = 'custom';
					}
				}
			}

			update_post_meta( $post->ID, '_tokens_data', wp_json_encode( $tokens ) );
		}
	}

	$posts_with_stylekit = \Analog\Utils::posts_using_stylekit();

	if ( count( $posts_with_stylekit ) ) {
		foreach ( $posts_with_stylekit as $post_id ) {
			$settings = get_post_meta( $post_id, '_elementor_page_settings', true );

			foreach ( $keys as $old => $new ) {
				if ( isset( $settings[ $old ] ) && is_array( $settings[ $old ] ) && count( $settings[ $old ] ) ) {
					$settings[ $new ] = $settings[ $old ];

					if ( \array_key_exists( $old, $must_haves ) ) {
						$key = $must_haves[ $old ];
						$settings[ $key ] = 'custom';
					}
				}
			}

			update_post_meta( $post_id, '_elementor_page_settings', $settings );
		}
	}
}
