import React, { Component } from 'react';
import { ContextMenu } from './ContextMenu';
import { faceService } from '../services';
import { ImageMap } from '../behaviors';
import { FaceModal} from '../modals';
import { coordsChanged, faceChange, getCoords, imageDetailsChanged, stopEvent } from '../../utils'
import { TagDropdown } from '../tags/TagDropdown';
import { DropdownItem } from 'reactstrap';


export class FaceContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      face: this.props.face,
      draggable: false,
      resizable: false,
      canSave: false,
      coords: getCoords(this.props.face),
      imgDetails: this.props.imgDetails,
      openContextMenu: false
    };
  }
  

  static getDerivedStateFromProps(props, state) {
    var changes = {};
    var update = false;
    if (imageDetailsChanged(props.imgDetails, state.imgDetails)) {
      update = true;
      changes.imgDetails = props.imgDetails;
    }
    
    if (faceChange(props.face, state.face)) {
      update = true;
      changes.coords = getCoords(props.face);
      changes.face = props.face;
    }
    return update ? changes : null;
  }
  move = e => {
    this.handleContextMenuItemClick(e);
    if (typeof this.state.imgDetails === "undefined") {
      //open modal instead
      if (this.tagChanging) {
        return;
      }
      this.tagChanging = true;
      this.setState({ openFaceModal: true });
      return;
    }
    if (this.op) {
      return;
    }

    if (!this.state.moving) {
      this.setState({
        moving: true,
        orig: getCoords(this.state.face),
        draggable: true,
        resizable: true });
    }
  }
  save = e => {
    this.handleContextMenuItemClick(e);
    if (this.op) {
      return;
    }
    this.op = true;
    const face = Object.assign({}, this.state.face),
      orig = Object.assign({}, this.state.orig || this.state.face);
    face.x = this.state.coords.x;
    face.y = this.state.coords.y;
    face.width = this.state.coords.width;
    face.height = this.state.coords.height;

    this.setState({ canSave: false, moving: false, draggable: false, resizable: false });
    faceService.save(face, this.props.img.id, this.undoFace, orig)
      .then(results => {
        this.op = false;
        if (results) {
          if (this.props.onFaceUpdate) {
            this.props.onFaceUpdate(results);
          }
        }
      });
  }
  undoFace = (addItem, updating, id, newFace) => {
    this.op = updating;
    if (!updating) {
      //addItem won't be used because this isn't a new face
      if (this.props.onFaceUpdate) {
        this.props.onFaceUpdate(newFace);
      }
    }
  }
  cancel = e => {
    this.handleContextMenuItemClick(e);
    if (this.op) {
      return;
    }
    if (this.state.orig) {
      this.setState({ coords: this.state.orig, moving: false, orig: null, canSave: false, draggable: false, resizable: false });
    }
  }
  remove = e => {
    this.handleContextMenuItemClick(e);
    if (this.op) {
      return;
    }
    this.op = true;
    const face = this.state.face,
      id = face.id,
      orig = Object.assign({}, face);
    faceService.remove(face, this.props.img.id, this.undoFace, orig)
      .then(updatedFace => {
        this.op = false;
        this.removed = true;
        if (updatedFace.isHidden) {
          if (this.props.onFaceRemoved) {
            this.props.onFaceRemoved(id);
          }
        }
      });
  }

  onCoordsUpdate = coords => {
    if (this.state.moving && coordsChanged(coords, this.state.coords)) {
      this.setState({ coords, canSave: true });
    }
  }
  handleNewTagClick(e) {
    this.handleContextMenuItemClick(e);
    if (this.tagChanging) {
      return;
    }
    this.tagChanging = true;
    this.setState({ openFaceModal: true });
  }

  onModalClosed = (saveChanges, face) => {
    this.tagChanging = false;
    this.setState({ openFaceModal: false });
    if (saveChanges) {
      if (this.props.onFaceUpdate) {
        this.props.onFaceUpdate(face);
      }
    }
  }
  onModalUpdate = (addItem, updating, id, face) =>{
    this.tagChanging = updating;
    if (this.props.onFaceUpdate) {
      this.props.onFaceUpdate(face);
    }
  }
  handleTagClick = (tag) => {
    if (this.tagChanging) {
      return;
    }
    this.handleContextMenuItemClick();
    this.tagChanging = true;
    if (tag.id === -1) {
      this.setState({ openFaceModal: true });
      return;
    }
    const face = Object.assign({}, this.state.face);
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
  handleContextMenuItemClick = e => {
    stopEvent(e);
    this.setState({ openContextMenu: false });
  }
  activateMenuItem = (e, name) => {
    stopEvent(e);
    if (this.state.activeTab !== name) {
      this.setState({ activeTab: name, openDropdowns: {} });
    }
    return true;
  }
  
  getMenuItems = () => {
    this.setState({ openContextMenu: true, openDropdowns: {}, activeTab: '' });
  }
  
  renderMenu = e => {
    return (
      <div className="dropdown-menu" >
        <TagDropdown isActive={this.state.activeTab === "tag"} onMouseOver={e => this.activateMenuItem(e, "tag")} openOnMouseOver={true} onClick={tag => this.handleTagClick(tag)} activeItems={this.props.img.tags} direction="right" allowedTypes="Person" includeNewPerson="true"/>
        {this.state.moving ?
          <DropdownItem onMouseOver={e => this.activateMenuItem(e, "save")} onClick={e => this.save(e)} toggle={false}><span>Save</span></DropdownItem> :
          <DropdownItem onMouseOver={e => this.activateMenuItem(e, "move")} onClick={e => this.move(e)} toggle={false}><span>Move</span></DropdownItem>
        }
        {this.state.moving ?
          <DropdownItem onMouseOver={e => this.activateMenuItem(e, "cancel")} onClick={e => this.cancel(e)} toggle={false}><span>Cancel Changes</span></DropdownItem> :
          <DropdownItem onMouseOver={e => this.activateMenuItem(e, "remove")} onClick={e => this.remove(e)} toggle={false}><span>Remove</span></DropdownItem>
        }
      </div>
    );
  }
  render() {
    const results = [];
    if (this.state.openFaceModal) {
      results.push(<FaceModal key='face-modal' img={this.props.img} face={this.state.face}  onClose={this.onModalClosed} onUpdate={this.onModalUpdate}></FaceModal>);
    }
    if (this.state.imgDetails) {
      results.push(<ContextMenu key={"context-menu"} id={this.props.id} isOpen={this.state.openContextMenu} getMenu={this.renderMenu} onOpen={this.getMenuItems} closeMenu={e => this.setState({ openContextMenu: false })}>
        <ImageMap pos={this.state.coords} title={this.state.face.name} imgDetails={this.state.imgDetails} draggable={this.state.draggable} resizable={this.state.resizable} onUpdate={this.onCoordsUpdate}></ImageMap>
      </ContextMenu>);
    } else {
      results.push(<ContextMenu key={"context-menu"} id={this.props.id} isOpen={this.state.openContextMenu} getMenu={this.renderMenu} onOpen={this.getMenuItems} closeMenu={e => this.setState({ openContextMenu: false })}>
        {this.props.children}
        </ContextMenu>);
    }
    return results;
  }
}
