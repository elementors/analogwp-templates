import styled from "styled-components";
import AnalogContext from "./AnalogContext";
import { markFavorite } from "./api";
import Filters from "./filters";
import Footer from "./Footer";
import Header from "./Header";
import Templates from "./Templates";

const { apiFetch } = wp;

const Analog = styled.div`
	margin: 0 0 0 -20px;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;

	a {
		outline: 0;
		box-shadow: none;
	}
`;

const Content = styled.div`
	background: #e3e3e3;
	padding: 40px;
`;

class App extends React.Component {
	constructor() {
		super(...arguments);

		this.state = {
			templates: [],
			count: null,
			isOpen: false, // Determines whether modal to preview template is open or not.
			syncing: false,
			favorites: AGWP.favorites
		};

		this.refreshAPI = this.refreshAPI.bind(this);
	}

	componentDidMount() {
		apiFetch({ path: "/agwp/v1/templates" }).then(data => {
			this.setState({
				templates: data.templates,
				count: data.count,
				timestamp: data.timestamp
			});
		});
	}

	refreshAPI() {
		this.setState({
			templates: [],
			count: null,
			syncing: true
		});

		apiFetch({
			path: "/agwp/v1/templates/?force_update=true"
		}).then(data => {
			this.setState({
				templates: data.templates,
				count: data.count,
				timestamp: data.timestamp,
				syncing: false
			});
		});
	}

	render() {
		return (
			<Analog>
				<AnalogContext.Provider
					value={{
						state: this.state,
						forceRefresh: this.refreshAPI,
						markFavorite: markFavorite,
						dispatch: action => this.setState(action)
					}}
				>
					<Header />

					<Content>
						<Filters />
						<Templates />
						<Footer />
					</Content>
				</AnalogContext.Provider>
			</Analog>
		);
	}
}

export default App;
