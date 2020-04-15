import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faIdBadge, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import LazyLoad from 'react-lazyload';
import { FaceContextMenu } from './context-menus';
import { faceService } from './services';
import { tagStore } from './stores';
import { Spinner } from './Spinner';

export class FaceImage extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.state = {  };
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
    this.setState({ tags: state.tags.filter(tag=> tag.type === "Person") });
  }
  validateFaceTag(face) {
    if (this.faceOp) {
      return;
    }
    this.faceOp = true;
    this.setState({ displayFaceTags: false });
    faceService.validate(face, this.undoValidateFace)
      .then(updatedFace => {
        this.faceOp = false;
        this.props.onFaceUpdate(updatedFace);
      });

  }
  undoValidateFace = (updating, id, face) => {
    this.faceOp = updating;
    if (!updating) {
      this.props.onFaceUpdate(face);
    }
  }
  onFaceRemoved(face) {
    if (this.faceOp) {
      return;
    }
    this.faceOp = true;
    const orig = Object.assign({}, face),
      faceId = face.id;
    faceService.remove(face, this.props.id, this.undoFace, orig)
      .then(updated => {
        this.faceOp = false;
        if (updated && updated.isHidden) {
          this.removedIdx = this.props.onFaceRemoved(faceId);
        }
      });
  }
  undoFace = (addItem, updating, id, face) => {
    this.faceOp = updating;
    if (!updating) {
      if (addItem) {
        this.props.onFaceAdded(this.removedIdx, face);
      } else {
        this.removedIdx = this.props.onFaceRemoved(id);
      }
    }
  }
  tagFace = (tag) => {
    if (this.tagChanging) {
      return;
    }
    this.setState({ displayFaceTags: false });
    this.tagChanging = true;
    const face = Object.assign({}, this.props.face);
    face.tagId = tag.id;
    faceService.setTag(face, (updating, result) => {
      /* Update */
      if (!updating) {
        if (this.props.onFaceUpdate) {
          this.props.onFaceUpdate(result);
        }
      }
      this.tagChanging = updating;
    }, this.state.face).then(results => {
      this.tagChanging = false;
      if (results) {
        if (this.props.onFaceUpdate) {
          this.props.onFaceUpdate(results);
        }
      }
    });
  }
  showDetails = () => {
    if (this.props.onShowDetails) {
      this.props.onShowDetails();
    }
  }
  render() {
    /*if (this.state.loading) {
      return (<p><em>Loading...</em></p>);
    }*/
    const faceTag = this.state.tags && this.state.tags.find(t => t.id === this.props.face.tagId),
      source = this.props.face.id > 0 ? `/Images/face/${this.props.face.id}${(typeof this.props.face.sourceVersion === "number" ? "?v=" + this.props.face.sourceVersion : "")}` :
        `/Images/get/${this.props.face.imageId}/face?x=${this.props.face.x}&y=${this.props.face.y}&w=${this.props.face.width}&h=${this.props.face.height}`;
    return (
      <div className="col-xs-6 col-sm-3 face-image">
        <FaceContextMenu {...this.props}>
          <LazyLoad height={this.props.face.height} once placeholder={<Spinner height={this.props.face.height} />}>
            <img src={source} alt={this.props.face.name} />
          </LazyLoad>
        </FaceContextMenu>

        <p>
          {faceTag && faceTag.name}
          {this.props.face.isValid ? null : <FontAwesomeIcon icon={faCheck} onClick={e => this.validateFaceTag(this.props.face)} />}
          {this.props.displayFaceTags && !this.props.face.isValid ? <FontAwesomeIcon icon={this.state.displayFaceTags ? faIdBadge : far.faIdBadge} onClick={e => this.setState({ displayFaceTags: !this.state.displayFaceTags})} /> : null}
          <FontAwesomeIcon icon={faTimes} onClick={e => this.onFaceRemoved(this.props.face)} />
          <FontAwesomeIcon icon={faInfoCircle} onClick={e => this.showDetails()} />
        </p>
        {
          !this.state.displayFaceTags ? null :
            <div className="face-tag-links">
              <p>Click name below to tag face</p>
              {this.state.tags.filter(t => t.id !== this.props.face.tagId).sort((a, b) => a.lastName.localeCompare(b.lastName) === 0 ? a.name.localeCompare(b.name) : a.lastName.localeCompare(b.lastName)).map(tag =>
                <button key={tag.id} className="link-button" onClick={e => this.tagFace(tag)}>{tag.name}</button>
              )}
            </div>
        } 
        {this.props.showDetails ?
          <div>
            <p>Id: {this.props.face.id}</p>
            <p>Image: {this.props.face.imageId}</p>
            <p>Distance: {this.props.face.distance}</p>
            <p>X: {this.props.face.x}</p>
            <p>Y: {this.props.face.y}</p>
            <p>Width: {this.props.face.width}</p>
            <p>Height: {this.props.face.height}</p>
          </div> : null}
      </div>
      );
  }
}
