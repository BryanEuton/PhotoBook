import React, { useState, useEffect } from 'react';
import { Route } from 'react-router';
import authService from './components/api-authorization/AuthorizeService';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Search }  from './components/search/Search';
import Faces from './components/faces/Search';
import { FaceSwiper } from './components/faces/Swiper';
import { TagEditor } from './components/tags/Editor';
import { TagList } from './components/tags/List';
import { TagTypes } from './components/tags/Types';
import { PhotoBookEditor } from './components/photoBooks/Editor';
import { PhotoBookList } from './components/photoBooks/List';
import { PhotoBookPhotos } from './components/photoBooks/Photos';
import ApiAuthorizationRoutes from './components/api-authorization/ApiAuthorizationRoutes';
import { QueryParameterNames, ApplicationPaths } from './components/api-authorization/ApiAuthorizationConstants';
import { AuthenticatedRoute } from './components/AuthenticatedRoute';
import { ToastContainer, toast } from 'react-toastify';
import { RedirectToIdentity } from './utils/RedirectToIdentity';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

toast.configure();
export const App = function (props) {
  const [isAuthenticated, setAuthenticated] = useState(false),
    [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function handleUpdate(state) {
      if (ignore) {
        return;
      }
      const user = await authService.getUser(),
        authenticated = !!user;
      if (ignore) {
        return;
      }
      console.log('received update', state, authenticated);
      if (authenticated !== isAuthenticated) {
        setAuthenticated(authenticated);
      }
      if ((!authenticated && !isGuest) || (authenticated && user.isGuest !== isGuest)) {
        setIsGuest(user.isGuest);
      }
    }
    console.log('subscribing to auth!', props.path);
    const subscription = authService.subscribe(handleUpdate);
    handleUpdate();

    return /* clean up */() => {
      ignore = true;
      console.log('unsubscribing to auth!');
      authService.unsubscribe(subscription);
    };
  }, [props.path]);

  return (
    <Layout isAuthenticated={isAuthenticated} isGuest={isGuest}>
      <ToastContainer />
      <AuthenticatedRoute exact path='/' component={Home} allowAnonymous= {true} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute path='/search' component={Search} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/faceswiper' component={FaceSwiper} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/faces' component={Faces} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/Tag/create' component={TagEditor} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/Tag/:id/update' component={TagEditor} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/Tags/:tagType' component={TagList} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute path='/TagTypes' component={TagTypes} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/PhotoBook/create' component={PhotoBookEditor} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/PhotoBook/:id/update' component={PhotoBookEditor} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute exact path='/PhotoBook/:id/photos' component={PhotoBookPhotos} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <AuthenticatedRoute path='/PhotoBooks' component={PhotoBookList} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <Route path={ApplicationPaths.ApiAuthorizationPrefix} component={ApiAuthorizationRoutes} isAuthenticated={isAuthenticated} isGuest={isGuest} />
      <Route path='/Account/Login' component={RedirectToIdentity} />
    </Layout>
  );
}
axios.interceptors.response.use(response => { // intercept the global error
    return response;
  },
  error => {
    function getReturnUrl() {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get(QueryParameterNames.ReturnUrl);
      if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
        // This is an extra check to prevent open redirects.
        throw new Error("Invalid return url. The return url needs to have the same origin as the current page.");
      }
      return fromQuery || `${window.location.origin}/`;
    }

    if (typeof error !== 'undefined' && error !== null && error.response.status === 401 && window.location.href.indexOf('/authentication/') === -1 && window.location.href.indexOf('/account/') === -1) {
      sessionStorage.clear();
      window.location.replace(getReturnUrl());
    }
    // Do something with response error
    return Promise.reject(error);
  });
