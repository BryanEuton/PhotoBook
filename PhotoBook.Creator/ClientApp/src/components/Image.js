import React, { useEffect, useState } from 'react';
import LazyLoad from 'react-lazyload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faIdBadge, faMapMarker, faMapMarkerAlt, faComment, faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import $ from 'jquery';
import { ImageContextMenu, GuestImageContextMenu  } from './context-menus';
import { faceStore, imageStore } from './stores';
import { CommentModal } from './modals';
import { FaceImage } from './FaceImage';
import { ListComments } from './comments/ListComments';
import { Spinner } from './Spinner';

export const Image = props => {
  const [img, setImage] = useState(imageStore.default(props.id)),
    [createComment, setCreateComment] = useState(false),
    [displayComments, setDisplayComments] = useState(false),
    [displayExif, setDisplayExif] = useState(false),
    [detailsOpen, setDetailsOpen] = useState(false),
    [displayFaces, setDisplayFaces] = useState(false),
    [imgNode, setImgNode] = useState(null),
    [details, setDetails] = useState({
      ready: false,
      width: 1,
      height: 1,
      position: { top: 0, left: 0 },
      diffWidth: 1,
      diffHeight: 1
    });
  useEffect(() => {
    let ignore = false;
    function handleImageChange(image) {
      if (ignore) {
        return;
      }
      console.log("update to image " + props.id);
      setImage(image);
    }

    function getImageDetails() {
      if (!imgNode || (imgNode.naturalHeight === 0 && imgNode.naturalWidth === 0)) {
        return null;
      }
      let $img = $(imgNode),
        width = $img.width(),
        height = $img.height(),
        position = $img.position();

      if (details.width !== width ||
        details.height !== height ||
        details.position.top !== position.top ||
        details.position.left !== position.left) {

        setDetails({
          ready: true,
          width,
          height,
          position,
          diffWidth: width / img.width,
          diffHeight: height / img.height
        });
      }
    }
    function bindEvents() {
      if (imgNode) {
        var $img = $(imgNode);
        $img.on('resize load', getImageDetails)
          .each(function () {
            if (this.complete) {
              $(this).trigger('load');
            }
          })
          .parent().on('resize', getImageDetails);
        $(window).on('resize', getImageDetails);
        return () => {
          $img.off('resize load', getImageDetails)
            .parent().off('resize', getImageDetails);
          $(window).off('resize', getImageDetails);
        }
      }
    }

    const subscriptions = [imageStore.subscribe(img, handleImageChange)];
    if (imgNode) {
      if (imgNode.naturalHeight === 0 && imgNode.naturalWidth === 0) {
        subscriptions.push(bindEvents());
      } else {
        getImageDetails();
      }
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
  }, [props.id, imgNode, details.height, details.position.left, details.position.top, details.width, img]);

  function toggleDisplayAllFaces(){
    if (props.toggleDisplayAllFaces) {
      props.toggleDisplayAllFaces();
    }
  }
  
  function renderFaces() {
    return (
      <div className="row">
        {
          img.faces.map(faceId =>
            <FaceImage {...props} key={faceId} id={faceId} imageId={img.id}/>
          )
        }
      </div>
    );
  }
  function renderExif() {
    const location = props.locations.find(l => l.id === img.locationId);
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
  function renderImageDetails() {
    const tags = props.tags.filter(t => img.tags.find(id => t.id === id));
    return (
      <div>
        <p>{img.taken}</p>
        <p>{img.takenTime}</p>
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
  function toggleDisplayFaces() {
    const show = !displayFaces;
    if (show) {
      faceStore.prefetch(props.id);
    }
    setDisplayFaces(show);
  }
  return (
    <div className="image-holder">
      { props.isGuest ? (
        <GuestImageContextMenu id={props.id} img={img} imgDetails={details}>
          <LazyLoad height={img.height} once placeholder={<Spinner />}>
            <img src={`/images/get/${props.id}`} ref={node => { setImgNode(node); }} alt={img.fileName} />
          </LazyLoad>
        </GuestImageContextMenu>)
          : (
          <ImageContextMenu id={props.id} img={img} imgDetails={details} displayAllFaces={props.displayAllFaces} displayFaces={displayFaces} toggleDisplayAllFaces={toggleDisplayAllFaces} toggleDisplayFaces={toggleDisplayFaces}>
            <LazyLoad height={img.height} once placeholder={<Spinner />}>
              <img src={`/images/get/${props.id}`} ref={node => { setImgNode(node); }} alt={img.fileName} />
            </LazyLoad>
          </ImageContextMenu>)
      }
      <p>
        {img.fileName}
        {
          detailsOpen ?
            <FontAwesomeIcon title="Click to close Photo Details" icon={faMinus} onClick={e => setDetailsOpen(false)} /> :
            <FontAwesomeIcon title="Click to open Photo Details" icon={faPlus} onClick={e => setDetailsOpen(true)} />
        }
        { props.isGuest || img.faces.length === 0 ? null : <FontAwesomeIcon title="Click to display Faces" icon={!(displayFaces || props.displayAllFaces) ? faIdBadge : far.faIdBadge} onClick={e => toggleDisplayFaces()} />}
        {!(img.locationId > 0) ? null : <FontAwesomeIcon title="Click to display exif data" icon={displayExif ? faMapMarker : faMapMarkerAlt} onClick={e => setDisplayExif(!displayExif)} />}
        {img.comments.length === 0 ? null : <FontAwesomeIcon title={displayComments ? "Click to hide comments" : "Click to display comments"} icon={ displayComments ? faComment : faCommentAlt} onClick={e => setDisplayComments(!displayComments)} />}
        <FontAwesomeIcon title="Click to create a comment" icon={far.faComment} onClick={e => setCreateComment(true)} />
      </p>
      {!detailsOpen ? null : renderImageDetails()}
      {!(displayFaces || props.displayAllFaces) ? null : renderFaces()}
      {!(displayExif && img.locationId > 0) ? null : renderExif()}
      {!displayComments ? null : <ListComments {...props} thumbnailId={props.id} />}
      {!createComment ? null : <CommentModal {...props} comment={{ id: 0, thumbnailId: props.id }} onClose={e => setCreateComment(false)} />}
    </div>
  );
}
