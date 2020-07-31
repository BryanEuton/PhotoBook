import React, { useEffect, useState } from 'react';
import { locationStore, tagStore, faceStore } from '../stores';
import { searchService } from '../services';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { PagedResultsForm } from '../paged-results/PagedResultsForm';
import { PagedResults } from '../paged-results/PagedResults';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Image } from '../Image';

export const Search = props => {
  const [pageSize, setPageSize] = useState(50),
    [citiesDropdownOpen, setCitiesDropdownOpen] = useState(false),
    [locationsDropdownOpen, setLocationsDropdownOpen] = useState(false),
    [statesDropdownOpen, setStatesDropdownOpen] = useState(false),
    [searched, setSearched] = useState(false),
    [searching, setSearching] = useState(false),
    [displayAllFaces, setDisplayAllFaces] = useState(false),
    [filters, setFilters] = useState([]),
    [states, setStates] = useState([]),
    [cities, setCities] = useState([]),
    [locations, setLocations] = useState([]),
    [tags, setTags] = useState([]),
    [searchResults, setSearchResults] = useState({ numResults: 0 }),
    [searchParams, setSearchParams] = useState({ }),
    [numColumnsClass, setNumColuumnsClass] = useState('three-col'),
    [locationStoreVersion, setLocationStoreVersion] = useState(0),
    [tagStoreVersion, setTagStoreVersion] = useState(0);
  
  useEffect(() => {
    let ignore = false;
    function handleLocationStoreChange(state, v) {
      if (ignore) {
        return;
      }
      setLocationStoreVersion(v);
      setStates(state.states.map(s => {
        if (filters.find(f => f.id === s.id && f.type === s.type)) {
          s.active = true;
        }
        return s;
      }));
      setCities(state.cities.map(s => {
        if (filters.find(f => f.id === s.id && f.type === s.type)) {
          s.active = true;
        }
        return s;
      }));
      setLocations(state.locations.map(s => {
        if (filters.find(f => f.id === s.id && f.type === s.type)) {
          s.active = true;
        }
        return s;
      }));
    }
    function handleTagStoreChange(state, v) {
      if (ignore) {
        return;
      }
      setTagStoreVersion(v);
      setTags(state.tags);
    }

    const subscriptions = [tagStore.subscribe(tagStoreVersion, handleTagStoreChange),
      locationStore.subscribe(locationStoreVersion, handleLocationStoreChange)];

    return () => {
      ignore = true;
      subscriptions.map(s => {
        if (typeof s === "function") {
          s();
        }
        return null;
      });
    }
  }, [filters, locationStoreVersion, tagStoreVersion]);

  function handlePageChange(pageNumber) {
    if (searched && searchParams && !searching) {
      const params = Object.assign({}, searchParams);
      params.page = pageNumber;
      params.pageSize = pageSize;
      handleSearch(params);
    }
  }

  function handleSearch(params) {
    if (!searching) {
      params.states = filters.filter(t => t.type === 'state' && t.active).map(t => t.id);
      params.cities = filters.filter(t => t.type === 'city' && t.active).map(t => t.name);
      params.locations = filters.filter(t => t.type === 'location' && t.active).map(t => t.id);

      let searchParams = Object.assign({}, params);
      delete searchParams.page;
      delete searchParams.pageSize;

      setSearchParams(searchParams);
      searchParams.page = params.page;
      searchParams.pageSize = params.pageSize || pageSize;

      setSearching(true);
      searchService.search(searchParams).then(data => {
        if (data) {
          //same search result
          setSearchResults({
            page: searchParams.page,
            pageSize: searchParams.pageSize,
            numResults: data.totalResults,
            pagedResults: data.results
          });
          setSearched(true);
          setSearching(false);
        }
      });
    }
  }
  function handleFilterChange(type, value) {
    if (type === 'pagesize') {
      setPageSize(value);
      if (searched && !searching && searchParams) {
        var updatedParams = searchParams;
        updatedParams.page = 1;
        updatedParams.pageSize = value;

        handleSearch(updatedParams);
      }
      return;
    } else if (type === 'columnsize') {
      setNumColuumnsClass(value);
      return;
    } else if (type === 'location') {
      value.name = value.formatted;
    }
    value.filterType = type;

    let updated = [...filters],
      existing = updated.find(f => f.id === value.id && (f.type === type || f.type === value.type));

    value.active = !value.active;
    if (value.active) {
      if (existing) {
        existing.active = value.active;
      } else {
        updated.push(value);
      }
    } else {
      updated = updated.filter(f => !(f.id === value.id && (f.type === type || f.type === value.type)));
    }

    setFilters(updated);
  }
  function handleRemoveFilter(filter) {
    let updated = [...filters].filter(f => !(f.id === filter.id && f.type === filter.type));
    setFilters(updated);
    if (filter.type === 'state') {
      const updatedStates = states,
        s = updatedStates.find(s => s.id === filter.id);
      s.active = false;
      setStates(updatedStates);
    } else if (filter.type === 'city') {
      const updatedCities = cities,
        c = updatedCities.find(c => c.id === filter.id);
      c.active = false;
      setCities(updatedCities);
    } else if (filter.type === 'location') {
      const updatedLocations = locations,
        location = updatedLocations.find(location => location.id === filter.id);
      location.active = false;
      setLocations(updatedLocations);
    } else {
      filter.active = false;
    }
  }
  function toggleDisplayAllFaces() {
    const update = !displayAllFaces;
    if (update && searched && !searching) {
      searchResults.pagedResults.map(img => {
        faceStore.prefetch(img.id);
        return null;
      });
    }
    setDisplayAllFaces(update);
  }
  function renderSearchResults() {
    return (
      <PagedResults {...props} pagedResults={searchResults} handlePageChange={pageNumber => handlePageChange(pageNumber)} numColumnsClass={numColumnsClass}>
        {
          searchResults.pagedResults.map(img =>
            <Image {...props} key={img.id} id={img.id} locationId={img.locationId} img={img} displayAllFaces={displayAllFaces} toggleDisplayAllFaces={toggleDisplayAllFaces} tags={tags} locations={locations} />
          )
        }
      </PagedResults>
    );
  }
  
  var results = null;
  if (!searching) {
    if (searchResults.numResults > 0) {
      results = renderSearchResults();
    } else if (searched) {
      results = <div><p>No Results</p></div>
    }
  }
  
  return (
    <div className="search">
      <PagedResultsForm {...props} submitText={searching ? 'Searching...' : 'Search'} submit={params => handleSearch(params)} handleFilterChange={(type, value) => handleFilterChange(type, value)} handleRemoveFilter={filter => handleRemoveFilter(filter)} numColumnsClass={numColumnsClass} filters={filters} pageSize={pageSize} displayCalendar={true} includeNoTag="true">
        <Dropdown isOpen={statesDropdownOpen} toggle={e => setStatesDropdownOpen(!statesDropdownOpen)}>
          <DropdownToggle variant="success">States</DropdownToggle>
          <DropdownMenu>
            {
              states.map(state =>
                <DropdownItem key={state.id} onClick={e => handleFilterChange('state', state)}>
                  {state.name} {state.active ? <FontAwesomeIcon icon={faCheck} /> : null}
                </DropdownItem>
              )
            }
          </DropdownMenu>
        </Dropdown>
        <Dropdown isOpen={citiesDropdownOpen} toggle={e => setCitiesDropdownOpen(!citiesDropdownOpen)}>
          <DropdownToggle variant="success">Cities</DropdownToggle>
          <DropdownMenu>
            {
              cities.map(city =>
                <DropdownItem key={city.id} onClick={e => handleFilterChange('city', city)}>
                  {city.name} {city.active ? <FontAwesomeIcon icon={faCheck} /> : null}
                </DropdownItem>
              )
            }
          </DropdownMenu>
        </Dropdown>
        <Dropdown isOpen={locationsDropdownOpen} toggle={e => setLocationsDropdownOpen(!locationsDropdownOpen)}>
          <DropdownToggle variant="success">Locations</DropdownToggle>
          <DropdownMenu>
            {
              locations.map(location =>
                <DropdownItem key={location.id} onClick={e => handleFilterChange('location', location)}>
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