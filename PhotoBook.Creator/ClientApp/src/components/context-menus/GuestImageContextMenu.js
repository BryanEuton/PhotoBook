import React, { Component } from 'react';
import { ContextMenu } from './ContextMenu';
import { FaceContextMenu } from './FaceContextMenu';
import { faceService, locationService, photoService, photoBookService, tagService } from '../services';
import { photoBookStore, locationStore } from '../stores';
import { EnlargedModal, FaceModal, NewLocationModal } from '../modals';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { imageDetailsChanged, stopEvent } from '../../utils';
import { TagDropdown } from '../tags/TagDropdown';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

export class GuestImageContextMenu extends Component {
  constructor(props) {
    super(props);
    this.onContextMenuClick = this.onContextMenuClick.bind(this);
    this.renderMenu = this.renderMenu.bind(this);
    this.handleContextMenuItemClick = this.handleContextMenuItemClick.bind(this);
    this.subscriptions = [];
    this.state = {
      faceChanged: this.props.img.faceChanged,
      id: this.props.id,
      img: this.props.img,
      contextMenuIdx: 0,
      openContextMenu: false,
      photoBooks: [],
      loadingContextMenu: false,
      top: props.top || 0,
      left: props.left || 0,
      imgDetails: this.props.imgDetails,
      enlarge: false,
      openDropdowns: {}
    };
  }

  static getDerivedStateFromProps(props, state) {
    var changes = {};
    var update = false;
    if (props.displayAllFaces !== state.displayAllFaces) {
      update = true;
      changes.displayAllFaces = props.displayAllFaces;
    }
    if (typeof props.displayFaces !== 'undefined' && props.displayFaces !== state.displayFaces) {
      update = true;
      changes.displayFaces = props.displayFaces;
    }
    if (props.img.v !== state.img.v) {
      update = true;
      changes.img = props.img;
    }
    if (imageDetailsChanged(props.imgDetails, state.imgDetails)) {
      update = true;
      changes.imgDetails = props.imgDetails;
    }
    if (props.img.faceChanged !== state.faceChanged) {
      update = true;
      changes.img = props.img;
      changes.faceChanged = props.img.faceChanged;
    }
    return update ? changes : null;
  }
  download(e) {
    this.handleContextMenuItemClick(e);
    const link = document.createElement('a');
    link.href = `/images/full/${this.props.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  enlarge(e) {
    this.handleContextMenuItemClick(e);
    this.setState({ enlarge: true });
  }
  enlargeClosed(e) {
    this.setState({ enlarge: false });
  }
  handleContextMenuItemClick(e) {
    stopEvent(e);
    this.setState({ openContextMenu: false });
  }
  activateMenuItem = (e, name) => {
    stopEvent(e);
    if (this.state.activeTab !== name) {
      this.setState({ activeTab: name, openDropdowns: {}});
    }
    return true;
  }
  
  onContextMenuClick(e) {
    stopEvent(e);
  }
  getMenuItems = () => {
    this.setState({ openContextMenu: true, openDropdowns: {}, activeTab: ''});
  }
  renderMenu()
  {
    return (
      <div className="dropdown-menu" ref={c => { this.menu = c;}}>
        <a href={`/images/full/${this.props.id}`} target="_blank" download><DropdownItem onMouseOver={e => this.activateMenuItem(e, "download")} onClick={e => this.download(e)} toggle={false}><span>Download</span></DropdownItem></a>
        <DropdownItem onMouseOver={e => this.activateMenuItem(e, "enlarge")} onClick={e => this.enlarge(e)} toggle={false}><span>Enlarge</span></DropdownItem>
      </div>
    );
  }
  render() {
    const results = [],
      wrappedItems = [];
    if (this.state.enlarge) {
      results.push(<EnlargedModal key='enlarged-modal' id={this.props.id} img={this.state.img} onClose={e => this.enlargeClosed(e)} ></EnlargedModal>);
    }
    wrappedItems.push(<ContextMenu key={"context-menu"} id={this.props.id} isOpen={this.state.openContextMenu} getMenu={this.renderMenu} onOpen={this.getMenuItems} updateCoords={(top, left) => this.setState({ top: top, left: left })} closeMenu={e => this.setState({openContextMenu: false})}>
      {this.props.children}
    </ContextMenu>
    );

    results.push(<div key="face-wrapper" className='wrapper' ref={w => { this.faceWrapper = w; }} >
    {wrappedItems}
    </div>);
    return results;
  }
}
