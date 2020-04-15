import React, { Component } from 'react';
import { photoBookStore, locationStore, tagStore } from '../stores';
import { photoBookService } from '../services';
import { ButtonToolbar, Button } from 'reactstrap';
import { PagedResultsForm } from '../paged-results/PagedResultsForm';
import { PagedResults } from '../paged-results/PagedResults';
import { stopEvent } from '../../utils';
import { Image } from '../Image';
import { Link } from 'react-router-dom';
import { PhotoBookModal } from '../modals';

export class PhotoBookPhotos extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.id = 0;
    if (this.props.match && this.props.match.params && this.props.match.params.id) {
      //do something
      this.id = Number(this.props.match.params.id);
    }
    this.state = {
      pageSize: 50,
      page: 1,
      searching: false,
      displayAllFaces: false,
      filters: [],
      tags: [],
      pagedResults: [],
      searchResults: { numResults: 0 },
      numColumnsClass: "three-col"
    };

  }
  componentDidMount() {
    this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
    this.subscriptions.push(locationStore.subscribe(state => this.handleLocationStoreChange(state)));
    this.subscriptions.push(photoBookStore.subscribe(state => this.handlePhotoBookStoreChange(state)));
    photoBookStore.find(this.id).then(pb => {
      this.handlePhotoBookStoreChange([pb]);
    });
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  handleLocationStoreChange(state) {
    this.setState({ locations: state.locations});
  }
  handlePhotoBookStoreChange(photoBooks) {
    const photoBook = this.filterPhotoBooks(photoBooks.find(pb => pb.id === this.id), this.state.filters);
    this.setState({ photoBook });
    this.handleSearch(photoBook, 1, this.state.pageSize);
  }
  filterPhotoBooks(photoBook, filters) {
    if (!photoBook || typeof photoBook.photos === 'undefined') {
      return { notFound: true };
    }

    if (filters.length > 0) {
      photoBook.filteredResults = photoBook.photos.filter(p => p.tags.find(id => filters.find(f => f.id === id)));
    } else {
      photoBook.filteredResults = photoBook.photos;
    }

    return photoBook;
  }
  handleTagStoreChange(state) {
    this.setState({
      tags: state.tags,
      tagTypes: state.types.map(tagType => { return { id: tagType, name: tagType, type: 'tagType'}; })
    });
  }
  handlePageChange(pageNumber) {
    if (this.state.searched && this.searchParams && !this.state.searching) {
      this.handleSearch(this.state.photoBook, pageNumber, this.state.pageSize);
    }
  }
  handleSearch(photoBook, page, pageSize) {
    if (photoBook && photoBook.filteredResults) {
      const pagedResults = photoBook.filteredResults
        .slice((page - 1) * pageSize)
        .slice(0, pageSize);
      this.setState({ pagedResults, page, pageSize });
    }
  }
  handleFilterChange(type, value) {
    if (type === 'pagesize') {
      if (this.state.searched && !this.state.searching && this.searchParams) {
        this.handleSearch(this.state.photoBook, 1, value);
      } else {
        this.setState({ pageSize: value });
      }
      return;
    } else if (type === 'columnsize') {
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
    const photoBook = this.filterPhotoBooks(this.state.photoBook, filters);
    this.setState({ filters, photoBook });
    this.handleSearch(photoBook, 1, this.state.pageSize);
  }
  handleRemoveFilter(filter) {
    const filters = this.state.filters.filter(f => !(f.id === filter.id && f.type === filter.type)),
      photoBook = this.filterPhotoBooks(this.state.photoBook, filters);
    this.setState({ filters, photoBook });
    this.handleSearch(photoBook, 1, this.state.pageSize);
  }

  renderSearchResults() {
    return (
      <PagedResults {...this.props} pagedResults={this.state.searchResults} handlePageChange={pageNumber => this.handlePageChange(pageNumber)} numColumnsClass={this.state.numColumnsClass}>
        {
          this.state.pagedResults.map(img =>
            <Image {...this.props} key={img.id} id={img.id} locationId={img.locationId} img={img} displayAllFaces={this.state.displayAllFaces} toggleDisplayAllFaces={() => this.setState({ displayAllFaces: !this.state.displayAllFaces })} tags={this.state.tags} locations={this.state.locations} />
          )
        }
      </PagedResults>
    );
  }
  publish = e => {
    stopEvent(e);
    if (this.publishing) {
      return;
    }
    this.publishing = true;
    photoBookService.publish(this.id).then(() => {
      this.publishing = false;
    });
  }
  showMap = e => {
    stopEvent(e);
    this.setState({ showPhotoBookModal: true });
  }
  render() {
    if (!this.state.photoBook) {
      return (<p><em>...Loading</em></p>);
    } else if (this.state.photoBook.notFound) {
      return (<p><em>PhotoBook not found</em></p>);
    }

    var results = null;
    if (this.state.pagedResults.length > 0) {
      results = this.renderSearchResults();
    } else {
      results = <div><p>No Results</p></div>
    }

    return (
      <div className="photo-books">
        <ButtonToolbar >
          <Button color="primary" tag={Link} to="/PhotoBooks">Back</Button>
          <Button color="secondary" onClick={this.publish} >Publish</Button>
          <Button color="secondary" onClick={this.showMap} >Show Map</Button>
        </ButtonToolbar>
        <h1>{this.state.photoBook.title}</h1>

        <PagedResultsForm {...this.props} handleFilterChange={(type, value) => this.handleFilterChange(type, value)} handleRemoveFilter={filter => this.handleRemoveFilter(filter)} numColumnsClass={this.state.numColumnsClass} filters={this.state.filters} pageSize={this.state.pageSize} >
        </PagedResultsForm>
        {results}
        {this.state.showPhotoBookModal ? <PhotoBookModal photoBook={this.state.photoBook} locations={this.state.locations} onClose={e => this.setState({showPhotoBookModal: false})} /> : null}
      </div>
    );
  }
}