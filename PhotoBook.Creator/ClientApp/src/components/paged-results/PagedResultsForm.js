import React, { useState } from 'react';
import Calendar from '@lls/react-light-calendar';
import { Button, ButtonToolbar, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import '@lls/react-light-calendar/dist/index.css' // Default Style
import Moment from 'react-moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { TagDropdown } from '../tags/TagDropdown'
Moment.globalLocale = "utc";

export const PagedResultsForm = props => {
  const displayCalendar = typeof props.displayCalendar === "undefined" ? true : props.displayCalendar,
    [start, setStart] = useState(displayCalendar && localStorage.getItem('search_start') ? new Date(parseInt(localStorage.getItem('search_start'))) : new Date()),
    [end, setEnd] = useState(displayCalendar && localStorage.getItem('search_end') ? new Date(parseInt(localStorage.getItem('search_end'))) : new Date()),
    [numColumnsDropdownOpen, setNumColumnsDropdownOpen] = useState(false),
    [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false),
    [calendarStart, setCalendarStart] = useState(null),
    [calendarEnd, setCalendarEnd] = useState(null),
    [isCalendarOpen, setCalendarOpen] = useState(false);


  function onCalendarChange(startDate, endDate){
    const updatedStart = new Date(startDate),
      updatedEnd = endDate ? new Date(endDate) : null;
    localStorage.setItem('search_start', startDate);
    if (updatedEnd) {
      localStorage.setItem('search_end', endDate);
    } else if (localStorage.getItem('search_end')) {
      localStorage.removeItem('search_end');
    }
    setStart(updatedStart);
    setEnd(updatedEnd);
    setCalendarStart(startDate);
    setCalendarEnd(endDate);
  }
  function closeCalendar(e) {
    !e.currentTarget.contains(window.document.activeElement) && setCalendarOpen(false);
  }
  function validateForm() {
    return (displayCalendar ? start !== null : true) && (typeof props.validateForm === "function" ? props.validateForm() : true);
  }

  function submit() {
    if (!validateForm()) {
      return false;
    }
    const params = {
      pageSize: props.pageSize,
      page: 1,
      tags: props.filters.filter(t => t.filterType === 'tag').map(t => t.id)
    };
    if (displayCalendar) {
      params.start = start;
      params.end = end;
    }
    props.submit(params);
  }
  
  return (
    <div className="paged-results-form">
      <h1>{props.title}</h1>
      <ButtonToolbar >
        <TagDropdown allowedTypes={props.allowedTypes} includeNoTag={props.includeNoTag} rootTag={Button} onClick={tag => props.handleFilterChange('tag', tag)} activeItems={props.filters.filter(f=> f.filterType === 'tag').map(f=> f.id)} />
        <Dropdown isOpen={numColumnsDropdownOpen} toggle={e => setNumColumnsDropdownOpen(!numColumnsDropdownOpen)}>
          <DropdownToggle variant="success">Number of Columns</DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={e => props.handleFilterChange('columnsize', 'three-col')}>
              3 {props.numColumnsClass === 'three-col' ? <FontAwesomeIcon icon={faCheck} /> : null}
            </DropdownItem>
            <DropdownItem onClick={e => props.handleFilterChange('columnsize', 'four-col')}>
              4 {props.numColumnsClass === 'four-col' ? <FontAwesomeIcon icon={faCheck} /> : null}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Dropdown isOpen={pageSizeDropdownOpen} toggle={e => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}>
          <DropdownToggle variant="success">Page Size</DropdownToggle>
          <DropdownMenu>
            {
              [5, 10, 20, 50, 100, 1000, 10000].map(pageSize =>
                <DropdownItem key={pageSize} onClick={e => props.handleFilterChange('pagesize', pageSize)}>
                  {pageSize}
                  {props.pageSize === pageSize ? <FontAwesomeIcon icon={faCheck} /> : null}
                </DropdownItem>
              )
            }
          </DropdownMenu>
        </Dropdown>
        {props.children}
      </ButtonToolbar>
      {!displayCalendar ? null :
        <div className="div-calendar" onBlur={closeCalendar}>
          <label>Date Range:&nbsp;</label>
          <Moment style={{ "display": start ? "" : "none" }} element="span" utc="true" format="MM/DD/YYYY">{start}</Moment>&nbsp;
          <FontAwesomeIcon icon={faCalendar} onClick={()=> setCalendarOpen(!isCalendarOpen)} /><br />
          <div style={{ "display": end ? "" : "none" }} >
            <label>To:&nbsp;</label>
            <Moment element="span" utc="true" format="MM/DD/YYYY">{end}</Moment>&nbsp;
            <FontAwesomeIcon icon={faCalendar} onClick={() => setCalendarOpen(!isCalendarOpen)} />
          </div>
          {!isCalendarOpen ? null : <Calendar startDate={calendarStart} endDate={calendarEnd} onChange={onCalendarChange} />}
        </div>
      }
      <ButtonToolbar className="current-filters">
        {
          props.filters.map(filterBtn =>
            <Button key={filterBtn.id}>{filterBtn.name} &nbsp;<FontAwesomeIcon key={filterBtn.id + "icon"} icon={faTimesCircle} color="red" onClick={e => props.handleRemoveFilter(filterBtn)} /></Button>)
        }
      </ButtonToolbar>
      {!props.submitText ? null : <button className="btn btn-primary" disabled={props.fetching} onClick={submit}>{props.submitText}</button>}
    </div>
  );

}