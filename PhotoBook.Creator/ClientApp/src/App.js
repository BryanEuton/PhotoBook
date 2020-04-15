import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import Search  from './components/search/Search';
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

export default class App extends Component {
  static displayName = App.name;

  render () {
    return (
        <Layout>
        <ToastContainer />
        <Route exact path='/' component={Home} />
        <AuthenticatedRoute path='/search' component={Search} />
        <AuthenticatedRoute exact path='/faceswiper' component={FaceSwiper} />        
        <AuthenticatedRoute exact path='/faces' component={Faces} />
        <AuthenticatedRoute exact path='/Tag/create' component={TagEditor} />
        <AuthenticatedRoute exact path='/Tag/:id/update' component={TagEditor} />
        <AuthenticatedRoute exact path='/Tags/:tagType' component={TagList} />
        <AuthenticatedRoute path='/TagTypes' component={TagTypes} />
        <AuthenticatedRoute exact path='/PhotoBook/create' component={PhotoBookEditor} />
        <AuthenticatedRoute exact path='/PhotoBook/:id/update' component={PhotoBookEditor} />
        <AuthenticatedRoute exact path='/PhotoBook/:id/photos' component={PhotoBookPhotos} />
        <AuthenticatedRoute path='/PhotoBooks' component={PhotoBookList} />
        <Route path={ApplicationPaths.ApiAuthorizationPrefix} component={ApiAuthorizationRoutes} />
        <Route path='/Account/Login' component={RedirectToIdentity} />
      </Layout>
    );
  }
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
        throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
      }
      return fromQuery || `${window.location.origin}/`;
    }

    if (error.response.status === 401 && window.location.href.indexOf('/authentication/') === -1 && window.location.href.indexOf('/account/') === -1) {
      sessionStorage.clear();
      window.location.replace(getReturnUrl());
    }
    // Do something with response error
    return Promise.reject(error);
  });
