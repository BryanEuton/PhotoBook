import { ApplicationPaths } from '../components/api-authorization/ApiAuthorizationConstants';

export const RedirectToIdentity = () => {
  window.location.replace(
    `${ApplicationPaths.IdentityLoginPath}${window.location.search}`
  );
  return null;
}