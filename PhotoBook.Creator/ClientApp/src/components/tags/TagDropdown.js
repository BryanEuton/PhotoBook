import React, { useEffect, useState } from 'react';
import { tagStore } from '../stores';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { stopEvent } from '../../utils';


export const TagDropdown = props => {
  const //[activeItems, setActiveItems] = useState(props.activeItems),
    [isOpen, setIsOpen] = useState(typeof props.isActive === "boolean" ? props.isActive : false),
    [openDropdowns, setOpenDropdowns] = useState({}),
    [tagTypes, setTagTypes] = useState([]),
    [tagStoreVersion, setTagStoreVersion] = useState(0);
  
  useEffect(() => {
    let ignore = false;
    function handleTagStoreChange(state, v) {
      if (ignore) {
        console.error("Ignoring store change");
        return;
      }
      console.log("Setting version to " + v);
      setTagStoreVersion(v);
      const tagTypesObj = {},
        filteredTypes = typeof props.allowedTypes === "string" ? state.types.filter(tagType => tagType === props.allowedTypes) : state.types,
        updatedTagTypes = filteredTypes.map(tagType => {
          tagTypesObj[tagType] = {
            id: tagType,
            name: tagType,
            type: 'tagType',
            children: [],
            hasChildren: false,
            canClick: false

          };
          return tagTypesObj[tagType];
        });
      if (props.includeNewPerson && tagTypesObj["Person"]) {
        var newPerson = {
          id: -1,
          name: "New",
          type: "Person",
          canClick: true
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
          canClick: true
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
                  canClick: false,
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
      setTagTypes(updatedTagTypes);
    }

    const subscriptions = [tagStore.subscribe(tagStoreVersion, handleTagStoreChange)];
    if (props.isActive !== isOpen) {
      setIsOpen(props.isActive);
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
  }, [props.isActive, props.allowedTypes, props.includeNewPerson, tagStoreVersion]);
  
  function toggle(e, item) {
    if (e.defaultPrevented) {
      return;
    }
    stopEvent(e);

    let updated = openDropdowns;
    updated[item.id] = !updated[item.id];

    if (openDropdowns[item.id]) {
      updated = {};
      updated[item.id] = true;
      let parent = item.parent;
      while (parent) {
        updated[parent.id] = true;
        parent = parent.parent;
      }
    }
    setOpenDropdowns(updated);
  }
  function onMouseOver(e, item) {
    stopEvent(e);
    
    if (!openDropdowns[item.id]) {
      const updated = {};

      updated[item.id] = true;
      let parent = item.parent;
      while (parent) {
        updated[parent.id] = true;
        parent = parent.parent;
      }
      setOpenDropdowns(updated);
    }
  }

  function handleTagClick(e, tag) {
    stopEvent(e);
    if (!tag.canClick) {
      return;
    }
    setOpenDropdowns({});
    setIsOpen(false);
    props.onClick(tag);
  }
  function handleNoTagClick(e, tag) {
    stopEvent(e);
    setOpenDropdowns({});
    setIsOpen(false);
    props.onClick(tag);
  }
  function handleRootMouseOver(e) {
    stopEvent(e);
    if (isOpen) {
      return;
    }
    if (props.openOnMouseOver) {
      setIsOpen(true);
    }
    if (props.onMouseOver) {
      props.onMouseOver();
    }
  }
  function renderMenuItem(item) {
    if (item.hasChildren) {
      return (
        <Dropdown key={item.id} isOpen={openDropdowns[item.id]} toggle={e => toggle(e, item)} direction="right" onMouseOver={e => onMouseOver(e, item)} >
          <DropdownToggle tag="span" caret>{item.name}</DropdownToggle>

          <DropdownMenu>
            {
              item.children.map(subItem => renderMenuItem(subItem))
            }
          </DropdownMenu>
        </Dropdown>);
    }
    return (
      <DropdownItem key={item.id} onClick={e => handleTagClick(e, item)}>
        <span>
          {item.name}
          {props.activeItems.includes(item.id) ? <FontAwesomeIcon icon={faCheck} /> : null}
        </span>
      </DropdownItem>
    );
  }

  return (
    <Dropdown isOpen={isOpen} toggle={e => setIsOpen(!isOpen)} onMouseOver={handleRootMouseOver} onClick={handleRootMouseOver} direction={props.direction}>
      <DropdownToggle tag={props.rootTag ? props.rootTag : "span"}>{props.text ? props.text : "Tags"}</DropdownToggle>

      <DropdownMenu>
        {props.includeNoTag ? <DropdownItem onClick={(e) => handleNoTagClick(e, { id: -1, type: 'fake', name: '[No Tag]' })}><span>{props.includeNoTagText || "[No Tag]"}{props.activeItems.includes(-1) ? <FontAwesomeIcon icon={faCheck} /> : null}</span></DropdownItem> : null}
        {
          tagTypes.map(tt => renderMenuItem(tt))
        }
      </DropdownMenu>
    </Dropdown>
    );
}
