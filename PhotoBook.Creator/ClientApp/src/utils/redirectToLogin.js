import { QueryParameterNames, ApplicationPaths} from '../components/api-authorization/ApiAuthorizationConstants';

export const redirectToLogin = () => {
  window.location.replace(
    `${ApplicationPaths.IdentityLoginPath}?${QueryParameterNames.ReturnUrl}=${encodeURI(window.location.pathname)}`
  );
  // or history.push('/login') if your Login page is inside the same app
}