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

export class ImageContextMenu extends Component {
  constructor(props) {
    super(props);
    this.onContextMenuClick = this.onContextMenuClick.bind(this);
    this.renderMenu = this.renderMenu.bind(this);
    this.newLocation = this.newLocation.bind(this);
    this.newLocationClosed = this.newLocationClosed.bind(this);
    this.tagFaceClosed = this.tagFaceClosed.bind(this);
    this.tagFaceUpdate = this.tagFaceUpdate.bind(this);
    this.handleContextMenuItemClick = this.handleContextMenuItemClick.bind(this);
    this.subscriptions = [];
    this.state = {
      faceChanged: this.props.img.faceChanged,
      id: this.props.id,
      img: this.props.img,
      contextMenuIdx: 0,
      openContextMenu: false,
      photoBooks: [],
      locations: [],
      states: [],
      loadingContextMenu: false,
      top: props.top || 0,
      left: props.left || 0,
      displayFaces: false,
      displayAllFaces: this.props.displayAllFaces,
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
  handlePhotoBookStoreChange(photoBooks) {
    this.setState({
      photoBooks: photoBooks.map(pb => Object.assign({ name: pb.title, hasChildren: false, onClick: e => this.handlePhotoBookClick(e, pb)}, pb))
    });
  }

  handleLocationStoreChange(state) {
    if (!(state.states.length && state.cities.length && state.locations.length)) {
      return;
    }
    const states = state.states.map(st => {
      st.hasChildren = true;
      st.children = state.cities.filter(c => c.state === st.id).map(c => {
        c.hasChildren = true;
        c.parent = st;
        c.children = state.locations.filter(l => l.state === st.id && l.city === c.name).map(l => Object.assign({ name: l.dropdownFormatted, parent: c, hasChildren: false, onClick: e => this.handleLocationClick(e, l) }, l));

        return c;
      });
      return st;
    });
    this.setState({
      states,
      locations: state.locations
    });
  }
  handleTagClick(tag) {
    if (this.tagChanging) {
      return;
    }
    this.tagChanging = true;
    tagService.tagImage(tag.id, this.state.id, (addItem, updating) => {
      /* Update */
      if (!updating) {
        var img = this.state.img;
        if (addItem) {
          img.tags.push(tag.id);
        } else {
          img.tags = img.tags.filter(tId => tId !== tag.id);
        }
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
      this.tagChanging = updating;
    }).then(data => {
      this.tagChanging = false;
      if (data && data.success) {
        var img = this.state.img;
        if (data.results) {
          //added
          img.tags.push(tag.id);
        } else {
          img.tags = img.tags.filter(tId => tId !== tag.id);
        }
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
    });
  }
  handlePhotoBookClick(e, photoBook) {
    this.handleContextMenuItemClick(e);
    if (this.photoBookChanging) {
      return;
    }
    photoBookService.toggleImage(photoBook.id, this.state.id, (addItem, updating) => {
      /* Update */
      if (!updating) {
        var img = this.state.img;
        if (addItem) {
          img.photoBooks.push(photoBook.id);
        } else {
          img.photoBooks = img.photoBooks.filter(pId => pId !== photoBook.id);
        }
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
      this.photoBookChanging = updating;
    }).then(data => {
      if (data && data.success) {
        var img = this.state.img;
        if (data.results) {
          //added
          img.photoBooks.push(photoBook.id);
        } else {
          img.photoBooks = img.photoBooks.filter(pId => pId !== photoBook.id);
        }
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
    });
  }
  handleLocationClick(e, location) {
    this.handleContextMenuItemClick(e);
    if (this.locationChanging) {
      return;
    }
    this.locationChanging = 1;
    locationService.toggleImage(location.id, this.state.id, this.state.img.locationId, (newId, updating) => {
      /* Update */
      if (!updating) {
        const img = this.state.img;
        img.locationId = newId;
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
      this.locationChanging = updating;
    }).then(data => {
      this.locationChanging = 0;
      if (data && data.success) {
        const img = this.state.img;
        img.locationId = (data.results ? location.id : null);
        this.setState({ img });
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
    });
  }
  tagFace(e) {
    this.handleContextMenuItemClick(e);
    if (this.state.openNewFace || this.faceOp || this.imgOp) {
      return;
    }
    this.faceOp = 1;
    this.setState({ openNewFace: 1 });
  }
  tagFaceClosed(saveChanges, newFace) {
    this.setState({ openNewFace: 0 });
    this.faceOp = 0;
    if (saveChanges) {
      if (this.props.onFaceUpdate) {
        this.props.onFaceUpdate(newFace);
      }
    }
  }
  tagFaceUpdate(addItem, updating, id, face) {
    if (!updating) {
      if (addItem) {
        if (this.props.onFaceUpdate) {
          this.props.onFaceUpdate(face);
        }
      } else {
        if (this.props.onFaceRemoved) {
          this.props.onFaceRemoved(id);
        }
      }
    }
    this.faceOp = updating;
  }
  removeFaces(e) {
    this.handleContextMenuItemClick(e);
    if (this.faceOp || this.imgOp) {
      return;
    }
    this.faceOp = 1;
    faceService.removeAllFaces(this.state.id).then(data => {
      this.faceOp = 0;
      if (data && data.success) {
        const img = this.state.img;
        img.faces = [];
        this.setState({ img});
        if (this.props.onImgUpdate) {
          this.props.onImgUpdate(img);
        }
      }
    });
  }
  displayFaces(e) {
    this.handleContextMenuItemClick(e);
    if (this.faceOp || this.imgOp) {
      return;
    }
    
    if (this.props.toggleDisplayFaces) {
      this.props.toggleDisplayFaces();
    } else {
      this.setState({ displayFaces: !this.state.displayFaces });//this will get updated via getDerivedStateFromProps when using props.toggleDisplayFaces
    }
  }
  displayAllFaces(e) {
    this.handleContextMenuItemClick(e);
    if (this.faceOp || this.imgOp) {
      return;
    }
    if (this.props.toggleDisplayAllFaces) {
      this.props.toggleDisplayAllFaces();
    }
  }

  hide(e) {
    this.handleContextMenuItemClick(e);
    if (this.imgOp) {
      return;
    }
    this.imgOp = 1;
    let id = this.props.id;
    photoService.remove(id, this.props.img, (updating, addItem, id, img) => {
      if (updating) {
        this.imgOp = 1;
      } else {
        this.imgOp = 0;
      }
    }).then(success => {
      this.imgOp = 0;
    });
  }
  scan(e) {
    this.handleContextMenuItemClick(e);
    if (this.imgOp) {
      return;
    }
    this.imgOp = 1;
    photoService.scan(this.props.id).then(() => {
      this.imgOp = 0;
    });
  }
  enlarge(e) {
    this.handleContextMenuItemClick(e);
    this.setState({ enlarge: true });
  }
  enlargeClosed(e) {
    this.setState({ enlarge: false });
  }
  newLocation(e) {
    this.handleContextMenuItemClick(e);
    if (this.state.openNewLocation || this.locationChanging) {
      return;
    }
    this.locationChanging = 1;
    this.setState({ openNewLocation: 1 });
  }
  newLocationClosed(saveChanges, place) {
    this.setState({ openNewLocation: 0 });
    if (saveChanges) {
      locationService.newLocation(place,
        this.state.id,
        this.state.img.locationId,
        (newId, updating) => {
          /* Update */
          if (!updating) {
            const img = this.state.img;
            img.locationId = newId;
            this.setState({ img });
            if (this.props.onImgUpdate) {
              this.props.onImgUpdate(img);
            }
          }
          this.locationChanging = updating;
        }).then(dataResults => {
          this.locationChanging = 0;
          if (dataResults) {
            const img = this.state.img;
            img.locationId = dataResults.id;
            img.latitude = place.lat;
            img.longitude = place.lng;
            this.setState({ img });
            if (this.props.onImgUpdate) {
              this.props.onImgUpdate(img);
            }
          }
        });
    } else {
      this.locationChanging = 0;
    }
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
    if (!this.state.loadingContextMenu) {
      this.setState({ loadingContextMenu: true });
      
      if (!this.storesBound) {
        this.storesBound = true;
        
        this.subscriptions.push(locationStore.subscribe(state => this.handleLocationStoreChange(state)));
        this.subscriptions.push(photoBookStore.subscribe(state => this.handlePhotoBookStoreChange(state)));
      }
    }
  }
  toggleDropdown = (e, name) => {
    if (this.menu && e.target && this.menu.contains(e.target)) {
      this.activateMenuItem(e, name);
    } else if (this.state.openContextMenu) {
      this.setState({ openContextMenu: false });
    }
  }
  toggleMenuItem = (e, item) => {
    if (e.defaultPrevented) {
      return;
    }
    stopEvent(e);

    let openDropdowns = this.state.openDropdowns;
    openDropdowns[item.id] = !openDropdowns[item.id];

    if (this.state.openDropdowns[item.id]) {
      openDropdowns = {};
      openDropdowns[item.id] = true;
      let parent = item.parent;
      while (parent) {
        openDropdowns[parent.id] = true;
        parent = parent.parent;
      }
      this.setState({ openDropdowns });
    }
    this.setState({ openDropdowns });
  }
  handleMouseOverMenuItem = (e, item) => {
    stopEvent(e);

    if (!this.state.openDropdowns[item.id]) {
      const openDropdowns = {};

      openDropdowns[item.id] = true;
      let parent = item.parent;
      while (parent) {
        openDropdowns[parent.id] = true;
        parent = parent.parent;
      }
      this.setState({ openDropdowns });
    }
  }
  renderMenuItem(item, activeItems) {
    if (item.hasChildren) {
      return (
        <Dropdown key={item.id} isOpen={this.state.openDropdowns[item.id]} toggle={e => this.toggleMenuItem(e, item)} direction="right" onMouseOver={e => this.handleMouseOverMenuItem(e, item)} >
          <DropdownToggle tag="span" caret>{item.name}</DropdownToggle>

          <DropdownMenu>
            {
              item.children.map(subItem => this.renderMenuItem(subItem, activeItems))
            }
          </DropdownMenu>
        </Dropdown>);
    }
    return (
      <DropdownItem key={item.id} onClick={item.onClick}>
        <span>
          {item.name}
          {activeItems.includes(item.id) ? <FontAwesomeIcon icon={faCheck} /> : null}
        </span>
      </DropdownItem>
    );
  }
  renderMenu()
{
    //return (
    //  <Dropdown isOpen={this.state.openContextMenu} toggle={e => this.setState({ openContextMenu: false })}>
    //  <DropdownToggle tag="span">Test</DropdownToggle>
    //    <DropdownMenu> 
    //      <Dropdown isOpen={this.state.activeTab === "photobook"} toggle={e => this.activateMenuItem(e, "photobook")} onMouseOver={e => this.activateMenuItem(e, "photobook")} onClick={e => this.activateMenuItem(e, "photobook")} direction="right">
    //        <DropdownToggle tag="span">Photo Books</DropdownToggle>

    //        <DropdownMenu>
    //          {
    //            this.state.photoBooks.map(pb => this.renderMenuItem(pb, this.state.img.photoBooks))
    //          }
    //        </DropdownMenu>
    //      </Dropdown>
    //      <TagDropdown isActive={this.state.activeTab === "tag"} onMouseOver={e => this.activateMenuItem(e, "tag")} openOnMouseOver={true} onClick={tag => this.handleTagClick(tag)} activeItems={this.state.img.tags} direction="right" />
    //      <Dropdown isOpen={this.state.activeTab === "location"} toggle={e => this.activateMenuItem(e, "location")} onMouseOver={e => this.activateMenuItem(e, "location")} onClick={e => this.activateMenuItem(e, "location")} direction="right">
    //        <DropdownToggle tag="span">Locations</DropdownToggle>
    //        <DropdownMenu>
    //          <DropdownItem onClick={this.newLocation}><span>New Location</span></DropdownItem>
    //          {
    //            this.state.states.map(st => this.renderMenuItem(st, [this.state.img.locationId]))
    //          }
    //        </DropdownMenu>
    //      </Dropdown>
    //      <Dropdown isOpen={this.state.activeTab === "faces"} toggle={e => this.activateMenuItem(e, "faces")} onMouseOver={e => this.activateMenuItem(e, "faces")} onClick={e => this.activateMenuItem(e, "faces")} direction="right">
    //        <DropdownToggle tag="span">Faces</DropdownToggle>
    //        <DropdownMenu>
    //          <DropdownItem onClick={e => this.tagFace(e)}><span>Tag face</span></DropdownItem>
    //          {this.state.img.faces.length === 0 ? null : <DropdownItem onClick={e => this.removeFaces(e)}><span>Remove all faces</span></DropdownItem>}
    //          {this.state.img.faces.length === 0 ? null : <DropdownItem onClick={e => this.displayFaces(e)}><span>Display faces</span></DropdownItem>}
    //          <DropdownItem onClick={e => this.displayAllFaces(e)}><span>Display all faces</span></DropdownItem>
    //        </DropdownMenu>
    //      </Dropdown>
    //      <DropdownItem onMouseOver={e => this.activateMenuItem(e, "hide")} onClick={e => this.hide(e)}><span>Hide</span></DropdownItem>
    //      <DropdownItem onMouseOver={e => this.activateMenuItem(e, "scan")} onClick={e => this.scan(e)}><span>Scan for faces</span></DropdownItem>
    //      <DropdownItem onMouseOver={e => this.activateMenuItem(e, "enlarge")} onClick={e => this.enlarge(e)}><span>Enlarge</span></DropdownItem>
    //    </DropdownMenu>
    //  </Dropdown>
    //  );
    return (
      <div className="dropdown-menu" ref={c => { this.menu = c;}}>
        <Dropdown isOpen={this.state.activeTab === "photobook"} toggle={e => this.toggleDropdown(e, "photobook")} onMouseOver={e => this.activateMenuItem(e, "photobook")} onClick={e => this.activateMenuItem(e, "photobook")} direction="right">
          <DropdownToggle tag="span">Photo Books</DropdownToggle>

          <DropdownMenu>
            {
              this.state.photoBooks.map(pb => this.renderMenuItem(pb, this.state.img.photoBooks))
            }
          </DropdownMenu>
        </Dropdown>
        <TagDropdown isActive={this.state.activeTab === "tag"} onMouseOver={e => this.activateMenuItem(e, "tag")} openOnMouseOver={true} onClick={tag => this.handleTagClick(tag)} activeItems={this.state.img.tags} direction="right" />
        <Dropdown isOpen={this.state.activeTab === "location"} toggle={e => this.toggleDropdown(e, "location")} onMouseOver={e => this.activateMenuItem(e, "location")} onClick={e => this.activateMenuItem(e, "location")} direction="right">
          <DropdownToggle tag="span">Locations</DropdownToggle> 
          <DropdownMenu>
            <DropdownItem onClick={this.newLocation}><span>New Location</span></DropdownItem>
            {
              this.state.states.map(st => this.renderMenuItem(st, [this.state.img.locationId]))
            }
          </DropdownMenu>
        </Dropdown>
        <Dropdown isOpen={this.state.activeTab === "faces"} toggle={e => this.toggleDropdown(e, "faces")} onMouseOver={e => this.activateMenuItem(e, "faces")} onClick={e => this.activateMenuItem(e, "faces")} direction="right">
          <DropdownToggle tag="span">Faces</DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={e => this.tagFace(e)}><span>Tag face</span></DropdownItem>
            {this.state.img.faces.length === 0 ? null : <DropdownItem onClick={e => this.removeFaces(e)}><span>Remove all faces</span></DropdownItem>}
            {this.state.img.faces.length === 0 ? null : <DropdownItem onClick={e => this.displayFaces(e)}><span>Display faces</span></DropdownItem>}
            <DropdownItem onClick={e => this.displayAllFaces(e)}><span>Display all faces</span></DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <DropdownItem onMouseOver={e => this.activateMenuItem(e, "hide")} onClick={e => this.hide(e)} toggle={false}><span>Hide</span></DropdownItem>
        <DropdownItem onMouseOver={e => this.activateMenuItem(e, "scan")} onClick={e => this.scan(e)} toggle={false}><span>Scan for faces</span></DropdownItem>
        <DropdownItem onMouseOver={e => this.activateMenuItem(e, "enlarge")} onClick={e => this.enlarge(e)} toggle={false}><span>Enlarge</span></DropdownItem>
      </div>
    );
  }
  render() {
    const results = [],
      wrappedItems = [],
      displayedFaces = this.state.displayFaces || this.state.displayAllFaces ? this.state.img.faces : [];
    if (displayedFaces.length) {
      wrappedItems.push(displayedFaces.map(faceId =>
        <FaceContextMenu {...this.props} key={`face-${faceId}`} img={this.state.img} id={faceId} imageId={this.props.id} imgDetails={this.state.imgDetails} boundsRect={{ x: 0, y: 0, width: this.state.imgDetails.width, height: this.state.imgDetails.height }} bounds={this.faceWrapper}></FaceContextMenu>
      ));
    }
    if (this.state.openNewLocation) {
      const place = this.state.locations.find(l => l.id === this.state.img.locationId);
      results.push(<NewLocationModal key={'new-location-menu'} place={place} onClose={this.newLocationClosed}></NewLocationModal>);
    } else if (this.state.openNewFace) {
      results.push(<FaceModal key='new-face-menu' img={this.state.img} onClose={this.tagFaceClosed} onUpdate={this.tagFaceUpdate}></FaceModal>);
    } else if (this.state.enlarge) {
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
