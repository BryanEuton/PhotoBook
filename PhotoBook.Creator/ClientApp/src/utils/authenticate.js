import { redirectToLogin } from './redirectToLogin';
import authService from '../components/api-authorization/AuthorizeService';

export const authenticate = async () => {
  if (await authService.getAccessToken()) {
    return true;
  }

  redirectToLogin();
  return false;
};