import React, { Component } from 'react';
import { Draggable } from './Draggable';
import { Resizable } from "re-resizable";
import { coordsChanged, positionChanged, imageDetailsChanged } from '../../utils'

export class ImageMap extends Component {
  constructor(props) {
    super(props);
    let coords = Object.assign({ x: 0, y: 0, height: 1, width: 1 }, this.props.pos);
    this.calculateCoords = this.calculateCoords.bind(this);
    this.dragElement = null;
    this.state = {
      draggable: typeof this.props.draggable !== 'undefined' ? this.props.draggable : true,
      resizable: typeof this.props.resizable !== 'undefined' ? this.props.resizable : true,
      ready: false,
      imgDetails: this.props.imgDetails,
      resizerDirection: "bottomRight",
      wrapper: { x: 0, y: 0, width: 0, height: 0 },
      coords: coords,
      pos: { x: coords.x, y: coords.y, height: coords.height, width: coords.width },
      propPos: this.props.pos,
      setup: false,
      layout: [{ x: 0, y: 0, width: 200, height: 100, zIndex: 1 }]
    };
  }
  static getDerivedStateFromProps(props, state) {
    var draggable = typeof props.draggable !== 'undefined' ? props.draggable : state.draggable;
    var resizable = typeof props.resizable !== 'undefined' ? props.resizable : state.resizable;
    var changes = {};
    var update = false;
    if (draggable !== state.draggable || resizable !== state.resizable) {
      changes.draggable = draggable;
      changes.resizable = resizable;
      update = true;
    }
    if (coordsChanged(props.pos, state.propPos)) {
      //the props changed
      if (coordsChanged(props.pos, state.coords)) {
        //the state doesn't match the props values

        update = true;
        changes.coords = props.pos;
        changes.propPos = props.pos;
        changes.recalculatePosition = true;
      } else {
        //internal change which affected our props

        update = true;
        changes.propPos = props.pos;
      }
    }
    if (imageDetailsChanged(props.imgDetails, state.imgDetails)) {
      update = true;
      changes.imgDetails = props.imgDetails;
    }
    return update ? changes : null;
  }
  componentDidMount() {
    if (!this.state.ready) {
      if (this.state.imgDetails.ready) {
        this.calculateCoords();
        this.setState({ ready: true });
      }
    }
  }
  componentDidUpdate() {
    if (!this.state.ready) {
      if (this.state.imgDetails.ready) {
        this.calculateCoords();
        this.setState({ ready: true });
      }
    } else if (this.state.recalculatePosition) {
      let pos = this.getPosition(this.state.coords, this.state.imgDetails);
      if (pos.x !== this.state.pos.x ||
        pos.y !== this.state.pos.y ||
        pos.width !== this.state.pos.width ||
        pos.height !== this.state.pos.height
      ) {

        this.setState({ recalculatePosition: false, pos: pos });
        if (this.resizable &&
        (pos.width !== this.state.pos.width ||
          pos.height !== this.state.pos.height)) {
          this.resizable.updateSize(pos);
        }
      }
    }

  }
  getPosition = (coords, imageDetails) => {
    return {
      x: coords.x * imageDetails.diffWidth + imageDetails.position.left,
      y: coords.y * imageDetails.diffHeight + imageDetails.position.top,
      width: coords.width * imageDetails.diffWidth,
      height: coords.height * imageDetails.diffHeight
    };
  }
  calculateCoords() {
    const image = this.state.imgDetails;
    if (!image || !image.ready) {
      return null;
    }
    let coords = this.state.coords;

    
    let wrapper = {
      x: image.position.left,
      y: image.position.top,
      width: image.width,
      height: image.height
    };
    if (coordsChanged(this.state.wrapper, wrapper)) {
      this.setState({ wrapper: wrapper });
    }
    
    let pos = this.getPosition(coords, image);

    if (coordsChanged(pos, this.state.pos)) {
      this.setState({ pos: pos });
      if (this.resizable &&
        (pos.width !== this.state.pos.width ||
          pos.height !== this.state.pos.height)) {
        this.resizable.updateSize(pos);
      }
    }
  }

  onResize = (e, direction, refToElement, delta) => {
    let { pos, origPos, wrapper } = this.state;
    if (typeof origPos === 'undefined' || origPos === null) {
      return;
    }
    if (direction !== this.state.resizerDirection) {
      this.setState({ resizerDirection: direction });
    }
    if (direction === "left" || direction === "topLeft") {
      pos.x = origPos.x - delta.width;
      if (pos.x < wrapper.x) {
        pos.x = wrapper.x;
      }
    } else {
      pos.width = origPos.width + delta.width;
      if (pos.x + pos.width > wrapper.x + wrapper.width) {
        pos.width = wrapper.x + wrapper.width - pos.x;
      }
      if (pos.width < 10) {
        return;
      }
    }
    if (direction === "top" || direction === "topLeft") {
      pos.y = origPos.y - delta.height;
      if (pos.y < wrapper.y) {
        pos.y = wrapper.y;
      }
      //if (delta.height + pos.height < 10) {
      //  return;
      //}
    } else {
      pos.height = origPos.height + delta.height;
      
      if (pos.y + pos.height > wrapper.y + wrapper.height) {
        pos.height = wrapper.y + wrapper.height - pos.y;
      }
      if (pos.height < 10) {
        return;
      }
    }

    if (coordsChanged(pos, origPos)) {
      this.setState({ pos: pos });
    }
  }
  onResizeStart = (e, direction, refToElement) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState({ draggable: false, prevDraggable: this.state.draggable, origPos: { x:  this.state.pos.x, y: this.state.pos.y, height: this.state.pos.height, width: this.state.pos.width } });
  }
  onResizeStop = (e, direction, refToElement, delta) => {
    let { pos } = this.state;
    //if (direction === "left" || direction === "topLeft") {
    //  pos.x = pos.x - delta.width;
    //  if (pos.x - this.state.wrapper.x< 0) {
    //    pos.width = pos.width + pos.x - this.state.wrapper.x;
    //    pos.x = this.state.wrapper.x;
    //  }
    //} else {
    //  pos.width = pos.width + delta.width;
    //}
    //if (direction === "top" || direction === "topLeft") {
    //  pos.y = pos.y - delta.height;
    //  if (pos.y - this.state.wrapper.y < 0) {
    //    pos.height = pos.height + pos.y - this.state.wrapper.y;
    //    pos.y = this.state.wrapper.y;
    //  }
    //} else {
    //  pos.height = pos.height + delta.height;
    //}

    //if (pos.width <= 0) {
    //  pos.width = 10;
    //}
    //if (this.state.wrapper.width - pos.x + this.state.wrapper.x < 0) {
    //  pos.x = this.state.wrapper.width - pos.width;
    //}
    //if (pos.height <= 0) {
    //  pos.height = 10;
    //}
    //if (this.state.wrapper.height - pos.y + this.state.wrapper.y < 0) {
    //  pos.y = this.state.wrapper.height - pos.height;
    //}
    this.setState({ pos: pos, draggable: this.state.prevDraggable, origPos: null });
    this.update(pos);
  }
  onDragStop = (coords) => {
    let { pos } = this.state;
    if (positionChanged(pos, coords)) {
      pos.x = coords.x;
      pos.y = coords.y;
      this.setState({ pos: pos });
      this.update(pos);
    }
  }
  update(pos) {
    if (this.props.onUpdate) {
      const image = this.state.imgDetails;
      if (!image || !image.ready) {
        return null;
      }
      let coords = {
        x: Math.round((pos.x - this.state.wrapper.x) / image.diffWidth),
        y: Math.round((pos.y - this.state.wrapper.y) / image.diffHeight),
        width: Math.round(pos.width / image.diffWidth),
        height: Math.round(pos.height / image.diffHeight)
      };

      if (coordsChanged(coords, this.state.coords)) {
        console.log("map updated coords", coords, this.state.wrapper, image);
        this.setState({ coords });
        this.props.onUpdate(coords);
      }
    }
  }
  render() {
    const bounds = {
      x: this.state.wrapper.x,
      y: this.state.wrapper.y,
      width: this.state.wrapper.width - this.state.pos.width,
      height: this.state.wrapper.height - this.state.pos.height
    },
      maxWidth= this.state.wrapper.width - this.state.pos.x + this.state.wrapper.x,
      maxHeight = this.state.wrapper.height - this.state.pos.y + this.state.wrapper.y,
      widthRemaining = typeof this.state.origPos !== 'undefined' && this.state.origPos && (this.state.resizerDirection === "topLeft" || this.state.resizerDirection === "left") ? this.state.origPos.x + this.state.pos.width : maxWidth,
      heightRemaining = typeof this.state.origPos !== 'undefined' && this.state.origPos && (this.state.resizerDirection === "topLeft" || this.state.resizerDirection === "top") ? this.state.origPos.y + this.state.pos.height : maxHeight;
    let results = React.Children.map(this.props.children, child =>
      React.cloneElement(child)) || [];
    if (this.state.ready) {
      results.unshift(<Draggable key="draggable" className="img-map-wrapper" pos={{ x: this.state.pos.x, y: this.state.pos.y }} onDragStop={this.onDragStop} bounds={bounds} draggable={this.state.draggable} title={this.props.title}>
            <div className="inner-wrapper">
              <Resizable
                key="resizable"
                enable={{ top: this.state.resizable, right: this.state.resizable, bottom: this.state.resizable, left: this.state.resizable, topRight: this.state.resizable, bottomRight: this.state.resizable, bottomLeft: this.state.resizable, topLeft: this.state.resizable }}
                className="resizable"
                ref={c => { this.resizable = c; }}
                bounds={this.props.bounds}
                minWidth={10}
                minHeight={10}
                maxWidth={widthRemaining}
                maxHeight={heightRemaining}      
                onResizeStart={this.onResizeStart}
                onResizeStop={this.onResizeStop}
                onResize={this.onResize}
                defaultSize={{
                  width: this.state.pos.width,
                  height: this.state.pos.height
                }}
              ><div className="div-map">&nbsp;</div></Resizable>
            </div>
          </Draggable>);
    } else
    {
      results.push(<p key='notready'>Not ready</p>);
    }
    return results;
  }
}
