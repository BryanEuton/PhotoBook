import React, { useState, useEffect } from 'react';
import authService from './api-authorization/AuthorizeService';
import { ApplicationPaths } from './api-authorization/ApiAuthorizationConstants';
import { Route } from 'react-router';

export const AuthenticatedRoute = function (props) {
  const Component = props.component;

  return <Route
    exact={props.exact}
    path={props.path}
    render={p =>
      props.isAuthenticated || props.allowAnonymous ? (
        <Component {...props} {...p} />
      ) : (<p><i>Unable to load.  Please <a href={`${ApplicationPaths.Login}`}>log in</a> first</i></ p>)
    }
  />;
}