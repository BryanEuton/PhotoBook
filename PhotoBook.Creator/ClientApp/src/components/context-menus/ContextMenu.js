import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import { ignore, stopEvent } from '../../utils';

export const ContextMenu = props => {
  const [openContextMenu, setOpenContextMenu] = useState(props.isOpen),
    [coords, setCoords] = useState({ top: 0, left: 0 }),
    [buttonPressTimer, setButtonPressTimer] = useState(null),
    [mouseLeaveTimeout, setMouseLeaveTimeout] = useState(null);

  if (typeof props.isOpen === 'boolean' && props.isOpen !== openContextMenu) {
    setOpenContextMenu(props.isOpen);
  }
  useEffect(() => {
    function handleDocumentClick() {
      clearButtonTimer();
      if (openContextMenu) {
        if (typeof props.isOpen === 'boolean' && typeof props.closeMenu === "function") {
          props.closeMenu();
        } else {
          setOpenContextMenu(false);
        }
      }
    }
    console.log(props.id + " listening for click - " + openContextMenu);
    document.addEventListener('click', handleDocumentClick);
    
    return /* clean up */() => {
      console.log(props.id + " removing listening for click - " + openContextMenu);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [props.id, openContextMenu]);

  function clearButtonTimer() {
    if (buttonPressTimer) {
      clearTimeout(buttonPressTimer);
      setButtonPressTimer(null);
    }
  }
  function imageOnMouseClick(e) {
    const updatedCoords = getCoords(e);
    if (updatedCoords) {
      clearButtonTimer();
      setButtonPressTimer(setTimeout(() => imageOnContextMenu(null, coords), 1500));
    }
  }
  function getMousePos(e) {
    return {
      x: e instanceof TouchEvent || e.nativeEvent instanceof TouchEvent ? e.touches[0].pageX : e.pageX,
      y: e instanceof TouchEvent || e.nativeEvent instanceof TouchEvent ? e.touches[0].pageY : e.pageY
    };
  }
  function getCoords(e) {
    let $e = $(e.target).closest('.context-listener');
    if ($e.length === 0) {
      return null;
    }
    let offset = $e.offset(),
      mousePos = getMousePos(e),
      padding = parseInt($e.offsetParent().css("padding-left")),
      top = mousePos.y - offset.top,
      left = mousePos.x - offset.left + padding;

    if ($("body").width() < 800) {
      left = padding;
    }
    return {
      top: top,
      left: left
    };
  }
  function imageOnMouseClickEnd() {
    clearButtonTimer();
  }
  function imageOnContextMenu(e, coords) {
    stopEvent(e);
    clearButtonTimer();
    coords = coords || getCoords(e);
    if (coords === null) {
      return;
    }
    if (props.onOpen) {
      props.onOpen();
    }
    if (props.updateCoords) {
      props.updateCoords(coords.top + "px", coords.left + "px");
    }
    setOpenContextMenu(true);
    setCoords(coords);
  }


  function onMouseEnter(e) {
    if (mouseLeaveTimeout) {
      clearTimeout(mouseLeaveTimeout);
      setMouseLeaveTimeout(null);
    }
  }
  function onMouseLeave(e) {
    if (openContextMenu) {
      if (mouseLeaveTimeout) {
        clearTimeout(mouseLeaveTimeout);
      }
      var leaveTimeout = setTimeout(() => {
          if (openContextMenu && props.onClose) {
            props.onClose();
          }
        },
        1500);
      setMouseLeaveTimeout(leaveTimeout);
    }
  }

  function onContextMenuClick(e){
    if (openContextMenu) {
      stopEvent(e);
      if (typeof props.isOpen === 'boolean' && typeof props.closeMenu === "function") {
        props.closeMenu();
      } else {
        setOpenContextMenu(false);
      }
    }
  }

  const isMobileView = $("body").width() < 800;
  const mouseDown = isMobileView ? imageOnMouseClick : ignore;
  const mouseUp = isMobileView ? imageOnMouseClickEnd : ignore;
  let wrappedChild = <div key="wrapper"
    onContextMenu={e => imageOnContextMenu(e)}
    onTouchStart={e => mouseDown(e)}
    onTouchEnd={e => mouseUp(e)}
    onMouseDown={e => mouseDown(e)}
    onMouseUp={e => mouseUp(e)}
    onMouseLeave={e => mouseDown(e)}
    className="context-listener"> {props.children}</div>;
  if (openContextMenu) {
    const mouseLeaveEvent = isMobileView ? onMouseLeave : ignore;
    const mouseEnterEvent = isMobileView ? onMouseEnter : ignore;
    return [
      <div key="context-menu"
      className="context-menu"
      onMouseLeave={e => mouseLeaveEvent(e)}
      onMouseEnter={e => mouseEnterEvent(e)}
      onClick={e => onContextMenuClick(e)}
      onContextMenu={e => stopEvent(e)}
      style={{ "top": coords.top, "left": coords.left }}>{props.getMenu()}
    </div>,
      wrappedChild];
  } else {
    return [wrappedChild];
  }
}
