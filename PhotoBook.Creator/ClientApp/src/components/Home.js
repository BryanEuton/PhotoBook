import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import authService from './api-authorization/AuthorizeService';
import { ApplicationPaths } from './api-authorization/ApiAuthorizationConstants';
import { clientService } from './services';
import { stopEvent } from '../utils';

export const Home = function (props) {
  const [buttonText, setButtonText] = useState("Clear local storage"),
    [isAuthenticated, setAuthenticated] = useState(false);
  function clearClick(e){
    stopEvent(e);
    localStorage.clear();
    clientService.clearCookies();
    setButtonText("Cleared.");
  };
  useEffect(() => {
    let ignore = false;
    async function handleUpdate(state) {
      if (ignore) {
        return;
      }
      const authenticated = await authService.isAuthenticated();
      console.log('received update', state, authenticated);
      if (authenticated !== isAuthenticated) {
        setAuthenticated(authenticated);
      }
    }
    console.log('subscribing to auth!', 'home');
    const subscription = authService.subscribe(handleUpdate);
    handleUpdate();

    return /* clean up */() => {
      ignore = true;
      console.log('unsubscribing to auth!');
      authService.unsubscribe(subscription);
    };
  });

  return <div>
    <h1>Welcome to the Photo Book Creator!</h1>
    {isAuthenticated ?
      <div>
        <p>To get started, go create your first <a href="/PhotoBooks">photo book</a> <br /> Then go <a href="/Search">search</a> for some photos to add</p>
        <Button color="primary" onClick={e => clearClick(e)} >{buttonText}</Button>
      </div> : 
      <div>
        <Button color="primary" onClick={e => clearClick(e)} >{buttonText}</Button>
        <p>To get started, please <a href={`${ApplicationPaths.Login}`}>log in</a></p>
      </div>
    }
  </div>;
}