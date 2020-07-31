import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faIdBadge, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import LazyLoad from 'react-lazyload';
import { FaceContextMenu } from './context-menus';
import { faceService } from './services';
import { tagStore, faceStore } from './stores';
import { Spinner } from './Spinner';

export const FaceImage = props => {
  const [displayFaceTags, setDisplayFaceTags] = useState(false),
    [face, setFace] = useState(faceStore.default(props.id, props.imageId)),
    [faceOp, setFaceOp] = useState(false),
    [name, setName] = useState(face.name || ''),
    [tags, setTags] = useState([]),
    [tagChanging, setTagChanging] = useState(false),
    [tagStoreVersion, setTagStoreVersion] = useState(0),
    [tagId , setTagId] = useState(face.tagId);
  
  useEffect(() => {
    let ignore = false;
    function handleFaceChange(updatedFace) {
      if (ignore) {
        return;
      }
      console.log("update to face " + props.id, updatedFace.v);

      setFace(updatedFace);
      setFaceOp(false);
      setTagChanging(false);
      setTagId(updatedFace.tagId);
      var tag = tags.find(tag => tag.id === updatedFace.tagId);
      if (tag) {
        setName(tag.name);
      } else if (typeof updatedFace.name !== 'undefined' && updatedFace.name) {
        setName(updatedFace.name);
      }
    }
    function handleTagStoreChange(updated, v) {
      if (ignore) {
        return;
      }
      setTagStoreVersion(v);
      var personTags = updated.tags.filter(tag => tag.type === "Person");
      setTags(personTags);
      var tag = personTags.find(tag => tag.id === tagId);
      if (tag) {
        setName(tag.name);
      }
    }
    const subscriptions = [faceStore.subscribe(face, handleFaceChange),
      tagStore.subscribe(tagStoreVersion, handleTagStoreChange)];
    
    return () => {
      ignore = true;
      subscriptions.map(s => {
        if (typeof s === "function") {
          s();
        }
        return null;
      });
    }
  }, [props.id, tagStoreVersion, tagId]);

  function validateFaceTag() {
    if (props.onValidateFaceTag) {
      props.onValidateFaceTag(face);
      return;
    }
    if (faceOp) {
      return;
    }
    setFaceOp(true);
    setDisplayFaceTags(false);
    faceService.validate(face);
  }
  function removeFace() {
    if (faceOp) {
      return;
    }
    setFaceOp(true);
    faceService.remove(props.id, props.imageId);
  }
  function tagFace(tag){
    if (tagChanging) {
      return;
    }
    setDisplayFaceTags(false);
    setTagChanging(true);

    const updated = Object.assign({}, face);
    updated.tagId = tag.id;
    faceService.setTag(updated);
  }
  function showDetails(){
    if (props.onShowDetails) {
      props.onShowDetails();
    }
  }
  
  const source = face.id > 0 ? `/Images/face/${face.id}${"?v=" + face.v}` :
    `/Images/get/${face.imageId}/face?x=${face.x}&y=${face.y}&w=${face.width}&h=${face.height}`;
  return (
    <div className="col-xs-6 col-sm-3 face-image">
      <FaceContextMenu {...props} id={face.id} face={face} image={face.imageId}>
        <LazyLoad height={face.height} once placeholder={<Spinner height={face.height} />}>
          <img src={source} alt={name} />
        </LazyLoad>
      </FaceContextMenu>

      <p>
        {name}
        {face.isValid ? null : <FontAwesomeIcon icon={faCheck} onClick={e => validateFaceTag()} />}
        {props.displayFaceTags && !face.isValid ? <FontAwesomeIcon icon={displayFaceTags ? faIdBadge : far.faIdBadge} onClick={e => setDisplayFaceTags(!displayFaceTags)} /> : null}
        <FontAwesomeIcon icon={faTimes} onClick={e => removeFace()} />
        {props.onShowDetails ? <FontAwesomeIcon icon={faInfoCircle} onClick={e => showDetails()} /> : null}
      </p>
      {
        !displayFaceTags ? null :
          <div className="face-tag-links">
            <p>Click name below to tag face</p>
            {tags.filter(t => t.id !== face.tagId).sort((a, b) => a.lastName.localeCompare(b.lastName) === 0 ? a.name.localeCompare(b.name) : a.lastName.localeCompare(b.lastName)).map(tag =>
              <button key={tag.id} className="link-button" onClick={e => tagFace(tag)}>{tag.name}</button>
            )}
          </div>
      } 
      {props.showDetails ?
        <div>
          <p>Id: {face.id}</p>
          <p>Image: {face.imageId}</p>
          <p>Distance: {face.distance}</p>
          <p>X: {face.x}</p>
          <p>Y: {face.y}</p>
          <p>Width: {face.width}</p>
          <p>Height: {face.height}</p>
        </div> : null}
    </div>
    );
}
