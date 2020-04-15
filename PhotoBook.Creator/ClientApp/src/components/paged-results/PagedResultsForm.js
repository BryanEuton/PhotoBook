import React, { Component } from 'react';
import Calendar from '@lls/react-light-calendar';
import { Button, ButtonToolbar, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import '@lls/react-light-calendar/dist/index.css' // Default Style
import Moment from 'react-moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { TagDropdown } from '../tags/TagDropdown'
Moment.globalLocale = "utc";


export class PagedResultsForm extends Component {
  constructor(props) {
    super(props);

    this.displayCalendar = typeof this.props.displayCalendar === "undefined" ? true : this.props.displayCalendar;
    
    this.state = {
      start: this.displayCalendar && localStorage.getItem('search_start') ? new Date(parseInt(localStorage.getItem('search_start'))) : new Date(),
      end: this.displayCalendar && localStorage.getItem('search_end') ? new Date(parseInt(localStorage.getItem('search_end'))) : null,
      calendarStart: null,
      calendarEnd: null
    };
    
    this.onCalendarChange = (startDate, endDate) => {
      const start = new Date(startDate),
        end = endDate ? new Date(endDate) : null;
      localStorage.setItem('search_start', startDate);
      if (end) {
        localStorage.setItem('search_end', endDate);
      } else if (localStorage.getItem('search_end')) {
        localStorage.removeItem('search_end');
      }
      this.setState({ start, end, calendarStart: startDate, calendarEnd: endDate});
    };
    this.openCalendar = () => this.setState({ isCalendarOpen: true });
    this.toggleCalendar = () => this.setState({ isCalendarOpen: !this.state.isCalendarOpen });
    this.closeCalendar = e => {
      !e.currentTarget.contains(window.document.activeElement) && this.setState({ isCalendarOpen: false });
    };
  }
  validateForm() {
    return (this.displayCalendar ? this.state.start != null : true) && (typeof this.props.validateForm === "function" ? this.props.validateForm() : true);
  }

  submit = () => {
    if (!this.validateForm()) {
      return false;
    }
    const params = {
      pageSize: this.props.pageSize,
      page: 1,
      tags: this.props.filters.filter(t => t.filterType === 'tag').map(t => t.id)
    };
    if (this.displayCalendar) {
      params.start = this.state.start;
      params.end = this.state.end;
    }
    this.props.submit(params);
  }
  updateDynamicDropdownState = name => {
    var change = {};
    change[name] = !this.state[name];
    this.setState(change);
  }
  render() {

    return (
      <div className="paged-results-form">
        <h1>{this.props.title}</h1>
        <ButtonToolbar >
          <TagDropdown allowedTypes={this.props.allowedTypes} includeNoTag= { this.props.includeNoTag } rootTag={Button} onClick={tag => this.props.handleFilterChange('tag', tag)} activeItems={this.props.filters.filter(f=> f.filterType === 'tag').map(f=> f.id)} />
          <Dropdown isOpen={this.state.numColumnsDropdown} toggle={e => this.setState({ numColumnsDropdown: !this.state.numColumnsDropdown })}>
            <DropdownToggle variant="success">Number of Columns</DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={e => this.props.handleFilterChange('columnsize', 'three-col')}>
                3 {this.props.numColumnsClass === 'three-col' ? <FontAwesomeIcon icon={faCheck} /> : null}
              </DropdownItem>
              <DropdownItem onClick={e => this.props.handleFilterChange('columnsize', 'four-col')}>
                4 {this.props.numColumnsClass === 'four-col' ? <FontAwesomeIcon icon={faCheck} /> : null}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown isOpen={this.state.pageSizeDropdown} toggle={e => this.setState({ pageSizeDropdown: !this.state.pageSizeDropdown })}>
            <DropdownToggle variant="success">Page Size</DropdownToggle>
            <DropdownMenu>
              {
                [5, 10, 20, 50, 100, 1000, 10000].map(pageSize =>
                  <DropdownItem key={pageSize} onClick={e => this.props.handleFilterChange('pagesize', pageSize)}>
                    {pageSize}
                    {this.props.pageSize === pageSize ? <FontAwesomeIcon icon={faCheck} /> : null}
                  </DropdownItem>
                )
              }
            </DropdownMenu>
          </Dropdown>
          {this.props.children}
        </ButtonToolbar>
        {!this.displayCalendar ? null :
          <div className="div-calendar" onBlur={this.closeCalendar}>
            <label>Date Range:&nbsp;</label>
            <Moment style={{ "display": this.state.start ? "" : "none" }} element="span" utc="true" format="MM/DD/YYYY">{this.state.start}</Moment>&nbsp;
            <FontAwesomeIcon icon={faCalendar} onClick={this.toggleCalendar} /><br />
            <div style={{ "display": this.state.end ? "" : "none" }} >
              <label>To:&nbsp;</label>
              <Moment element="span" utc="true" format="MM/DD/YYYY">{this.state.end}</Moment>&nbsp;
            <FontAwesomeIcon icon={faCalendar} onClick={this.toggleCalendar} />
            </div>
            {!this.state.isCalendarOpen ? null : <Calendar startDate= {this.state.calendarStart} endDate={this.state.calendarEnd} onChange={this.onCalendarChange} />}
          </div>
        }
        <ButtonToolbar className="current-filters">
          {
            this.props.filters.map(filterBtn =>
              <Button key={filterBtn.id}>{filterBtn.name} &nbsp;<FontAwesomeIcon key={filterBtn.id + "icon"} icon={faTimesCircle} color="red" onClick={e => this.props.handleRemoveFilter(filterBtn)} /></Button>)
          }
        </ButtonToolbar>
        {!this.props.submitText ? null : <button className="btn btn-primary" disabled={this.props.fetching} onClick={this.submit}>{this.props.submitText}</button>}
      </div>
    );
  }
}