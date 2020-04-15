import React, { Component } from 'react';
import { Draggable } from './Draggable';
import { Resizable } from "re-resizable";
import { coordsChanged, positionChanged, imageDetailsChanged } from '../../utils'

export class ImageMap extends Component {
  constructor(props) {
    super(props);
    let coords = Object.assign({ x: 0, y: 0, height: 1, width: 1 }, this.props.pos);
    this.calculateCoords = this.calculateCoords.bind(this);
    this.state = {
      draggable: typeof this.props.draggable !== 'undefined' ? this.props.draggable : true,
      resizable: typeof this.props.resizable !== 'undefined' ? this.props.resizable : true,
      ready: false,
      imgDetails: this.props.imgDetails,
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
      console.log("map updated wrapper", wrapper);
      this.setState({ wrapper: wrapper });
    }

    let pos = this.getPosition(coords, image);

    if (coordsChanged(pos, this.state.pos)) {
      console.log("map updated pos", pos);
      this.setState({ pos: pos });
      if (this.resizable &&
        (pos.width !== this.state.pos.width ||
          pos.height !== this.state.pos.height)) {
        this.resizable.updateSize(pos);
      }
    }
  }

  onResizeStart = (e, direction, refToElement) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState({ draggable: false, prevDraggable: this.state.draggable });
  }
  onResizeStop = (e, direction, refToElement, delta) => {
    let { pos } = this.state;
    if (direction === "left" || direction === "topLeft") {
      pos.x = pos.x - delta.width;
      if (pos.x - this.state.wrapper.x< 0) {
        pos.width = pos.width + pos.x - this.state.wrapper.x;
        pos.x = this.state.wrapper.x;
      }
    } else {
      pos.width = pos.width + delta.width;
    }
    if (direction === "top" || direction === "topLeft") {
      pos.y = pos.y - delta.height;
      if (pos.y - this.state.wrapper.y < 0) {
        pos.height = pos.height + pos.y - this.state.wrapper.y;
        pos.y = this.state.wrapper.y;
      }
    } else {
      pos.height = pos.height + delta.height;
    }
    
    this.setState({ pos: pos, draggable: this.state.prevDraggable });
    console.log("New Resize pos: ", pos);
    this.update(pos);
  }
  onDragStop = (coords) => {
    let { pos } = this.state;
    if (positionChanged(pos, coords)) {
      pos.x = coords.x;
      pos.y = coords.y;
      this.setState({ pos: pos });
      console.log("New Drag pos: ", pos);
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
        console.log("map updated coords", coords);
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
      maxHeight = this.state.wrapper.height - this.state.pos.y + this.state.wrapper.y,
      maxWidth = this.state.wrapper.width - this.state.pos.x + this.state.wrapper.x;
    
    //let results = React.Children.map(this.props.children, child =>
    //  React.cloneElement(child, { ref: img => (this._img = img) })) || [];
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
            onResizeStart={this.onResizeStart}
            onResizeStop={this.onResizeStop}
            maxHeight={maxHeight}
            maxWidth={maxWidth}
            defaultSize={{
              width: this.state.pos.width,
              height: this.state.pos.height
            }}
          ><div className="div-map">&nbsp;</div></Resizable>
        </div>
      </Draggable>);
    }
    /*
      results.unshift(
          <div key="wrapper" className="img-map-wrapper" style={{ top: this.state.wrapper.y, left: this.state.wrapper.x, width: this.state.wrapper.width, height: this.state.wrapper.height}}>
              {!this.state.ready ? null : <Draggable key="draggable" pos={{ x: this.state.pos.x, y: this.state.pos.y }} onStop={this.onDragStop} bounds={bounds} disabled={this.draggable}>
                  <div className="inner-wrapper" onContextMenu={this.onContextMenu}>
                      <Resizable
                          key="resizable"
                          ref={c => { this.resizable = c; }}
                          onResizeStart={this.onResizeStart}
                          onResizeStop={this.onResizeStop}
                          defaultSize={{
                              width: this.state.pos.width,
                              height: this.state.pos.height
                          }}
                      ><div className="div-map">&nbsp;</div></Resizable>
                  </div>
              </Draggable>  }
          </div>
      );*/
    /*

        <DragResizeContainer key="drag-container"
            className='resize-container'
            resizeProps={{ minWidth: 10, minHeight: 10, enable: { top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true } }}
            layout={this.state.layout}
            onLayoutChange={this.dragUpdate}
            dragProps={{ disabled: false }}
            scale={1}><div key="img-map" className="a-map">&nbsp;</div></DragResizeContainer>
     */
    //<a key="img-map" className="child-container size-auto border a-map" style={{ top: this.state.pos.y, left: this.state.pos.x, height: this.state.pos.height, width: this.state.pos.width }}>&nbsp;</a>
    //results.unshift(<MyStupidHookTest key="img-map" />);
    return results;
  }
}
