import React, { Component } from 'react';
import { stopEvent, positionChanged } from '../../utils'
import $ from 'jquery';

export class Draggable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      draggable: typeof this.props.draggable !== 'undefined' ? this.props.draggable : true,
      bounds: Object.assign({ x: 0, y: 0, width: 0, height: 0 }, this.props.bounds),
      pos: Object.assign({ x: 0, y: 0 }, this.props.pos),
      propPos: this.props.pos
    };
  }
  static getDerivedStateFromProps(props, state) {
    var draggable = typeof props.draggable !== 'undefined' ? props.draggable : state.draggable;
    var changes = {};
    var update = false;
    if (draggable !== state.draggable) {
      update = true;
      changes.draggable = draggable;
    }
    if (positionChanged(props.pos, state.propPos)) {
      //the props changed
      if (positionChanged(props.pos, state.pos)) {
        //the state doesn't match the props values

        update = true;
        changes.pos = props.pos;
        changes.propPos = props.pos;
      } else {
        //internal change which affected our props

        update = true;
        changes.propPos = props.pos;
      }
    }
    return update ? changes : null;
  }
  componentDidUpdate(props, state){
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('touchmove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
      document.addEventListener('touchend', this.onMouseUp);
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('touchmove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('touchend', this.onMouseUp);
    }

  }
  // calculate relative position to the mouse and set dragging=true
  onMouseDown = e => {
    // only left mouse button
    if (!(e.button === 0 || e.nativeEvent instanceof TouchEvent) || !this.node || !this.state.draggable) {
      return;
    }
    let $node = $(this.node),
      $parent = $node.offsetParent(),
      pos = $node.offset(),
      pPos = $parent.offset(),
      mousePos = this.getMousePos(e);
    this.setState({
      dragging: true,
      rel: {
        x: pPos.left + (mousePos.x - pos.left), // - pos.left,
        y: pPos.top + (mousePos.y - pos.top) // - pos.top
      }
    });
    stopEvent(e);
  }
  onMouseUp = e => {
    if (this.state.dragging) {
      const { x, y } = this.state.pos;
      this.setState({ dragging: false, x, y });
      
      stopEvent(e);
      if (this.props.onDragStop) {
        this.props.onDragStop({ x, y });
      }
    }
  }
  getMousePos(e) {
    return {
      x: e instanceof TouchEvent || e.nativeEvent instanceof TouchEvent ? e.touches[0].pageX : e.pageX,
      y: e instanceof TouchEvent || e.nativeEvent instanceof TouchEvent  ? e.touches[0].pageY : e.pageY
    };
  }
  onMouseMove = e => {
    if (!this.state.dragging) {
      return;
    }
    const { rel } = this.state,
      mousePos = this.getMousePos(e),
      newPos = {
        x: mousePos.x - rel.x,
        y: mousePos.y - rel.y
      };
    const bounds = this.props.bounds;
    if (newPos.x < bounds.x) {
      newPos.x = bounds.x;
    } else if (newPos.x >= bounds.x + bounds.width) {
      newPos.x = bounds.x + bounds.width;
    }
    if (newPos.y < bounds.y) {
      newPos.y = bounds.y;
    } else if (newPos.y >= bounds.y + bounds.height) {
      newPos.y = bounds.y + bounds.height;
    }
    if (newPos.x !== this.state.pos.x || newPos.y !== this.state.pos.y) {
      this.setState({
        pos: newPos
      });
    }

    stopEvent(e);
  }
  render() {
    return (
      <div className={'draggable ' + (this.props.className || "") + (this.state.draggable ? ' drag-enabled' : '')} style={{ left: this.state.pos.x, top: this.state.pos.y }} onMouseDown={this.onMouseDown} onTouchStart={this.onMouseDown} ref={node => { this.node = node; }} title={this.props.title}>
        {this.props.children}
      </div>
    );
  }
}