import React, { useState, } from 'react';
import Calendar from '@lls/react-light-calendar';
import Moment from 'react-moment';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NumericInput from 'react-numeric-input';
import { useSwipeable } from 'react-swipeable';
import { faceService } from '../services';
import { FaceImage } from '../FaceImage';
import { Button, ButtonToolbar } from 'reactstrap';
import { stopEvent, coordsChanged, getCoords, isMobile } from '../../utils'
import { TagDropdown } from '../tags/TagDropdown'
Moment.globalLocale = "utc";


export const FaceSwiper = props => {
  const [faces, setFaces] = useState([]),
    [removedFaces, setRemoved] = useState([]),
    [fetching, setFetching] = useState(false),
    [hasFetched, setHasFetched] = useState(false),
    [saving, setSaving] = useState(false),
    [selectedTag, setTag] = useState(localStorage.getItem('swiper_selected') ? JSON.parse(localStorage.getItem('swiper_selected')) : {}),
    [index, setIndex] = useState(0),
    [numResults, setNumResults] = useState(0),
    [settings, setSettings] = useState(localStorage.getItem('swiper_settings') ? JSON.parse(localStorage.getItem('swiper_settings')) : {}),
    [calendarSettings, setCalendarSettings] = useState(localStorage.getItem('swiper_cal') ? JSON.parse(localStorage.getItem('swiper_cal')) : {}),
    [isCalendarOpen, setCalendarOpen] = useState(false),
    [searchScanned, setSearchScanned] = useState(true),
    [searchExisting, setSearchExisting] = useState(true),
    [showFaceDetails, setShowFaceDetails] = useState(true),
    [limit, setLimit] = useState(100),
    [maxDistance, setMaxDistance] = useState(1000),
    [minWidth, setMinWidth] = useState(10),
    noop = () => { },
    defaultSettings = {
      up: { name: "Set Tag", fn: noop },
      left: { name: "Next", fn:  NextTag},
      down: { name: "Set Tag", fn: noop },
      right: { name: "Prev", fn: PrevTag}
    },
    isValidSwipe = function(e)
    {
      if (saving || (isMobile() && e.event.target.tagName.toLowerCase() !== "img")) {
        return false;
      }
      return true;
    },
    handlers = useSwipeable({
      onSwipedLeft: (e) => {
        if (!isValidSwipe(e)) {
          return;
        }
        console.log("swiped left");
        if (settings.left && settings.left.id > 0) {
          updateFaceTag(settings.left);
        } else {
          NextTag();
        }
      },
      onSwipedRight: (e) => {
        if (!isValidSwipe(e)) {
          return;
        }
        console.log("swiped right");
        if (settings.right === defaultSettings.left) {
          NextTag();
        } else if (settings.right && settings.right.id > 0) {
          updateFaceTag(settings.right);
        } else {
          PrevTag();
        }
      },
      onSwipedUp: (e) => {
        if (!isValidSwipe(e)) {
          return;
        }
        console.log("swiped up");
        if (settings.up === defaultSettings.left) {
          NextTag();
        } else if (settings.up && settings.up.id > 0) {
          updateFaceTag(settings.up);
        }
      },
      onSwipedDown: (e) => {
        if (!isValidSwipe(e)) {
          return;
        }
        console.log("swiped down");
        if (settings.down === defaultSettings.left) {
          NextTag();
        } else if (settings.down && settings.down.id > 0) {
          updateFaceTag(settings.down);
        }
      },
      preventDefaultTouchmoveEvent: true,
      trackMouse: true
    });
  
  function updateFaceTag(tag) {
    if (faces[index], tag && tag.id > 0) {
      const updatedFace = Object.assign({}, faces[index]);
      updatedFace.tagId = tag.id;
      setSaving(true);
      if (updatedFace.id > 0) {
        faceService.setTag(updatedFace, undoFaceTag, faces[index])
          .then(results => {
            postFaceSaved(updatedFace, results);
          });
      } else {
        //new face
        faceService.save(updatedFace, updatedFace.imageId, (addItem, updating, id, face) => {
            undoFaceSave(updatedFace.id, addItem, updating, id, face || updatedFace);
          }, faces[index])
          .then(results => {
            postFaceSaved(updatedFace, results);
          });
      }
      
      //NextTag();
    }
  }
  function postFaceSaved(face, newFace) {
    setSaving(false);
    if (newFace) {
      let idx = 0,
        updatedRemoved = removedFaces;
      const updatedFaces = faces.filter((f, index) => {
        if (f.id === face.id) {
          idx = index;
        }
        return f.id !== face.id;
      });
      if (!removedFaces.find(f => f.id === face.id)) {
        const removed = {
          id: newFace.id,
          idx,
          selectedTagId: selectedTag.id,
          face: Object.assign({}, face, newFace)
        }
        updatedRemoved.push(removed);
        setRemoved(updatedRemoved);
      }
      setFaces(updatedFaces);
      setNumResults(updatedFaces.length);
      if (index >= updatedFaces.length) {
        setIndex(updatedFaces.length === 0 ? 0 : updatedFaces.length - 1);
      }
    }
  }
  function undoFaceSave(oldId, addItem, updating, id, face) {
    setSaving(updating);
    if (!updating) {
      let updatedFaces = faces;
      if (oldId !== id && updatedFaces.find(f => f.id === oldId)) {
        updatedFaces = updatedFaces.filter(f => f.id !== oldId);
      }
      face.id = id;
      if (updatedFaces.find(f => f.id === id)) {
        //set as current image
        undoFaceTag(updating, face);
      } else {
        const removed = removedFaces.find(f => f.id === id);
        if (removed && removed.selectedTagId === selectedTag.id) {
          const idx = removed.idx > numResults ? numResults : removed.idx,
            updatedRemove = removedFaces.filter(f => f.id !== id);
          updatedFaces.splice(idx, 0, face);
          setFaces(updatedFaces);
          setNumResults(updatedFaces.length);
          setRemoved(updatedRemove);
          setIndex(idx);
        }
      }
    }
  }
  function undoFaceTag(updating, face) {
    if (updating) {
      return;
    }
    let updatedIndex = -1;
    const updated = faces.map((f, idx) => {
      if (f.id === face.id) {
        updatedIndex = idx;
        return face;
      }
      return f;
    });
    if (updatedIndex !== -1) {
      setFaces(updated);
      setIndex(updatedIndex);
    }
  }
  function search(e) {
    stopEvent(e);
    if (fetching) {
      return;//ignore request.
    }
    if (calendarSettings.start) {
      setFetching(true);
      var params = {
        tagId: selectedTag.id,
        start: calendarSettings.start,
        end: calendarSettings.end,
        searchExisting,
        searchScanned,
        maxDistance,
        minWidth,
        limit
      }
      faceService.find(params).then(res => {
        if (res) {
          setFaces(res.results.map((face, idx) => {
            face.fakeImage = { id: face.imageId, tags: [face.tagId], width: face.imageWidth, height: face.imageHeight };
            if (face.id === 0) {
              face.id = - (idx + 1);//set the id to a unique number.
              face.isNew = true;
            }
            return face;
          }));
          setRemoved([]);
          setHasFetched(true);
          setFetching(false);
          setIndex(0);
          setNumResults(res.totalResults);
        }
      });
    }
  }

  function handleUpdateFace (face) {
    if (face) {
      const existingFace = faces.find(f => f.id === face.id);
      if (existingFace) {
        const updated = Object.assign({}, existingFace, face);
        if (existingFace.tagId !== face.tagId) {
          if (!updated.fakeImage) {
            updated.fakeImage = [];
          }
          updated.fakeImage.tags = [face.tagId];
        }

        if (coordsChanged(getCoords(updated), getCoords(existingFace))) {
          updated.sourceVersion = (typeof updated.sourceVersion === "number" ? updated.sourceVersion + 1 : 1);
        }
        setFaces(faces.map(f => f.id === face.id ? updated : f));
      } else {
        const removed = removedFaces.find(f => f.id === face.id);
        if (removed && removed.selectedTagId === selectedTag.id) {
          const updated = Object.assign({}, removed.face, face);
          if (removed.face.tagId !== face.tagId) {
            updated.fakeImage.tags = [face.tagId];
          }
          const updatedFaces = faces.splice(removed.idx, 0, updated),
              updatedRemoved = removedFaces.filter(f=> f.id !== face.id);
          setFaces(updatedFaces);
          setRemoved(updatedRemoved);
        }
      }
    }
  }
  function handleRemoveFace(id) {
    let idx = -1, face = { id };
    const updated = faces.filter((f, index) => {
        if (f.id === id) {
          idx = index;
          face = f;
        }
        return f.id !== id;
      });
    if (idx !== -1) {
      setFaces(updated);
      setNumResults(numResults - 1);
      const removedFace = { idx, id, face, selectedTagId: selectedTag.id };
      removedFaces.push(removedFace);
      setRemoved(removedFaces);
    }
  }
  function handleAddFace (removeOp, face) {
    if (removeOp && removeOp.selectedTagId === selectedTag.id) {
      const updated = faces.splice(removeOp.idx, 0, face);
      setFaces(updated);
      setNumResults(numResults + 1);
    }
  }
  function PrevTag() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }
  function NextTag() {
    if (index < numResults - 1) {
      setIndex(index + 1);
    }
  }
  function updateSetting(direction, tag) {
    const updated = Object.assign({}, settings);
    if (tag && tag.id > 0) {
      updated[direction] = tag;
    } else {
      delete updated[direction];
    }
    
    if (updated.left &&
      updated.right !== defaultSettings.left &&
      updated.up !== defaultSettings.left &&
      updated.down !== defaultSettings.left)
    {
      if (!updated.up) {
        updated.up = defaultSettings.up;
      } else if (!updated.down) {
        updated.down = defaultSettings.left;
      } else if (!updated.right) {
        updated.right = defaultSettings.left;
      }
    }
    setSettings(updated);
    localStorage.setItem('swiper_settings', JSON.stringify(updated));
  }
  function updateSelectedTag(tag)
  {
    if (tag.id <= 0) {
      tag = {};
    }
    setTag(tag);
    localStorage.setItem('swiper_selected', JSON.stringify(tag));
  }
  function closeCalendar(e) {
    if (!e.currentTarget.contains(window.document.activeElement)) {
      setCalendarOpen(false);
    } 
  }
  function toggleCalendar(e) {
    setCalendarOpen(!isCalendarOpen);
  }
  function openCalendar(e) {
    setCalendarOpen(true);
  }
  function onCalendarChange(startDate, endDate) {
    const updated = { start: new Date(startDate), end: endDate ? new Date(endDate) : null};
    localStorage.setItem('swiper_cal', JSON.stringify(updated));
    updated.calStart = startDate;
    updated.calEnd = endDate;
    setCalendarSettings(updated);
  }
  if (fetching) {
    return (<p><em>Loading...</em></p>);
  }
  const face = faces[index];

  return (
    <div className="face-swapper">
      <div>
        <h1>Choose name to find non-validated faces</h1>
        <div className="div-calendar" onBlur={closeCalendar}>
          <label>Date Range:&nbsp;</label>
          <Moment style={{ "display": calendarSettings.start ? "" : "none" }} element="span" utc="true" format="MM/DD/YYYY">{calendarSettings.start}</Moment>&nbsp;
            <FontAwesomeIcon icon={faCalendar} onClick={toggleCalendar} /><br />
          <div style={{ "display": calendarSettings.end ? "" : "none" }} >
            <label>To:&nbsp;</label>
            <Moment element="span" utc="true" format="MM/DD/YYYY">{calendarSettings.end}</Moment>&nbsp;
            <FontAwesomeIcon icon={faCalendar} onClick={toggleCalendar} />
          </div>
          {!isCalendarOpen ? null : <Calendar startDate={calendarSettings.calStart} endDate={calendarSettings.calEnd} onChange={onCalendarChange} />}
        </div>
        <div>
          <label>
            <input type="checkbox" checked={searchScanned} onChange={(e)=> setSearchScanned(e.target.checked)} />Search scanned
          </label>
          <label>
            <input type="checkbox" checked={searchExisting} onChange={(e) => setSearchExisting(e.target.checked)} />Search existing
          </label>
          {searchExisting ? null :
            <div>
              <label>
                Max Distance: <NumericInput min={0} value={maxDistance} onChange={(val)=> setMaxDistance(val)} /> 
              </label>
              <label>
                Min Width: <NumericInput min={10} value={minWidth} onChange={(val) => setMinWidth(val)} />
              </label>
            </div>
          }
          <label>
            Limit: <NumericInput min={1} value={limit} onChange={(val) => setLimit(val)} />
          </label>
        </div>
        <ButtonToolbar >
          <TagDropdown allowedTypes="Person" includeNoTag={true} includeNoTagText="clear" rootTag={Button} onClick={tag => updateSelectedTag(tag)} activeItems={[selectedTag.id]} text={selectedTag.fullName}/>
          <button className="btn btn-primary" disabled={fetching} onClick={search}>Search</button>
        </ButtonToolbar>
        {hasFetched && !fetching ? <p><i>{numResults}</i> faces</p> : null}
      </div>
      {
        numResults > 0 ? (
          <div>
            <h3>Swipe to tag</h3>
            <p><i>{index + 1} out of {numResults}</i></p>
            <div className="up">{<TagDropdown allowedTypes="Person" includeNoTag={!!settings.up} includeNoTagText="clear" rootTag={Button} onClick={tag => updateSetting('up', tag)} activeItems={[settings.up && settings.up.id]} text={settings.up ? settings.up.name : defaultSettings.up.name} />}</div>
            <div className="row middle">
              <div className="left col-sm-1">{<TagDropdown allowedTypes="Person" includeNoTag={!!settings.left} includeNoTagText="clear" rootTag={Button} onClick={tag => updateSetting('left', tag)} activeItems={[settings.left && settings.left.id]} text={settings.left ? settings.left.name : defaultSettings.left.name} />}</div>
              <div className="center col-sm-10" {...handlers}>
                {face && !saving ? <FaceImage {...props} id={face.id} face={face} img={face.fakeImage} onFaceUpdate={handleUpdateFace} onFaceRemoved={handleRemoveFace} onFaceAdded={handleAddFace} displayFaceTags="true" showDetails={showFaceDetails} onShowDetails={() => setShowFaceDetails(!showFaceDetails)} /> : <p><em>Loading...</em></p>}
                {saving ? <p><i>Saving</i></p> : null}
              </div>
              <div className="right col-sm-1">{<TagDropdown allowedTypes="Person" includeNoTag={!!settings.right} includeNoTagText="clear" rootTag={Button} onClick={tag => updateSetting('right', tag)} activeItems={[settings.right && settings.right.id]} text={settings.right ? settings.right.name : defaultSettings.right.name} />}</div>
            </div>
            <div className="down">{<TagDropdown allowedTypes="Person" includeNoTag={!!settings.down} includeNoTagText="clear" rootTag={Button} onClick={tag => updateSetting('down', tag)} activeItems={[settings.down && settings.down.id]} text={settings.down ? settings.down.name : defaultSettings.down.name} />}</div>
          </div>
        ) : (hasFetched ? (<p><i>No results</i></p>) : null)
      }
    </div>
  );
}