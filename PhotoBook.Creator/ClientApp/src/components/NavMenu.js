import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import { LoginMenu } from './api-authorization/LoginMenu';

export class NavMenu extends Component {
  static displayName = NavMenu.name;

  constructor(props) {
    super(props);

    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.closeNavbar = this.closeNavbar.bind(this);
    this.state = {
      collapsed: true
    };
  }
  
  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }
  closeNavbar() {
    this.setState({
      collapsed: true
    });
  }
  render() {
    var authenticatedNavItems = [
      <NavItem key="search"><NavLink tag={Link} className="text-dark" to="/search" onClick={this.closeNavbar}>Search</NavLink></NavItem>,
      <NavItem key="faces"><NavLink tag={Link} className="text-dark" to="/faces" onClick={this.closeNavbar}>Faces</NavLink></NavItem>,
      <NavItem key="tagtypes"><NavLink tag={Link} className="text-dark" to="/TagTypes" onClick={this.closeNavbar}>Tags</NavLink></NavItem>,
      <NavItem key="photobooks"><NavLink tag={Link} className="text-dark" to="/PhotoBooks" onClick={this.closeNavbar}>PhotoBooks</NavLink></NavItem>
      ];
    return (
      <header>
        <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light>
          <Container>
            <NavbarBrand tag={Link} to="/">Photo Book Creator</NavbarBrand>
            <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
            <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed} navbar>
              <ul className="navbar-nav flex-grow">
                <NavItem>
                  <NavLink tag={Link} className="text-dark" to="/" onClick={this.closeNavbar}>Home</NavLink>
                </NavItem>
                {this.props.isAuthenticated && !this.props.isGuest? authenticatedNavItems : null}
                {
                  !(this.props.isAuthenticated && this.props.isGuest) ?
                    null :
                    <NavItem><NavLink tag={Link} className="text-dark" to="/PhotoBooks" onClick={this.closeNavbar}>PhotoBooks</NavLink></NavItem>
                }
                <LoginMenu>
                </LoginMenu>
              </ul>
            </Collapse>
          </Container>
        </Navbar>
      </header>
    );
  }
}
