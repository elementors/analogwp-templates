<?php
/**
 * Analog Elementor Tools.
 *
 * @package AnalogWP
 */

namespace Analog\Elementor;

use Analog\Base;
use WP_Post;
use WP_Error;

/**
 * Analog Elementor Tools.
 *
 * @package Analog\Elementor
 * @since 1.2.1
 */
class Tools extends Base {
	const BULK_EXPORT_ACTION = 'analog_export_multiple_kits';

	/**
	 * Tools constructor.
	 */
	public function __construct() {
		$this->add_actions();
	}

	private function add_actions() {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );

		if ( is_admin() ) {
			add_action( 'admin_footer', [ $this, 'import_stylekit_template' ] );
			add_filter( 'post_row_actions', [ $this, 'post_row_actions' ], 10, 2 );

			add_action( 'wp_ajax_analog_style_kit_export', [ $this, 'handle_style_kit_export' ] );

			// Template library bulk actions.
			add_filter( 'bulk_actions-edit-ang_tokens', [ $this, 'admin_add_bulk_export_action' ] );
			add_filter( 'handle_bulk_actions-edit-ang_tokens', [ $this, 'admin_export_multiple_templates' ], 10, 3 );
		}
	}

	public static function is_tokens_screen() {
		global $current_screen;

		if ( ! $current_screen ) {
			return false;
		}

		return 'edit' === $current_screen->base && 'ang_tokens' === $current_screen->post_type;
	}

	public function enqueue_scripts() {
		if ( ! self::is_tokens_screen() ) {
			return;
		}

		wp_enqueue_script(
			'ang-cpt-tools',
			ANG_PLUGIN_URL . 'inc/elementor/js/ang-cpt-tools.js',
			[ 'jquery' ],
			ANG_VERSION,
			true
		);
	}

	/**
	 * Get template export link.
	 *
	 * Retrieve the link used to export a single template based on the template
	 * ID.
	 *
	 * @access private
	 * @param int $kit_id The template ID.
	 * @return string Template export URL.
	 */
	private function get_export_link( $kit_id ) {
		return add_query_arg(
			[
				'action' => 'analog_style_kit_export',
				'_nonce' => wp_create_nonce( 'analog_ajax' ),
				'kit_id' => $kit_id,
			],
			admin_url( 'admin-ajax.php' )
		);
	}

	/**
	 * Post row actions.
	 *
	 * Add an export link to the template library action links table list.
	 *
	 * Fired by `post_row_actions` filter.
	 *
	 * @access public
	 *
	 * @param array   $actions An array of row action links.
	 * @param WP_Post $post    The post object.
	 *
	 * @return array An updated array of row action links.
	 */
	public function post_row_actions( $actions, WP_Post $post ) {
		if ( self::is_tokens_screen() ) {
			$actions['export-template'] = sprintf( '<a href="%1$s">%2$s</a>', $this->get_export_link( $post->ID ), __( 'Export Template', 'ang' ) );
		}
		return $actions;
	}

	/**
	 * Bulk export action.
	 *
	 * Adds an 'Export' action to the Bulk Actions drop-down in the template
	 * library.
	 *
	 * Fired by `bulk_actions-edit-elementor_library` filter.
	 *
	 * @access public
	 *
	 * @param array $actions An array of the available bulk actions.
	 * @return array An array of the available bulk actions.
	 */
	public function admin_add_bulk_export_action( $actions ) {
		$actions[ self::BULK_EXPORT_ACTION ] = __( 'Export', 'ang' );

		return $actions;
	}

	/**
	 * Add bulk export action.
	 *
	 * Handles the template library bulk export action.
	 *
	 * Fired by `handle_bulk_actions-edit-ang_tokens` filter.
	 *
	 * @access public
	 *
	 * @param string $redirect_to The redirect URL.
	 * @param string $action      The action being taken.
	 * @param array  $post_ids    The items to take the action on.
	 */
	public function admin_export_multiple_templates( $redirect_to, $action, $post_ids ) {
		if ( self::BULK_EXPORT_ACTION === $action ) {
			$result = $this->export_multiple_templates( $post_ids );

			// If you reach this line, the export failed.
			wp_die( $result->get_error_message() );
		}
	}

	/**
	 * Prepare Style Kit to export.
	 *
	 * Retrieve the relevant template data and return them as an array.
	 *
	 * @access private
	 *
	 * @param int $kit_id The template ID.
	 * @return WP_Error|array Exported template data.
	 */
	private function prepare_kit_export( $kit_id ) {
		$tokens = get_post_meta( $kit_id, '_tokens_data', true );

		if ( empty( $tokens ) ) {
			return new WP_Error( 'empty_kit', 'The Style Kit is empty' );
		}

		$kit_data = [];

		$kit_data['content'] = $tokens;
		$kit_data['title']   = get_the_title( $kit_id );

		return [
			'name'    => 'analog-' . $kit_id . '-' . date( 'Y-m-d' ) . '.json',
			'content' => wp_json_encode( $kit_data ),
		];
	}

	/**
	 * Export local template.
	 *
	 * Export template to a file.
	 *
	 * @access public
	 *
	 * @param int $kit_id The Style Kit ID.
	 * @return WP_Error WordPress error if template export failed.
	 */
	public function export_stylekit( $kit_id ) {
		$file_data = $this->prepare_kit_export( $kit_id );

		if ( is_wp_error( $file_data ) ) {
			return $file_data;
		}

		$this->send_file_headers( $file_data['name'], strlen( $file_data['content'] ) );

		// Clear buffering just in case.
		@ob_end_clean(); // @codingStandardsIgnoreLine

		flush();

		// Output file contents.
		echo $file_data['content']; // @codingStandardsIgnoreLine

		die;
	}

	/**
	 * Send file headers.
	 *
	 * Set the file header when export style kit data to a file.
	 *
	 * @access private
	 *
	 * @param string $file_name File name.
	 * @param int    $file_size File size.
	 */
	private function send_file_headers( $file_name, $file_size ) {
		header( 'Content-Type: application/octet-stream' );
		header( 'Content-Disposition: attachment; filename=' . $file_name );
		header( 'Expires: 0' );
		header( 'Cache-Control: must-revalidate' );
		header( 'Pragma: public' );
		header( 'Content-Length: ' . $file_size );
	}

	public function handle_style_kit_export() {
		if ( empty( $_REQUEST['_nonce'] ) || ! wp_verify_nonce( $_REQUEST['_nonce'], 'analog_ajax' ) ) {
			wp_send_json_error( [ 'message' => 'Access Denied.' ] );
		}

		$kit_id = $_REQUEST['kit_id'];

		$this->export_stylekit( $kit_id );

		wp_send_json_success();
	}

	/**
	 * Import template form contents.
	 *
	 * @return void
	 */
	public function import_stylekit_template() {
		if ( ! self::is_tokens_screen() ) {
			return;
		}

		?>
		<div id="analog-hidden-area" hidden aria-hidden="true">
			<a id="analog-import-template-trigger" class="page-title-action"><?php esc_html_e( 'Import Style Kits', 'ang' ); ?></a>
			<div id="analog-import-template-area">
				<div id="analog-import-template-title"><?php esc_html_e( 'Choose an Analog template JSON file or a .zip archive of Analog Style Kits, and add them to the list of Style Kits available in your library.', 'ang' ); ?></div>
				<form id="analog-import-template-form" method="post" action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" enctype="multipart/form-data">
					<input type="hidden" name="action" value="analog_style_kit_export">
					<input type="hidden" name="_nonce" value="<?php echo esc_attr( wp_create_nonce( 'analog-import' ) ); ?>">
					<fieldset id="elementor-import-template-form-inputs">
						<input type="file" name="file" accept=".json,application/json,.zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed" required>
						<input type="submit" class="button" value="<?php esc_attr_e( 'Import Now', 'ang' ); ?>">
					</fieldset>
				</form>
			</div>
		</div>
		<?php
	}
}

new Tools();
