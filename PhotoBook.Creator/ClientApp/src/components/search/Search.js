import React, { Component } from 'react';
import { locationStore, tagStore } from '../stores';
import { searchService } from '../services';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { PagedResultsForm } from '../paged-results/PagedResultsForm';
import { PagedResults } from '../paged-results/PagedResults';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Image } from '../Image';

export default class Search extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.state = {
      pageSize: 50,
      page: 1,
      searching: false,
      displayAllFaces: false,
      filters: [],
      states: [],
      cities: [],
      locations: [],
      tags: [],
      searchResults: { numResults: 0 },
      numColumnsClass: "three-col"
    };

  }
  componentDidMount() {
    this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
    this.subscriptions.push(locationStore.subscribe(state => this.handleLocationStoreChange(state)));
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  handleLocationStoreChange(state) {
    const states = state.states.map(s => {
      if (this.state.filters.find(f => f.id === s.id && f.type === s.type)) {
        s.active = true;
      }
      return s;
    }),
    cities = state.cities.map(s => {
      if (this.state.filters.find(f => f.id === s.id && f.type === s.type)) {
        s.active = true;
      }
      return s;
    }),
    locations = state.locations.map(s => {
      if (this.state.filters.find(f => f.id === s.id && f.type === s.type)) {
        s.active = true;
      }
      return s;
    });
    this.setState({ states, cities, locations });
  }
  handleTagStoreChange(state) {
    this.setState({
      tags: state.tags,
      tagTypes: state.types.map(tagType => { return { id: tagType, name: tagType, type: 'tagType'}; })
    });
  }
  handlePageChange(pageNumber) {
    if (this.state.searched && this.searchParams && !this.state.searching) {
      const params = Object.assign({}, this.searchParams);
      params.page = pageNumber;
      params.pageSize = this.state.pageSize;
      this.handleSearch(params);
    }
  }

  handleSearch(params) {
    if (!this.state.searching) {
      params.states = this.state.filters.filter(t => t.type === 'state' && t.active).map(t => t.id);
      params.cities = this.state.filters.filter(t => t.type === 'city' && t.active).map(t => t.name);
      params.locations = this.state.filters.filter(t => t.type === 'location' && t.active).map(t => t.id);

      this.searchParams = params;
      let searchParams = Object.assign({}, params);
      delete searchParams.page;
      delete searchParams.pageSize;
      const terms = JSON.stringify(searchParams);
      this.terms = terms;
      searchParams.page = params.page;
      searchParams.pageSize = params.pageSize || this.state.pageSize;

      this.searchParams = searchParams;
      this.setState({ searching: true });
      searchService.search(searchParams).then(data => {
        if (data && this.terms === terms) {
          //same search result
          this.setState({ searchResults: { page: searchParams.page, pageSize: searchParams.pageSize, numResults: data.totalResults, pagedResults: data.results }, searched: true, searching: false });
        }
      });
    }
  }
  handleFilterChange(type, value) {
    if (type === 'pagesize') {
      this.setState({ pageSize: value, page: 1 });
      if (this.state.searched && !this.state.searching && this.searchParams) {
        this.searchParams.page = 1;
        this.searchParams.pageSize = value;

        this.handleSearch(this.searchParams);
      }
      return;
    } else if (type === 'columnsize') {
      this.setState({ numColumnsClass: value });
      return;
    } else if (type === 'location') {
      value.name = value.formatted;
    }
    value.filterType = type;

    var filters = this.state.filters;
    value.active = !value.active;
    if (value.active) {
      filters.push(value);
    } else {
      filters = filters.filter(f => !(f.id === value.id && (f.type === type || f.type === value.type)));
    }
    this.setState({ filters: filters });
  }
  handleRemoveFilter(filter) {
    var filters = this.state.filters.filter(f => !(f.id === filter.id && f.type === filter.type));
    this.setState({ filters: filters });
    if (filter.type === 'state') {
      const states = this.state.states,
        s = states.find(s => s.id === filter.id);
      s.active = false;
      this.setState({ states });
    } else if (filter.type === 'city') {
      const cities = this.state.cities,
        c = cities.find(c => c.id === filter.id);
      c.active = false;
      this.setState({ cities });
    } else if (filter.type === 'location') {
      const locations = this.state.locations,
        location = locations.find(location => location.id === filter.id);
      location.active = false;
      this.setState({ locations });
    }
  }

  renderSearchResults() {
    return (
      <PagedResults {...this.props} pagedResults={this.state.searchResults} handlePageChange={pageNumber => this.handlePageChange(pageNumber)} numColumnsClass={this.state.numColumnsClass}>
        {
          this.state.searchResults.pagedResults.map(img =>
            <Image {...this.props} key={img.id} id={img.id} locationId={img.locationId} img={img} displayAllFaces={this.state.displayAllFaces} toggleDisplayAllFaces={() => this.setState({ displayAllFaces: !this.state.displayAllFaces })} tags={this.state.tags} locations={this.state.locations} />
          )
        }
      </PagedResults>
    );
  }
  render() {
    var results = null;
    if (!this.state.searching) {
      if (this.state.searchResults.numResults > 0) {
        results = this.renderSearchResults();
      } else if (this.state.searched) {
        results = <div><p>No Results</p></div>
      }
    }

    return (
      <div className="search">
        <PagedResultsForm {...this.props} submitText={this.state.searching ? 'Searching...' : 'Search'} submit={params => this.handleSearch(params)} handleFilterChange={(type, value) => this.handleFilterChange(type, value)} handleRemoveFilter={filter => this.handleRemoveFilter(filter)} numColumnsClass={this.state.numColumnsClass} filters={this.state.filters} pageSize={this.state.pageSize} displayCalendar={true} includeNoTag="true">
          <Dropdown isOpen={this.state.statesDropdown} toggle={e => this.setState({ statesDropdown: !this.state.statesDropdown })}>
            <DropdownToggle variant="success">States</DropdownToggle>
            <DropdownMenu>
              {
                this.state.states.map(state =>
                  <DropdownItem key={state.id} onClick={e => this.handleFilterChange('state', state)}>
                    {state.name} {state.active ? <FontAwesomeIcon icon={faCheck} /> : null}
                  </DropdownItem>
                )
              }
            </DropdownMenu>
          </Dropdown>
          <Dropdown isOpen={this.state.citiesDropdown} toggle={e => this.setState({ citiesDropdown: !this.state.citiesDropdown })}>
            <DropdownToggle variant="success">Cities</DropdownToggle>
            <DropdownMenu>
              {
                this.state.cities.map(city =>
                  <DropdownItem key={city.id} onClick={e => this.handleFilterChange('city', city)}>
                    {city.name} {city.active ? <FontAwesomeIcon icon={faCheck} /> : null}
                  </DropdownItem>
                )
              }
            </DropdownMenu>
          </Dropdown>
          <Dropdown isOpen={this.state.locationsDropdown} toggle={e => this.setState({ locationsDropdown: !this.state.locationsDropdown })}>
            <DropdownToggle variant="success">Locations</DropdownToggle>
            <DropdownMenu>
              {
                this.state.locations.map(location =>
                  <DropdownItem key={location.id} onClick={e => this.handleFilterChange('location', location)}>
                    {location.dropdownFormatted} {location.active ? <FontAwesomeIcon icon={faCheck} /> : null}
                  </DropdownItem>
                )
              }
            </DropdownMenu>
          </Dropdown>
        </PagedResultsForm>
        {results}
      </div>
    );
  }
}