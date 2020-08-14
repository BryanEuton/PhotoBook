import React, { useEffect, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { faceService } from '../services';
import { ImageMap } from '../behaviors';
import { FaceModal } from '../modals';
import { faceStore } from '../stores';
import { coordsChanged, getCoords, stopEvent } from '../../utils'
import { TagDropdown } from '../tags/TagDropdown';
import { DropdownItem } from 'reactstrap';


export const FaceContextMenu = props => {
  const [activeTab, setActiveTab] = useState(""),
    [face, setFace] = useState(props.face || faceStore.default(props.id, props.imageId)),
    [coords, setCoords] = useState(getCoords(face)),
    [draggable, setCanDrag] = useState(false),
    [resizable, setCanResize] = useState(false),
    [moving, setIsMoving] = useState(false),
    [tagChanging, setTagChanging] = useState(false),
    [openFaceModal, setOpenFaceModal] = useState(false),
    [op, setOp] = useState(false),
    [openContextMenu, setOpenContextMenu] = useState(false);

  useEffect(() => {
    let ignore = false;
    function handleFaceChange(updatedFace) {
      if (ignore) {
        return;
      }
      console.log("FaceContextMenu: update to face " + props.id);
      setFace(updatedFace);
      if (!moving) {
        setCoords(getCoords(updatedFace));
      }
    }
    
    const subscriptions = [];
    if (typeof props.face === 'undefined' || props.face === null) {
      subscriptions.push(faceStore.subscribe(face, handleFaceChange));
    }

    return () => {
      ignore = true;
      subscriptions.map(s => {
        if (typeof s === "function") {
          s();
        }
        return null;
      });
    }
  }, [props.id, moving]);

  function move(e){
    handleContextMenuItemClick(e);
    if (typeof props.imgDetails === "undefined") {
      //open modal instead
      if (tagChanging) {
        return;
      }
      setTagChanging(true);
      setOpenFaceModal(true);
      return;
    }
    if (op) {
      return;
    }

    if (!moving) {
      setIsMoving(true);
      setCanDrag(true);
      setCanResize(true);
    }
  }
  function save(e){
    handleContextMenuItemClick(e);
    if (op) {
      return;
    }
    setOp(true);

    setIsMoving(false);
    setCanDrag(false);
    setCanResize(false);
    console.log('FaceContextMenu.Save', face, coords);
    let updated = Object.assign({ id: face.id}, coords);
    faceService.save(updated, props.imageId, (isProcessing, undoOrRedo) => {
      setOp(isProcessing);
    }).then(() => {
      setOp(false);
    });
  }
  function cancel(e) {
    handleContextMenuItemClick(e);
    if (op) {
      return;
    }

    setIsMoving(false);
    setCanDrag(false);
    setCanResize(false);

    setCoords(getCoords(face));
  }
  function remove(e) {
    handleContextMenuItemClick(e);
    if (op) {
      return;
    }
    setOp(true);
    faceService.remove(face.id, props.imageId, (isProcessing, undoOrRedo) => {
      setOp(isProcessing);
    }).then(() => {
      setOp(false);
    });
  }

  function onCoordsUpdate(updated) {
    if (moving && coordsChanged(updated, coords)) {
      setCoords(updated);
      console.log('FaceContextMenu', updated);
    }
  }

  function onModalClosed(saveChanges, face) {
    setTagChanging(false);
    setOpenFaceModal(false);
  }
  
  function handleTagClick(tag) {
    if (tagChanging) {
      return;
    }
    handleContextMenuItemClick();
    setTagChanging(true);
    if (tag.id === -1) {
      setOpenFaceModal(true);
      return;
    }
    const updated = Object.assign({}, face);
    updated.tagId = tag.id;
    faceService.setTag(updated);
  }
  function handleContextMenuItemClick(e) {
    stopEvent(e);
    setOpenContextMenu(false);
  }
  function activateMenuItem(e, name){
    stopEvent(e);
    if (activeTab !== name) {
      setActiveTab(name);
    }
    return true;
  }
  
  function getMenuItems() {
    setOpenContextMenu(true);
    setActiveTab('');
  }
  
  function renderMenu(e) {
    console.log('FaceContextMenu.RenderMenu', face);
    return (
      <div className="dropdown-menu" >
        <TagDropdown isActive={activeTab === "tag"} onMouseOver={e => activateMenuItem(e, "tag")} openOnMouseOver={true} onClick={tag => handleTagClick(tag)} activeItems={props.img.tags} direction="right" allowedTypes="Person" includeNewPerson="true"/>
        {moving ?
          <DropdownItem onMouseOver={e => activateMenuItem(e, "save")} onClick={e => save(e)} toggle={false}><span>Save</span></DropdownItem> :
          <DropdownItem onMouseOver={e => activateMenuItem(e, "move")} onClick={e => move(e)} toggle={false}><span>Move</span></DropdownItem>
        }
        {moving ?
          <DropdownItem onMouseOver={e => activateMenuItem(e, "cancel")} onClick={e => cancel(e)} toggle={false}><span>Cancel Changes</span></DropdownItem> :
          <DropdownItem onMouseOver={e => activateMenuItem(e, "remove")} onClick={e => remove(e)} toggle={false}><span>Remove</span></DropdownItem>
        }
      </div>
    );
  }
console.log('FaceContextMenu.Render', face);
  const results = [];
  if (openFaceModal) {
    results.push(<FaceModal key='face-modal' img={props.img} face={face} onClose={(saveChanges, face) => onModalClosed(saveChanges, face)}></FaceModal>);
  }
  if (props.imgDetails) {
    results.push(<ContextMenu key={"context-menu"} id={props.id} isOpen={openContextMenu} getMenu={e=> renderMenu(e)} onOpen={()=> getMenuItems()} closeMenu={e => setOpenContextMenu(false)}>
      <ImageMap bounds={props.bounds} boundsRect={props.boundsRect} pos={coords} title={face.name} imgDetails={props.imgDetails} draggable={draggable} resizable={resizable} onUpdate={updated=> onCoordsUpdate(updated)}></ImageMap>
    </ContextMenu>);
  } else {
    results.push(<ContextMenu key={"context-menu"} id={props.id} isOpen={openContextMenu} getMenu={e => renderMenu(e)} onOpen={() => getMenuItems()} closeMenu={e => setOpenContextMenu(false)}>
      {props.children}
      </ContextMenu>);
  }
  return results;
}
