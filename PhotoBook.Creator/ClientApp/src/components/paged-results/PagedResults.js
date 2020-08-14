import React, { Component } from 'react';
import Pagination from "react-js-pagination";


export class PagedResults extends Component {
  render() {
    return (<div className={"paged-results " + this.props.numColumnsClass}>
      <p className="num-results"><i>{this.props.pagedResults.numResults}</i> results</p>
      <Pagination
        activePage={this.props.pagedResults.page}
        itemsCountPerPage={this.props.pagedResults.pageSize}
        totalItemsCount={this.props.pagedResults.numResults}
        pageRangeDisplayed={5}
        onChange={this.props.handlePageChange}
        innerClass="pagination justify-content-center"
        itemClass="page-item"
        linkClass="page-link"
      />
      {this.props.children}
      <Pagination
        activePage={this.props.pagedResults.page}
        itemsCountPerPage={this.props.pagedResults.pageSize}
        totalItemsCount={this.props.pagedResults.numResults}
        pageRangeDisplayed={5}
        onChange={this.props.handlePageChange}
        innerClass="pagination justify-content-center"
        itemClass="page-item"
        linkClass="page-link"
      />
    </div>);
  }
}