import { Component } from 'react';
import { authenticate } from '../utils/authenticate';


export class AuthenticateBeforeRender extends Component {
  state = {
    isAuthenticated: false
  }

  componentDidMount() {
    authenticate().then(isAuthenticated => {
      this.setState({ isAuthenticated });
    });
  }

  render() {
    return this.state.isAuthenticated ? this.props.render() : null;
  }
}