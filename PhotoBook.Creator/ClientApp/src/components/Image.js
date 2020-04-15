import React, { Component } from 'react';
import LazyLoad from 'react-lazyload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faIdBadge, faMapMarker, faMapMarkerAlt, faComment, faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import $ from 'jquery';
import { ImageContextMenu  } from './context-menus';
import { photoService } from './services';
import { CommentModal } from './modals';
import { FaceImage } from './FaceImage';
import { ListComments } from './comments/ListComments';
import { coordsChanged, getCoords } from '../utils';
import { Spinner } from './Spinner';

export class Image extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      id: this.props.id,
      img: this.props.img,
      displayAllFaces: this.props.displayAllFaces,
      details: {
        ready: false,
        width: 1,
        height: 1,
        position: { top: 0, left: 0 },
        diffWidth: 1,
        diffHeight: 1
      },
      createComment: false
    };
  }
  static getDerivedStateFromProps(props, state) {
    if (props.displayAllFaces !== state.displayAllFaces) {
      return { displayAllFaces: props.displayAllFaces };
    }
    return null;
  }
  _img: ?HtmlInputElement;
  setImage = img => {
    this._img = img;
    if (img) {
      if (this._img.naturalHeight === 0 && this._img.naturalWidth === 0) {
        this.bindEvents();
      } else {
        this.getImageDetails();
      }
    }
  }
  getImageDetails = () => {
    if (!this._img || (this._img.naturalHeight === 0 && this._img.naturalWidth === 0)) {
      return null;
    }
    let $img = $(this._img),
      width = $img.width(),
      height = $img.height(),
      position = $img.position();

    if (this.state.details.width !== width ||
      this.state.details.height !== height ||
      this.state.details.position.top !== position.top ||
      this.state.details.position.left !== position.left) {
      this.setState({
        details: {
          ready: true,
          width,
          height,
          position,
          diffWidth: width / this.state.img.width,
          diffHeight: height / this.state.img.height
        }
      });
    }
  }
  componentDidMount() {
    if (this._img) {
      this.getImageDetails();
      this.bindEvents();
    }
    $(window).resize(this.getImageDetails);
  }
  componentWillUnmount() {
    $(window).off("resize", this.getImageDetails);
    if (this._img && this.eventsBound) {
      this.eventsBound = false;
      $(this._img).off("resize load", this.getImageDetails)
        .parent().off('resize', this.getImageDetails);
    }
  }
  bindEvents() {
    if (this._img && !this.eventsBound) {
      this.eventsBound = true;
      $(this._img).on('resize load', this.getImageDetails)
        .each(function () {
          if (this.complete) {
            $(this).trigger('load');
          }
        })
        .parent().on('resize', this.getImageDetails);
    }
  }
  toggleDisplayAllFaces = () => {
    if (this.props.toggleDisplayAllFaces) {
      this.props.toggleDisplayAllFaces();
    }
  }
  toggleDisplayFaces = () => {
    this.setState({ displayFaces: !this.state.displayFaces });
  }
  
  
  handleImageUpdated = (img) => {
    this.setState({ img });
  }
  handleFaceRemoved = (id) => {
    const img = this.state.img,
      face = img.faces.find(f => f.id === id);
    if (face) {
      img.faces = img.faces.filter(f => f.id !== id);
      if (face.tagId && !img.faces.find(f => f.tagId === face.tagId)) {
        img.tags = img.tags.filter(tId => tId !== face.tagId);
      }
      img.faceChanged = (img.faceChanged || 0) + 1;//helps child components known there was a change
      this.setState({ img });
    }
  }
  handleFaceUpdate = (face) => {
    if (face) {
      const img = this.state.img,
        oldFace = img.faces.find(f => f.id === face.id);
      if (oldFace) {
        if (typeof face.tagId !== 'undefined' && oldFace.tagId !== face.tagId && !img.faces.find(f => f.id !== face.id && f.tagId === oldFace.tagId)) {
          img.tags = img.tags.filter(tId => tId !== oldFace.tagId);
        }
        const updated = Object.assign({}, oldFace, face);
        img.faces = img.faces.map(f => f.id === face.id ? updated : f);
        if (coordsChanged(getCoords(oldFace), getCoords(updated))) {
          updated.sourceVersion = (typeof updated.sourceVersion === "number" ? updated.sourceVersion + 1 : 1);
        }
      } else {
        img.faces.push(face);
      }
      if (typeof face.tagId !== 'undefined' && !img.tags.find(tId => tId === face.tagId)) {
        img.tags.push(face.tagId);
      }
      img.faceChanged = (img.faceChanged || 0) + 1;//helps child components known there was a change
      this.setState({ img });
    }
  }
  handleCommentModalClosed = (comment) => {
    if (comment) {
      const img = this.state.img;
      img.comments.push(comment.id);
      this.setState({ img });
    }
    this.setState({ createComment: false });
  }
  handleCommentRemoved = (id) => {
    const img = this.state.img;
    img.comments = img.comments.filter(cId => cId !== id);
    this.setState({ img });
  }
  didFaceMove(face, updated) {
    if (face.x !== updated.x || 
      face.y !== updated.y ||
      face.width !== updated.width ||
      face.height !== updated.height ) {
      return true;
    }
    return false;
  }
  renderFaces() {
    return (
      <div className="row">
        {
          this.state.img.faces.map(face =>
            <FaceImage {...this.props} key={face.id} face={face} onImgUpdate={this.handleImageUpdated} onFaceUpdate={this.handleFaceUpdate} onFaceRemoved={this.handleFaceRemoved} />
          )
        }
      </div>
    );
  }
  renderExif() {
    const location = this.props.locations.find(l => l.id === this.state.img.locationId);
    if (location === null) {
      return null;
    }
    return (
      <div>
        <p>{location.streetNumber} {location.streetAddress}</p>
        <p>{location.city}, {location.state} {location.postalCode}</p>
        <p>{location.country}</p>
        <br />
        <p>Place Id:{location.placeId}</p>
        <p>Neighborhood: {location.neighborhood}</p>
        <p>County: {location.county}</p>
      </div>
    );
  }
  renderImageDetails() {
    const tags = this.props.tags.filter(t => this.state.img.tags.find(id => t.id === id));
    return (
      <div>
        <p>{this.state.img.taken}</p>
        <p>{this.state.img.takenTime}</p>
        <div>
          <h3>Tags</h3>
          <div>
            {
              tags.map(tag =>
                <p key={tag.id} >{tag.name} ({tag.type})</p>
              )
            }
          </div>
        </div>
      </div>
    );
  }
  render() {
    return (
      <div className="image-holder">
        <ImageContextMenu id={this.props.id} img={this.state.img} imgDetails={this.state.details} displayAllFaces={this.state.displayAllFaces} displayFaces={this.state.displayFaces} toggleDisplayAllFaces={this.toggleDisplayAllFaces} toggleDisplayFaces={this.toggleDisplayFaces} onImgUpdate={this.handleImageUpdated} onFaceUpdate={this.handleFaceUpdate} onFaceRemoved={this.handleFaceRemoved}>
          <LazyLoad key={this.props.id} height={this.state.img.height} once placeholder={<Spinner />}>
            <img src={`/images/get/${this.props.id}`} ref={this.setImage} alt={this.state.img.fileName} />
          </LazyLoad>
        </ImageContextMenu>
        <p>
          {this.state.img.fileName}
          {
            this.state.detailsOpen ?
            <FontAwesomeIcon title="Click to close Photo Details" icon={ faMinus } onClick={e => this.setState({ detailsOpen: false })} /> : 
            <FontAwesomeIcon title="Click to open Photo Details" icon={ faPlus } onClick={e => this.setState({ detailsOpen: true})} />
          }
          {this.state.img.faces.length === 0 ? null : <FontAwesomeIcon title="Click to display Faces" icon={!(this.state.displayFaces || this.state.displayAllFaces) ? faIdBadge : far.faIdBadge} onClick={e => this.toggleDisplayFaces()} />}
          {!(this.state.img.locationId > 0) ? null : <FontAwesomeIcon title="Click to display exif data" icon={this.state.displayExif ? faMapMarker : faMapMarkerAlt} onClick={e => this.setState({ displayExif: !this.state.displayExif })} />}
          {this.state.img.comments.length === 0 ? null : <FontAwesomeIcon title={this.state.displayComments ? "Click to hide comments" : "Click to display comments"} icon={this.state.displayComments ? faComment : faCommentAlt} onClick={e => this.setState({ displayComments: !this.state.displayComments })} />}
          <FontAwesomeIcon title="Click to create a comment" icon={far.faComment} onClick={e => this.setState({ createComment: true })} />
        </p>
        {!this.state.detailsOpen ? null : this.renderImageDetails()}
        {!(this.state.displayFaces || this.state.displayAllFaces) ? null : this.renderFaces()}
        {!(this.state.displayExif && this.state.img.locationId > 0) ? null : this.renderExif()}
        {!this.state.displayComments ? null : <ListComments {...this.props} thumbnailId={this.props.id} onCommentRemoved={this.handleCommentRemoved} />}
        {!this.state.createComment ? null : <CommentModal {...this.props} comment={{ id: 0, thumbnailId: this.props.id }} onClose={this.handleCommentModalClosed} />}
      </div>
    );
  }
}
