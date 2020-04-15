import React, { Component } from 'react';
import { photoBookStore } from '../stores';
import { Button} from 'reactstrap';
import { Link } from 'react-router-dom';
import { stopEvent } from '../../utils';


export class PhotoBookList extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.state = {
      photoBooks: []
    };
  }
  componentDidMount() {
    this.subscriptions.push(photoBookStore.subscribe(state => this.handlePhotoBookStoreChange(state)));
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  
  handlePhotoBookStoreChange(photoBooks) {
    this.setState({
      photoBooks
    });
  }
  delete(e, photoBook) {
    stopEvent(e);
    photoBookStore.removeEntry(photoBook.id);
  }
  render() {
    return (
      <div className="photoBooks">
        <Button color="primary" tag={Link} to="/PhotoBook/Create">Create</Button>
        <div className="row">
          {this.state.photoBooks.map(photoBook=>
            <div key={photoBook.id} className="col-sm-12 photoBook">
              <h1>{photoBook.title}</h1>
              <p>{photoBook.timeFrame}</p>
              <p>{photoBook.numPhotos} photos</p>
              <Button color="primary" tag={Link} to={`/PhotoBook/${photoBook.id}/Photos`}>View Photos</Button>
              <Button color="primary" tag={Link} to={`/PhotoBook/${photoBook.id}/Update`}>Update</Button>
              <Button color="secondary" onClick={e => this.delete(e, photoBook)}>Delete</Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}