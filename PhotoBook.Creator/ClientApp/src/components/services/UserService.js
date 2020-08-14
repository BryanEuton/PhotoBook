import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import axios from 'axios';

class UserService {
  async get() {
    try {
      const token = await authService.getAccessToken();
      const response = await axios
        .get(
          '/api/users/get/',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        return response.data.results;
      }
      return [];
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to search for images. ${e}`);
      }
    }
  }
  static get instance() { return userService; }
};
const userService = new UserService();

export default userService;