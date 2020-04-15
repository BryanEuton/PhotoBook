import React, { useState, useEffect } from 'react';
import authService from './api-authorization/AuthorizeService';
import { ApplicationPaths } from './api-authorization/ApiAuthorizationConstants';
import { Route } from 'react-router';

export const AuthenticatedRoute = function (props) {
  const [isAuthenticated, setAuthenticated] = useState(false),
    Component = props.component;

  useEffect(() => {
    async function handleUpdate(state) {
      const authenticated = await authService.isAuthenticated();
      console.log('received update', state, authenticated);
      if (authenticated !== isAuthenticated) {
        setAuthenticated(authenticated);
      }
    }
    console.log('subscribing to auth!', props.path);
    const subscription = authService.subscribe(handleUpdate);
    handleUpdate();

    return /* clean up */() => {
      console.log('unsubscribing to auth!');
      authService.unsubscribe(subscription);
    };
  }, [props.path]);

  return <Route
    exact={props.exact}
    path={props.path}
    render={p =>
    isAuthenticated ? (
        <Component {...p} />
      ) : (<p><i>Unable to load.  Please <a href={`${ApplicationPaths.Login}`}>log in</a> first</i></ p>)
    }
  />;
}