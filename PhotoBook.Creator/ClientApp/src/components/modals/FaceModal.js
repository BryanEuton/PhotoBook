import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { tagStore } from '../stores';
import { faceService } from '../services';
import { ImageMap } from '../behaviors';
import { coordsChanged, faceChange, getCoords} from '../../utils'
import $ from 'jquery';
import { stopEvent } from '../../utils';

export class FaceModal extends Component {
  constructor(props) {
    super(props);

    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.enlarge = this.enlarge.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.imageId = this.props.img.id;
    let face = Object.assign({ id: 0, x: 50, y: 50, width: this.props.img.width - 100, height: this.props.img.height - 100 }, this.props.face),
      origFace = Object.assign({}, face);
    const isNewFace = face.id <= 0;
    this.subscriptions = [];

    this.imgWidth = this.props.img.width;
    this.imgHeight = this.props.img.height;
    this.state = {
      enlarged: false,
      coords: getCoords(face),
      origFace,
      faceTags: [],
      isNewFace,
      dropdownOpen: false,
      canSave: false,
      face: face,
      imgDetails: {
        ready: false,
        width: 1,
        height: 1,
        position: { top: 0, left: 0 },
        diffWidth: 1,
        diffHeight: 1
      }
    };
    faceService.removeToast(this.imageId, face.id);
    console.log("initializing coords", this.state.coords);
  }
  static getDerivedStateFromProps(props, state) {
    var changes = {};
    var update = false;
    if (faceChange(props.face, state.orig)) {
      update = true;
      changes.face = props.face;
      changes.coords = getCoords(props.face);
      changes.origFace = Object.assign({}, props.face);
    }
    if (state.isNewFace && props.face && props.face.id > 0) {
      update = true;
      changes.isNewFace = false;
    }
    
    return update ? changes : null;
  }
  componentDidMount() {
    this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
    
    if (this._img) {
      this.getImageDetails();
    }
    window.addEventListener('resize', this.getImageDetails)
    this.subscriptions.push(() => { window.removeEventListener("resize", this.getImageDetails); });
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  handleTagStoreChange(state) {
    if (this.closing) {
      return;
    }
    this.setState({
      faceTags: state.tags
        .filter(tag => tag.type === "Person")
        .map(tag => {
          return {
            id: tag.id,
            text: tag.name,
            selected: tag.name === this.state.face.name
          };
        })
    });
  }
  setImage = img => {
    this._img = img;
    console.log("Setting image", img, img && img.naturalHeight, img && img.naturalWidth, this.state.enlarged);
    if (img) {
      if (!(this._img.naturalHeight === 0 && this._img.naturalWidth === 0)) {        
        this.getImageDetails();
      }
    } else if (this.state.imgDetails.ready) {
      const imgDetails = this.state.imgDetails;
      imgDetails.ready = false;
      this.setState({ imgDetails });
    }
  }
  getImageDetails = () => {
    if (!this._img) {
      return null;
    }
    
    let $img = $(this._img),
      width = $img.width(),
      height = $img.height(),
      position = $img.position();

    console.log("setting img details", width, height, this.state.imgDetails.width !== width || this.state.imgDetails.height !== height );
    if (width > 0 && height > 0) {
      let sizeChanged = false;
      if (this.state.enlarged && this.imgWidth !== this._img.naturalWidth && this.imgHeight !== this._img.naturalHeight) {
        console.log("re-setting image dimensions", this._img.naturalWidth, this._img.naturalHeight);
        sizeChanged = true;
        this.imgWidth = this._img.naturalWidth;
        this.imgHeight = this._img.naturalHeight;
      }

      if (sizeChanged ||
          !this.state.imgDetails.ready ||
          this.state.imgDetails.width !== width ||
          this.state.imgDetails.height !== height ||
          this.state.imgDetails.position.top !== position.top ||
          this.state.imgDetails.position.left !== position.left) {

        this.setState({
          imgDetails: {
            ready: true,
            width,
            height,
            position,
            diffWidth: width / this.imgWidth,
            diffHeight: height / this.imgHeight
          }
        });
      }
    }
  }
  changeFaceName(id) {
    const { face, faceTags } = this.state;
    const faceTag = faceTags.filter(ft => ft.id === id)[0];
    if (faceTag != null) {
      const prev = faceTags.filter(ft => ft.selected)[0];
      if (prev != null) {
        prev.selected = false;
      }
      faceTag.selected = true;
      face.name = faceTag.text;
      face.tagId = id;
      this.setState({ face: face });
    }
    const nameChanged = face.tagId !== this.state.origFace.tagId;
    this.setState({ faceTags, newName: false, nameChanged, canSave: this.canSave(face, nameChanged, this.state.mapMoved) });
  }
  enterNewFaceName = () => {
    const faceTags = this.state.faceTags,
      selectedTag = faceTags.filter(ft => ft.selected)[0],
      face = this.state.face;
    if (selectedTag != null) {
      selectedTag.selected = false;
    }

    face.name = this.state.origFace.name;
    face.tagId = 0;
    this.setState({ face, faceTags, newName: true, nameChanged: false, canSave: false });
  }
  handleChange(event) {
    const face = this.state.face;
    face.name = event.target.value;
    let nameChanged = face.name !== this.state.origFace.name;
    this.setState({ nameChanged, face: face, canSave: this.canSave(face, nameChanged, this.state.mapMoved) });
  }
  onMapUpdated = (coords) => {
    if (coordsChanged(coords, this.state.coords)) {
      let mapMoved = coordsChanged(coords, this.state.origFace);

      this.setState({ coords, mapMoved, canSave: this.canSave(this.state.face, this.state.nameChanged, mapMoved) });
    }
  }
  canSave(face, nameChanged, mapMoved) {
    return this.state.isNewFace ? face.name && mapMoved : nameChanged || mapMoved;
  }
  enlarge(e) {
    stopEvent(e);
    this.setState({ enlarged: true });
  }
  cancel(e) {
    stopEvent(e);
    this.closing = true;
    if (this.props.onClose) {
      this.props.onClose(false);
    }
  }
  save(e) {
    stopEvent(e);
    this.closing = true;

    const face = Object.assign({}, this.state.face, this.state.coords),
      orig = Object.assign({}, this.state.face);

    if (face.tagId) {
      face.Name = null;//We are using a reference to a tag not trying to create a new one.
    }
    faceService.save(face,
      this.imageId,
      (addItem, updating, id, newFace) => {
        if (this.props.onUpdate) {
          this.props.onUpdate(addItem, updating, id, newFace);
        }
      }, orig).then(results => {
        if (results) {
          if (this.state.newName) {
            if (!this.state.faceTags.find(tag => tag.id === results.tagId)) {
              tagStore.refresh();//new name added so trigger a tag store refresh
            }
          }
          this.saved = true;
          if (this.props.onClose) {
            this.props.onClose(true, results);
          }
        }
      });
  }
  render() {
    
    return (
      <Modal isOpen={true} toggle={this.cancel} className={"face-modal " + (this.state.face.id <= 0 ? "newFace" : "updateFace")} size="lg">
        <ModalHeader toggle={this.cancel}>Tag a face</ModalHeader>

        <ModalBody>
          <form onSubmit={stopEvent}>
            {this.state.isNewFace ? null : <p className='center'>Drag/resize the box below to center on the new face.</p>}
            <div className="center">
              <ImageMap isNew={true} pos={this.state.coords} imgDetails={this.state.imgDetails} onUpdate={this.onMapUpdated}>
                <img src={`/images/${(this.state.enlarged ? "full" : "get")}/${this.props.img.id}`} alt={this.props.img.fileName} ref={this.setImage} onLoad={this.getImageDetails} />
              </ImageMap> 
            </div>
            <div className="center">
              <Dropdown isOpen={this.state.dropdownOpen} toggle={e => this.setState({ dropdownOpen: !this.state.dropdownOpen })}>
                <DropdownToggle caret>Name: {this.state.face.name}</DropdownToggle>
                <DropdownMenu>
                  {
                    this.state.faceTags.map(faceTag =>
                      <DropdownItem key={faceTag.id} onClick={e => this.changeFaceName(faceTag.id)}>
                        {faceTag.text}
                        {faceTag.selected ? <FontAwesomeIcon icon={faCheck} /> : null}
                      </DropdownItem>
                    )
                  }
                  <DropdownItem onClick={this.enterNewFaceName}>
                    New Entry
                            </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              {this.state.newName ? <input type="text" placeholder="Enter Name" required value={this.state.face.name || ''} onChange={this.handleChange} /> : null}
            </div>
          </form>
        </ModalBody>

        <ModalFooter>
          {this.state.enlarged ? null: <Button color="secondary" onClick={this.enlarge}>Enlarge</Button>}
          <Button color="primary" onClick={this.save} disabled={!this.state.canSave}>Save</Button>{' '}
          <Button color="secondary" onClick={this.cancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}
