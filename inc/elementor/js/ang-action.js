/* global jQuery, elementor, elementorCommon, ANG_Action, cssbeautify, elementorModules */
jQuery( window ).on( 'elementor:init', function() {
	const analog = window.analog = window.analog || {};
	const elementorSettings = elementor.settings.page.model.attributes;

	/**
	 * Determines if given key should be exported/imported into Style Kit.
	 *
	 * @param {string} key Setting ID.
	 * @return {bool} True, or false.
	 */
	const eligibleKey = ( key ) => {
		if ( key.startsWith( 'ang_action' ) ) {
			return false;
		}

		return ( key.startsWith( 'ang_' ) || key.startsWith( 'background' ) || key.startsWith( 'hide' ) );
	};

	analog.redirectToSection = function redirectToSection( tab = 'style', section = 'ang_style_settings', page = 'page_settings' ) {
		if ( elementor.helpers.compareVersions( ElementorConfig.document.version, '2.7.0', '<' ) ) {
			const currentView = elementor.panel.currentView;

			currentView.setPage( page );
			currentView.getCurrentPageView().activateTab( tab );
			currentView.getCurrentPageView().activateSection( section );
			currentView.getCurrentPageView().render();
		} else {
			$e.route( `panel/page-settings/${ tab }` );
			elementor.getPanelView().getCurrentPageView().activateSection( section )._renderChildren();
		}
	};

	analog.showStyleKitAttentionDialog = () => {
		const introduction = new elementorModules.editor.utils.Introduction( {
			introductionKey: 'angStylekit',
			dialogType: 'confirm',
			dialogOptions: {
				id: 'ang-stylekit-attention-dialog',
				headerMessage: ANG_Action.translate.sk_header,
				message: ANG_Action.translate.sk_message,
				position: {
					my: 'center center',
					at: 'center center',
				},
				strings: {
					confirm: ANG_Action.translate.sk_learn,
					cancel: elementor.translate( 'got_it' ),
				},
				hide: {
					onButtonClick: false,
				},
				onCancel: () => {
					introduction.setViewed();
					introduction.getDialog().hide();
				},
				onConfirm: () => {
					introduction.setViewed();
					introduction.getDialog().hide();
					analog.redirectToSection();
				},
			},
		} );

		introduction.show();
	};

	analog.styleKitUpdateDialog = () => {
		const modal = elementorCommon.dialogsManager.createWidget( 'lightbox', {
			id: 'ang-stylekit-update',
			headerMessage: ANG_Action.translate.skUpdate,
			message: ANG_Action.translate.skUpdateDesc,
			hide: {
				onOutsideClick: false,
				onBackgroundClick: false,
				onEscKeyPress: false,
			},
		} );

		modal.addButton( {
			name: 'ang_discard',
			text: ANG_Action.translate.discard,
			callback() {
				analog.removeFromQueue();
				// Set to negative value to avoid queue of Global Style Kit.
				elementor.settings.page.model.set( 'ang_action_tokens', '-1' );
			},
		} );

		modal.addButton( {
			name: 'ang_apply',
			text: ANG_Action.translate.apply,
			callback() {
				analog.removeFromQueue();
				analog.applyStyleKit( elementorSettings.ang_action_tokens );
			},
		} );

		return modal;
	};

	analog.hasGlobalKit = () => {
		const modal = elementorCommon.dialogsManager.createWidget( 'lightbox', {
			id: 'ang-has-globalkit',
			headerMessage: ANG_Action.translate.pageStyleHeader,
			message: ANG_Action.translate.pageStyleDesc,
			hide: {
				onOutsideClick: false,
				onBackgroundClick: false,
				onEscKeyPress: false,
			},
		} );

		modal.addButton( {
			name: 'ang_discard',
			text: ANG_Action.translate.discard,
			callback() {
				elementor.settings.page.model.set( 'uses_style_kit', false );
				elementor.saver.defaultSave();
			},
		} );

		modal.addButton( {
			name: 'ang_apply',
			text: ANG_Action.translate.gotoPageStyle,
			callback() {
				elementor.settings.page.model.set( 'uses_style_kit', false );
				analog.redirectToSection();
				elementor.saver.defaultSave();
			},
		} );

		modal.show();
	};

	if ( elementor.settings.page.getSettings().settings.uses_style_kit ) {
		analog.hasGlobalKit();
	}

	analog.StyleKitUpdateModal = analog.styleKitUpdateDialog();

	analog.resetStyles = () => {
		const settings = elementor.settings.page.model.attributes;
		const angSettings = {};
		_.map( settings, function( value, key ) {
			if ( eligibleKey( key ) ) {
				if ( elementor.settings.page.model.controls[ key ] !== undefined ) {
					switch ( typeof elementor.settings.page.model.controls[ key ].default ) {
						case 'string':
							angSettings[ key ] = '';
							break;

						case 'boolean':
							angSettings[ key ] = false;
							break;

						case 'object':
							const type = elementor.settings.page.model.controls[ key ].type;
							let returnVal = '';
							if ( type === 'slider' ) {
								returnVal = { size: '', sizes: [], unit: 'em' };
							}

							if ( type === 'dimensions' ) {
								returnVal = {
									unit: 'px',
									top: '',
									right: '',
									bottom: '',
									left: '',
									isLinked: true,
								};
							}

							angSettings[ key ] = returnVal;
							break;

						default:
							angSettings[ key ] = elementor.settings.page.model.controls[ key ].default;
					}
				}
			}
		} );

		elementor.settings.page.model.set( angSettings );
		elementor.settings.page.model.set( 'ang_action_tokens', '' );

		analog.redirectToSection();
	};

	analog.applyStyleKit = ( value ) => {
		if ( ! value || value === '' ) {
			console.warn( 'No value provided.', value );
			return;
		}

		wp.apiFetch( {
			method: 'post',
			path: 'agwp/v1/tokens/get',
			data: {
				id: value,
			},
		} ).then( function( response ) {
			const data = JSON.parse( response.data );

			if ( Object.keys( data ).length ) {
				elementor.settings.page.model.set( data );
				elementor.settings.page.model.set( 'ang_recently_imported', 'no' );
			}
		} ).catch( function( error ) {
			console.error( error );
		} );
	};

	analog.removeFromQueue = ( id = elementor.config.document.id ) => {
		$.ajax( {
			type: 'POST',
			url: AGWP.ajaxurl,
			data: {
				action: 'ang_remove_kit_queue',
				id: id,
			},
			success: ( response ) => {
				if ( ! response.success ) {
					elementorCommon.dialogsManager.createWidget( 'alert', {
						message: response.data.message,
					} ).show();
				}
			},
			dataType: 'JSON',
		} );
	};

	elementor.on( 'preview:loaded', () => {
		if ( ! elementor.config.user.introduction.angStylekit ) {
			analog.showStyleKitAttentionDialog();
		}

		const settings = elementor.settings.page.model.attributes;

		if ( settings.ang_action_tokens && settings.ang_action_tokens !== '-1' ) {
			analog.applyStyleKit( settings.ang_action_tokens );
		}

		if ( AGWP.stylekit_queue ) {
			const needsRefresh = AGWP.stylekit_queue.find( el => el === elementor.config.document.id );
			if ( needsRefresh && ! analog.StyleKitUpdateModal.isVisible() ) {
				analog.StyleKitUpdateModal.show();
			}
		}

		// elementor.elementsModel.attributes.elements.models.forEach( ( el ) => {
		// 	const classes = el.attributes.settings.attributes.css_classes;
		//
		// 	if ( classes ) {
		// 		const ID = el.id;
		// 		jQuery( elementorFrontend.elements.$body ).find( '[data-id="' + ID + '"]' ).css( 'box-shadow', '0 0 0 1px #3152FF' );
		// 	}
		//
		// 	if ( el.attributes.elements.models.length ) {
		// 		el.attributes.elements.models.map( childEl => {
		// 			const childID = childEl.id;
		//
		// 			if ( childEl.attributes.settings.attributes.css_classes ) {
		// 				jQuery( elementorFrontend.elements.$body ).find( '[data-id="' + childID + '"]' ).css( 'box-shadow', '0 0 0 1px #3152FF' );
		// 			}
		// 		} );
		// 	}
		// } );
	} );

	const BaseData = elementor.modules.controls.BaseData;
	const ControlANGAction = BaseData.extend( {
		initialize: function( options ) {
			BaseData.prototype.initialize.apply( this, arguments );
			this.elementSettingsModel = options.elementSettingsModel;

			if ( this.model.get( 'action' ) === 'update_token' ) {
				this.listenTo( this.elementSettingsModel, 'change', this.toggleControlVisibility );
			}
		},

		toggleControlVisibility: function toggleControlVisibility() {
			if ( this.model.get( 'action' ) !== 'update_token' ) {
				return;
			}

			this.$el.find( 'button' ).attr( 'disabled', true );

			if ( Object.keys( this.elementSettingsModel.changed ).length ) {
				this.$el.find( 'button' ).attr( 'disabled', false );
			}
		},

		ui: function() {
			const ui = BaseData.prototype.ui.apply( this, arguments );

			_.extend( ui, {
				actionButton: 'button',
			} );

			return ui;
		},

		events: function() {
			const events = BaseData.prototype.events.apply( this, arguments );

			events[ 'click @ui.actionButton' ] = 'onChangeEvent';

			return events;
		},

		performAction: function( name ) {
			const actions = {
				export_css: 'handleCSSExport',
				reset_css: 'handleCSSReset',
				save_token: 'handleSaveToken',
				update_token: 'handleTokenUpdate',
			};

			return this[ actions[ name ] ]();
		},

		onChangeEvent: function( event ) {
			const element = event.currentTarget;
			const action = jQuery( element ).data( 'action' );

			this.performAction( action );
		},

		handleCSSExport: function() {
			// Get the whole Page CSS
			const allStyles = elementor.settings.page.getControlsCSS().elements.$stylesheetElement[ 0 ].textContent;

			// Then remove Page's custom CSS.
			const pageCSS = elementor.settings.page.model.get( 'custom_css' );
			const strippedCSS = allStyles.replace( pageCSS, '' );
			const formattedCSS = cssbeautify( strippedCSS, {
				indent: '  ',
				openbrace: 'end-of-line',
				autosemicolon: true,
			} );

			const modal = elementorCommon.dialogsManager.createWidget( 'lightbox', {
				id: 'ang-modal-export-css',
				headerMessage: ANG_Action.translate.exportCSS,
				message: '',
				position: {
					my: 'center',
					at: 'center',
				},
				onReady: function() {
					this.addButton( {
						name: 'cancel',
						text: elementor.translate( 'cancel' ),
						callback: function() {
							modal.destroy();
						},
					} );

					this.addButton( {
						name: 'ok',
						text: ANG_Action.translate.copyCSS,
						callback: function() {
							const content = modal.getElements( 'content' );
							$( content.find( 'textarea' ) ).select();
							document.execCommand( 'copy' );
						},
					} );
				},

				onShow: function() {
					const content = modal.getElements( 'content' );
					content.append( '<textarea rows="10">' + formattedCSS + '</textarea>' );
				},
			} );

			modal.getElements( 'message' ).append( modal.addElement( 'content' ) );
			modal.show();
			jQuery( window ).resize();
		},

		handleCSSReset: function() {
			elementorCommon.dialogsManager.createWidget( 'confirm', {
				message: ANG_Action.translate.resetMessage,
				headerMessage: ANG_Action.translate.resetHeader,
				strings: {
					confirm: elementor.translate( 'yes' ),
					cancel: elementor.translate( 'cancel' ),
				},
				defaultOption: 'cancel',
				onConfirm: analog.resetStyles,
			} ).show();
		},

		handleSaveToken: function() {
			const settings = elementor.settings.page.model.attributes;
			const angSettings = {};

			// Save settings before saving the token.
			elementor.saver.defaultSave();

			_.map( settings, function( value, key ) {
				if ( eligibleKey( key ) ) {
					angSettings[ key ] = value;
				}
			} );

			const modal = elementorCommon.dialogsManager.createWidget( 'lightbox', {
				id: 'ang-modal-save-token',
				headerMessage: ANG_Action.translate.saveToken,
				message: '',
				position: {
					my: 'center',
					at: 'center',
				},
				onReady: function() {
					this.addButton( {
						name: 'cancel',
						text: ANG_Action.translate.cancel,
						callback: function() {
							modal.destroy();
						},
					} );
					this.addButton( {
						name: 'ok',
						text: ANG_Action.translate.saveToken2,
						callback: function( widget ) {
							const title = widget.getElements( 'content' ).find( '#ang_token_title' ).val();

							if ( title ) {
								wp.apiFetch( {
									url: ANG_Action.saveToken,
									method: 'post',
									data: {
										id: elementor.config.post_id,
										title: title,
										tokens: JSON.stringify( angSettings ),
									},
								} ).then( function( response ) {
									const options = elementor.settings.page.model.controls.ang_action_tokens.options;
									options[ response.id ] = title;
									elementor.reloadPreview();

									setTimeout( function() {
										modal.destroy();

										elementor.settings.page.model.set( 'ang_action_tokens', response.id );
										analog.redirectToSection();
									}, 2000 );
								} ).catch( function( error ) {
									console.error( error.message );
								} );
							}
						},
					} );
				},

				onShow: function() {
					const content = modal.getElements( 'content' );
					content.append( `
						<input id="ang_token_title" type="text" value="" placeholder="${ ANG_Action.translate.enterTitle }" />
					` );
				},
			} );

			modal.getElements( 'message' ).append( modal.addElement( 'content' ) );
			modal.show();
			jQuery( window ).resize();
		},

		handleTokenUpdate: function() {
			const postID = elementor.settings.page.model.attributes.ang_action_tokens;
			const currentID = elementor.config.post_id;
			const settings = elementor.settings.page.model.attributes;
			const angSettings = {};

			// Save settings before saving the token.
			elementor.saver.defaultSave();

			_.map( settings, function( value, key ) {
				if ( eligibleKey( key ) ) {
					angSettings[ key ] = value;
				}
			} );

			const modal = elementorCommon.dialogsManager.createWidget( 'confirm', {
				message: ANG_Action.translate.updateMessage,
				headerMessage: ANG_Action.translate.updateKit,
				strings: {
					confirm: elementor.translate( 'yes' ),
					cancel: elementor.translate( 'cancel' ),
				},
				defaultOption: 'cancel',
				onConfirm: function() {
					wp.apiFetch( {
						path: 'agwp/v1/tokens/update',
						method: 'post',
						data: {
							id: postID,
							current_id: currentID,
							tokens: JSON.stringify( angSettings ),
						},
					} ).then( () => {
						elementor.notifications.showToast( {
							message: ANG_Action.translate.tokenUpdated,
						} );

						analog.removeFromQueue();
					} ).catch( error => console.error( error ) );
				},
			} );

			modal.getElements( 'message' ).append( modal.addElement( 'content' ) );
			modal.show();
		},
	} );
	elementor.addControlView( 'ang_action', ControlANGAction );

	elementor.settings.page.addChangeCallback( 'ang_action_tokens', function( value ) {
		analog.applyStyleKit( value );
	} );

	jQuery( document ).on( 'heartbeat-tick', function( event, response ) {
		if ( response.stylekit_queue ) {
			const needsRefresh = response.stylekit_queue.find( el => el === elementor.config.document.id );
			if ( needsRefresh && ! analog.StyleKitUpdateModal.isVisible() ) {
				analog.StyleKitUpdateModal.show();
			}
		}
	} );

	analog.insertColors = () => {
		const settings = elementor.settings.page.model.attributes;

		const colors = [
			settings.ang_color_accent_primary,
			settings.ang_color_accent_secondary,
			settings.ang_color_text_light,
			settings.ang_color_text_dark,
			settings.ang_color_background_light,
			settings.ang_color_background_dark,
			...ANG_Action.palette,
		];

		// Remove null values.
		const angColors = jQuery.unique( colors.filter( ( v ) => v !== '' ) );

		// Return early if requirements aren't met.
		if ( ! jQuery.a8c || ! jQuery.a8c.iris || ! angColors.length ) {
			return;
		}

		jQuery.a8c.iris.prototype._addPalettes = function() {
			let container = this.picker.children( '.iris-palette-container' );
			if ( ! container.length ) {
				container = jQuery( '<div class="iris-palette-container"/>' ).appendTo( this.picker );
			}

			const palette = angColors;

			jQuery.each( palette, function( index, val ) {
				jQuery( '<a class="iris-palette" tabindex="0"/>' )
					.data( 'color', val )
					.css( 'backgroundColor', val )
					.appendTo( container );
			} );

			this.picker.append( container );
		};
	};

	analog.updateColorPicker = () => {
		const container = jQuery( '.iris-palette-container' );
		container.empty();

		const settings = elementor.settings.page.model.attributes;

		const colors = [
			settings.ang_color_accent_primary,
			settings.ang_color_accent_secondary,
			settings.ang_color_text_light,
			settings.ang_color_text_dark,
			settings.ang_color_background_light,
			settings.ang_color_background_dark,
			...ANG_Action.palette,
		];

		// Remove null values.
		const angColors = jQuery.unique( colors.filter( ( v ) => v !== '' ) );

		jQuery.each( angColors, function( index, val ) {
			jQuery( '<a class="iris-palette" tabindex="0"/>' )
				.data( 'color', val )
				.css( 'backgroundColor', val )
				.css( {
					width: '19.2452px',
					height: '19.2452px',
					'margin-right': '3.5805px',
				} )
				.appendTo( container );
		} );
	};

	if ( Boolean( AGWP.syncColors ) === true ) {
		elementor.on( 'preview:loaded', () => {
			analog.insertColors();
		} );

		elementor.settings.page.addChangeCallback( 'ang_color_accent_primary', analog.updateColorPicker );
		elementor.settings.page.addChangeCallback( 'ang_color_accent_secondary', analog.updateColorPicker );
		elementor.settings.page.addChangeCallback( 'ang_color_text_light', analog.updateColorPicker );
		elementor.settings.page.addChangeCallback( 'ang_color_text_dark', analog.updateColorPicker );
		elementor.settings.page.addChangeCallback( 'ang_color_background_light', analog.updateColorPicker );
		elementor.settings.page.addChangeCallback( 'ang_color_background_dark', analog.updateColorPicker );
	}
} );

