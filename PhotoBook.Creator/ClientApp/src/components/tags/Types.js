import React, { Component } from 'react';
import { tagStore } from '../stores';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom';


export class TagTypes extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.state = {
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
      tagTypes: state.types.map(tagType => { return { id: tagType, name: tagType, type: 'tagType', numTags: state.tags.filter(tag => tag.type === tagType).length, numPhotos: state.tags.filter(t => t.type === tagType).reduce((sum, tag) => sum + tag.numPhotos, 0)}; })
    });
  }
  
  render() {
    
    return (
      <div className="tag-types">
        <Button color="primary" tag={Link} to="/Tag/Create">Create</Button> 
        <div className="row">
          {this.state.tagTypes.map(tagType =>
            <div key={tagType.id} className="col-sm-12 tag-type">
              <h1><a href={"/Tags/" + tagType.id}>{tagType.name}</a></h1>
              <p>{tagType.numTags} tags</p>
              <p>{tagType.numPhotos} photos</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}