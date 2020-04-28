import React, { Component } from 'react';
import { faceService } from '../services';
import { PagedResultsForm} from '../paged-results/PagedResultsForm';
import { PagedResults } from '../paged-results/PagedResults';
import { FaceImage } from '../FaceImage';
import { Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck} from '@fortawesome/free-solid-svg-icons';
import { coordsChanged, getCoords } from '../../utils'


export default class FaceSearch extends Component {
  constructor(props) {
    super(props);
    var search = localStorage.getItem('face_search') ? JSON.parse(localStorage.getItem('face_search')) : {};
    this.state = {
      pageSize: typeof search.pageSize === "number" ? search.pageSize : 50,
      page: 1,
      status: typeof search.status === "number" ? search.status : /* New */ 1,
      searching: false,
      filters: [],
      searchResults: { numResults: 0 },
      numColumnsClass: typeof search.numColumnsClass === "string" ? search.status : "three-col",
      removedFaces: []
    };
  }
  updateStorage(change) {
    var search = Object.assign({}, localStorage.getItem('face_search') ? JSON.parse(localStorage.getItem('face_search')) : {}, change);
    localStorage.setItem('face_search', JSON.stringify(search));
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
      params.status = this.state.status;

      this.searchParams = params;
      let searchParams = Object.assign({}, params);
      delete searchParams.page;
      delete searchParams.pageSize;
      const terms = JSON.stringify(searchParams);
      this.terms = terms;
      searchParams.page = params.page;
      searchParams.pageSize = params.pageSize || this.state.pageSize;

      this.searchParams = searchParams;
      this.setState({ searching: true});
      faceService.search(searchParams).then(data => {
        if (data && this.terms === terms) {
          //same search result
          const pagedResults = data.results.map(face => {
            face.fakeImage = { id: face.imageId, tags: [face.tagId], width: face.imageWidth, height: face.imageHeight};
            return face;
          });
          this.setState({ searchResults: { page: searchParams.page, pageSize: searchParams.pageSize, numResults: data.totalResults, pagedResults }, searched: true, searching: false, removedFaces:[] });
        }
      });
    }
  }
  handleFilterChange(type, value) {
    if (type === 'pagesize') {
      this.setState({ pageSize: value, page: 1 });
      this.updateStorage({ pageSize: value });
      if (this.state.searched && !this.state.searching && this.searchParams) {
        this.searchParams.page = 1;
        this.searchParams.pageSize = value;
        
        this.handleSearch(this.searchParams);
      }
      return;
    } else if (type === 'columnsize') {
      this.updateStorage({ numColumnsClass: value });
      this.setState({ numColumnsClass: value });
      return;
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
  }
  handleUpdateFace = (face) =>{
    if (face) {
      const results = this.state.searchResults,
        existingFace = results.pagedResults.find(f => f.id === face.id);
      if (existingFace) {
        const updated = Object.assign({}, existingFace, face);
        if (existingFace.tagId !== face.tagId) {
          if (!updated.fakeImage) {
            updated.fakeImage = [];
          }
          updated.fakeImage.tags = [face.tagId];
        }

        if (coordsChanged(getCoords(updated), getCoords(existingFace))) {
          updated.sourceVersion = (typeof updated.sourceVersion === "number" ? updated.sourceVersion + 1 : 1);
        }
        results.pagedResults = results.pagedResults.map(f => f.id === face.id ?  updated: f);
        this.setState({ searchResults: results });
      } else {
        const removedFace = this.state.removedFaces.find(f => f.id === face.id);
        if (removedFace && removedFace.terms === this.terms) {
          const updated = Object.assign({}, removedFace.face, face);
          if (removedFace.face.tagId !== face.tagId) {
            updated.fakeImage.tags = [face.tagId];
          }
          results.pagedResults.splice(removedFace.idx, 0, updated);
          this.setState({ searchResults: results });
        }
      }
    }
  }
  handleRemoveFace = id => {
    let idx = -1, face = {id};
    const results = this.state.searchResults,
      faces = results.pagedResults.filter((f, index) => {
        if (f.id === id) {
          idx = index;
          face = f;
        }
        return f.id !== id;
      });
    if (idx !== -1) {
      results.pagedResults = faces;
      results.numResults -= 1;
      const removedFaces = this.state.removedFaces,
        removedFace = { idx, terms: this.terms, id, face };
      removedFaces.push(removedFace);
      this.setState({ searchResults: results, removedFaces });
      return removedFace;
    }
    return null;
  }
  handleAddFace = (removeOp, face) => {
    const results = this.state.searchResults;
    if (removeOp && removeOp.terms === this.terms) {
      results.pagedResults.splice(removeOp.idx, 0, face);
      this.setState({ searchResults: results });
    }
  }

  renderSearchResults() {
    return (
      <PagedResults {...this.props} pagedResults={this.state.searchResults} handlePageChange={pageNumber => this.handlePageChange(pageNumber)} numColumnsClass={this.state.numColumnsClass} >
        {
          this.state.searchResults.pagedResults.map(face =>
            <FaceImage {...this.props} key={face.id} id={face.id} face={face} img={face.fakeImage} onFaceUpdate={this.handleUpdateFace} onFaceRemoved={this.handleRemoveFace} onFaceAdded={this.handleAddFace} displayFaceTags="true" />
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
        <Button color="primary" tag={Link} to='/faceswiper'>Swiper</Button>

        <PagedResultsForm {...this.props} submitText={this.state.searching ? 'Searching...' : 'Search'} submit={params => this.handleSearch(params)} handleFilterChange={(type, value) => this.handleFilterChange(type, value)} handleRemoveFilter={filter => this.handleRemoveFilter(filter)} numColumnsClass={this.state.numColumnsClass} filters={this.state.filters} pageSize={this.state.pageSize} displayCalendar={false} allowedTypes="Person">
          <Dropdown isOpen={this.state.statusDropdown} toggle={e => this.setState({ statusDropdown: !this.state.statusDropdown })}>
            <DropdownToggle variant="success">Status</DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={e => this.setState({ status: 1})}>New
                {this.state.status === 1 ? <FontAwesomeIcon icon={faCheck} /> : null}
              </DropdownItem>
              <DropdownItem onClick={e => this.setState({ status: 2 })}>Visible
                {this.state.status === 2 ? <FontAwesomeIcon icon={faCheck} /> : null}
              </DropdownItem>
              <DropdownItem onClick={e => this.setState({ status: 3 })}>Hidden
                {this.state.status === 3 ? <FontAwesomeIcon icon={faCheck} /> : null}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </PagedResultsForm>
        {results}
      </div>
    );
  }
}