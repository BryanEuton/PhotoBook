import React, { Component } from 'react';
import { tagStore } from '../stores';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { stopEvent } from '../../utils';

export class TagDropdown extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.state = {
      isOpen: typeof props.isActive === "boolean" ? this.props.isActive : false,
      activeItems: this.props.activeItems,
      tagTypes: [],
      tags: [],
      openDropdowns: {}
    };
  }
  static getDerivedStateFromProps(props, state) {
    var changes = {};
    var update = false;
    if (props.activeItems.length !== state.activeItems.length ||
      props.activeItems.find(a => !state.activeItems.find(b => a === b)) ||
      state.activeItems.find(a => !props.activeItems.find(b => a === b))) {
      update = true;
      changes.activeItems = props.activeItems;
    } else if (typeof props.isActive === "boolean" && props.isActive !== state.isOpen) {
      update = true;
      changes.isOpen = props.isActive;
    }
    return update ? changes : null;
  }
  componentDidMount() {
    this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }
  handleTagStoreChange(state) {

    const tagTypesObj = {},
      allowedTypes = typeof this.props.allowedTypes === "string" ? state.types.filter(tagType =>  tagType === this.props.allowedTypes ) : state.types,
      tagTypes = allowedTypes.map(tagType => {
        tagTypesObj[tagType] = {
          id: tagType,
          name: tagType,
          type: 'tagType',
          children: [],
          hasChildren: false,
          onClick: (e) => stopEvent(e)
          
        };
        return tagTypesObj[tagType];
      });
    if (this.props.includeNewPerson && tagTypesObj["Person"]) {
      var newPerson = {
        id: -1,
        name: "New",
        type: "Person",
        onClick: (e) => this.handleTagClick(e, newPerson)
      };
      tagTypesObj["Person"].children.push(newPerson);
      tagTypesObj["Person"].hasChildren = true;
    }
    
    state.tags.map((t) => {
      if (!tagTypesObj[t.type]) {
        return null;
      }
      let bits = t.type === "Person" ? t.name.split(' ') : t.name.split('|');
      if (t.type === "Person" && bits.length >= 2) {
        bits = [bits[bits.length - 1], bits.slice(0, bits.length - 1).join(' ')];
      }
      const tag = {
        id: t.id,
        name: bits[bits.length - 1],
        fullName: t.name,
        type: t.type,
        onClick: (e) => this.handleTagClick(e, tag)
      };

      if (bits.length > 1 || (bits.length === 2 && t.type === "Person")) {
        let currentParent = tagTypesObj[tag.type];
        bits.map((bit, idx) => {
          if (idx < bits.length - 1) {
            const existingItem = currentParent.children.find(c => c.name === bit); 
            if (existingItem) {
              currentParent = existingItem;
            } else {
              const item = {
                id: idx + "." + t.id,
                name: bit,
                fullName: t.name,
                type: t.type,
                onClick: (e) => stopEvent(e),
                hasChildren: true,
                children: [],
                isOpen: false,
                parent: currentParent
            };
              currentParent.children.push(item);
              currentParent = item;
            }
          }
          return null;
        });
        currentParent.children.push(tag);
      } else {
        tagTypesObj[tag.type].children.push(tag);
      } 
      tagTypesObj[tag.type].hasChildren = true;
      return null;
    });
    this.setState({ tagTypes });
  }
  toggle = (e, item) => {
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
  onMouseOver = (e, item) => {
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
  
  handleTagClick(e, tag) {
    stopEvent(e);
    this.setState({ openDropdowns: {}, isOpen: false });
    this.props.onClick(tag);
  }
  handleRootMouseOver = e => {
    stopEvent(e);
    if (this.state.isOpen) {
      return;
    }
    if (this.props.openOnMouseOver) {
      this.setState({ isOpen: true });
    }
    if (this.props.onMouseOver) {
      this.props.onMouseOver();
    }
  }
  renderMenuItem(item) {
    if (item.hasChildren) {
      return (
        <Dropdown key={item.id} isOpen={this.state.openDropdowns[item.id]} toggle={e => this.toggle(e, item)} direction="right" onMouseOver={e => this.onMouseOver(e, item)} >
          <DropdownToggle tag="span" caret>{item.name}</DropdownToggle>

          <DropdownMenu>
            {
              item.children.map(subItem => this.renderMenuItem(subItem))
            }
          </DropdownMenu>
        </Dropdown>);
    }
    return (
      <DropdownItem key={item.id} onClick={item.onClick}>
        <span>
          {item.name}
          {this.state.activeItems.includes(item.id) ? <FontAwesomeIcon icon={faCheck} /> : null}
        </span>
      </DropdownItem>
    );
  }
  render() {
    return (
      <Dropdown isOpen={this.state.isOpen} toggle={e => this.setState({ isOpen: !this.state.isOpen })} onMouseOver={this.handleRootMouseOver} onClick={this.handleRootMouseOver} direction={this.props.direction}>
        <DropdownToggle tag={this.props.rootTag ? this.props.rootTag : "span"}>{this.props.text ? this.props.text : "Tags"}</DropdownToggle>

        <DropdownMenu>
          {this.props.includeNoTag ? <DropdownItem onClick={(e) => this.handleTagClick(e, { id: -1, type: 'fake', name: '[No Tag]' })}><span>{this.props.includeNoTagText || "[No Tag]"}{this.state.activeItems.includes(-1) ? <FontAwesomeIcon icon={faCheck} /> : null}</span></DropdownItem> : null}
          {
            this.state.tagTypes.map(tt => this.renderMenuItem(tt))
          }
        </DropdownMenu>
      </Dropdown>
      );
  }

}
