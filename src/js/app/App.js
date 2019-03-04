import styled from 'styled-components';
import AnalogContext from './AnalogContext';
import { getSettings, markFavorite, requestTemplateList } from './api';
import Header from './Header';
import Notifications from './Notifications';
import { getPageComponents, hasProTemplates } from './utils';
const { apiFetch } = wp;

const Analog = styled.div`
	margin: 0 0 0 -20px;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	font-family: "Poppins", sans-serif;
	font-size: 13px;
	position: relative;

	.ang-notices {
		position: fixed;
		right: 0;
		top: 75px;
		padding: 8px;
		z-index: 100000;
	}

	.components-base-control {
		font-family: inherit;
		font-size: inherit;
	}

	a {
		outline: 0;
		box-shadow: none;
	}

	.button-plain {
		padding: 0;
		margin: 0;
		border: none;
		border-radius: 0;
		box-shadow: none;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
		outline: 0;
		background: transparent;
		font-size: inherit;
		font-weight: bold;
		color: #060606;
	}

	button {
		font-family: inherit;
	}

	.button-accent {
		background: #FF7865;
		border: 0;
		border-radius: 0;
		text-transform: uppercase;
		font-size: 12px;
		letter-spacing: 1px;
		font-weight: bold;
		box-shadow: none;
		text-shadow: none;
		color: #fff;
		padding: 15px 24px;
		height: auto;
		&:focus,
		&:active {
			border: none !important;
			background: rgb(255, 120, 101, 0.9) !important;
			box-shadow: none !important;
			color: #fff !important;
		}
		&:hover {
			color: #fff;
			background: rgb(255, 120, 101, 0.9);
			border: none;
		}
	}

	.components-external-link {
		color: #FF7865;
		text-decoration: none;
		font-weight: 500;
	}
`;

const Content = styled.div`
	background: #e3e3e3;
	padding: 40px;
`;

class App extends React.Component {
	constructor() {
		super( ...arguments );

		this.state = {
			templates: [],
			count: null,
			isOpen: false, // Determines whether modal to preview template is open or not.
			syncing: false,
			favorites: AGWP.favorites,
			showing_favorites: false,
			archive: [], // holds template archive temporarily for filter/favorites, includes all templates, never set on it.
			filters: [],
			showFree: true,
			tab: 'library',
			hasPro: false,
			settings: [],
		};

		this.refreshAPI = this.refreshAPI.bind( this );
		this.toggleFavorites = this.toggleFavorites.bind( this );
		this.handleSearch = this.handleSearch.bind( this );
		this.handleSort = this.handleSort.bind( this );
		this.handleFilter = this.handleFilter.bind( this );
	}

	async componentDidMount() {
		const currentURL = new URL( window.location.href );
		const hash = currentURL.hash.slice( 1 );

		if ( hash && Boolean( AGWP.is_settings_page ) ) {
			this.setState( {
				tab: hash,
			} );
		}

		const templates = await requestTemplateList();

		this.setState( {
			templates: templates.templates,
			archive: templates.templates,
			count: templates.count,
			timestamp: templates.timestamp,
			hasPro: hasProTemplates( templates.templates ),
			filters: [ ...new Set( templates.templates.map( f => f.type ) ) ],
		} );

		// Listen for Elementor modal close, so we can reset some states.
		document.addEventListener( 'modal-close', () => {
			this.setState( {
				isOpen: false,
				showing_favorites: false,
				templates: this.state.archive,
			} );
		} );

		getSettings().then( settings => this.setState( { settings } ) );
	}

	handleFilter( type ) {
		const templates = [ ...this.state.archive ];
		if ( type === 'all' ) {
			this.setState( { templates: this.state.archive } );
			return;
		}

		const filtered = templates.filter( template => template.type === type );
		this.setState( { templates: filtered } );
	}

	handleSort( value ) {
		this.setState( {
			showing_favorites: false,
			templates: this.state.archive,
		} );

		if ( 'popular' === value ) {
			const templates = [ ...this.state.archive ];
			const sorted = templates.sort( ( a, b ) => {
				if ( 'popularityIndex' in a ) {
					if ( parseInt( a.popularityIndex ) < parseInt( b.popularityIndex ) ) {
						return 1;
					}
					if ( parseInt( a.popularityIndex ) > parseInt( b.popularityIndex ) ) {
						return -1;
					}
				}
				return 0;
			} );
			this.setState( { templates: sorted } );
		}

		if ( 'latest' === value ) {
			this.setState( { templates: this.state.archive } );
		}
	}

	handleSearch( value ) {
		const templates = this.state.templates;
		let filtered = [];
		let searchTags = [];

		if ( value ) {
			filtered = templates.filter( template => {
				if ( template.tags ) {
					searchTags = template.tags.filter( tag => {
						return tag.toLowerCase().includes( value );
					} );
				}
				return (
					template.title.toLowerCase().includes( value ) || searchTags.length >= 1
				);
			} );
		}

		this.setState( {
			templates: filtered.length ? filtered : this.state.archive,
		} );
	}

	async refreshAPI() {
		this.setState( {
			templates: [],
			archive: [],
			count: null,
			syncing: true,
		} );

		return await apiFetch( {
			path: '/agwp/v1/templates/?force_update=true',
		} ).then( data => {
			this.setState( {
				templates: data.templates,
				archive: data.templates,
				count: data.count,
				timestamp: data.timestamp,
				syncing: false,
			} );
		} ).catch( () => {
			this.setState( {
				syncing: false,
			} );
		} );
	}

	toggleFavorites() {
		const filteredTemplates = this.state.templates.filter(
			template => template.id in this.state.favorites
		);

		this.setState( {
			showing_favorites: ! this.state.showing_favorites,
			templates: ! this.state.showing_favorites ?
				filteredTemplates :
				this.state.archive,
		} );
	}

	render() {
		return (
			<Analog>
				<Notifications>
					<AnalogContext.Provider
						value={ {
							state: this.state,
							forceRefresh: this.refreshAPI,
							markFavorite: markFavorite,
							toggleFavorites: this.toggleFavorites,
							handleSearch: this.handleSearch,
							handleSort: this.handleSort,
							handleFilter: this.handleFilter,
							dispatch: action => this.setState( action ),
						} }
					>
						<Header />

						<Content>
							{ getPageComponents( this.state ) }
						</Content>
					</AnalogContext.Provider>
				</Notifications>
			</Analog>
		);
	}
}

export default App;
