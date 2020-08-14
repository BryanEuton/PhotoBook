import React, { Component } from 'react';
import { tagStore } from '../stores';
import { Button} from 'reactstrap';
import { Link } from 'react-router-dom';
import { stopEvent } from '../../utils';


export class TagList extends Component {
  constructor(props) {
    super(props);
    let tagType = '';
    if (this.props.match && this.props.match.params && this.props.match.params.tagType) {
      tagType = this.props.match.params.tagType;
    }

    this.subscriptions = [];
    this.state = {
      tagType,
      tags: [],
      tagTypes: []
    };

  }
  componentDidMount() {
    this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  
  handleTagStoreChange(state) {
    this.setState({
      tags: state.tags,
      tagTypes: state.types.map(tagType => { return { id: tagType, name: tagType, type: 'tagType'}; })
    });
  }
  delete(e, tag) {
    stopEvent(e);
    tagStore.removeEntry(tag.id);
  }
  render() {
    const tags = this.state.tags.filter(tag => tag.type === this.state.tagType);
    return (
      <div className="tags">
        <Button color="primary" tag={Link} to="/Tag/Create">Create</Button>
        <div className="row">
          {tags.map(tag=>
            <div key={tag.id} className="col-sm-12 tag">
              <h1>{tag.name}</h1>
              <p>{tag.type}</p>
              <p>{tag.numPhotos} photos</p>
              <Button color="primary" tag={Link} to={`/Tag/${tag.id}/Photos`}>View Photos</Button>
              {(tag.name === 'Unknown' && tag.type === 'Person') ? null : <Button color="primary" tag={Link} to={`/Tag/${tag.id}/Update`}>Update</Button>}
              { (tag.name === 'Unknown' && tag.type === 'Person') ? null : <Button color="secondary" onClick={e=> this.delete(e, tag)}>Delete</Button>}
            </div>
          )}
        </div>
      </div>
    );
  }
}