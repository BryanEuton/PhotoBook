import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import axios from 'axios';

let googleSettings = null;

export class GoogleMapsService {
  async getSettings() {
    try {
      if(googleSettings){
        return googleSettings;
      }
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/Location/GetMapsInfo',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
      );
      
      googleSettings = response.data || {};
    
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get settings. ${e}`);
      }
    }
    return googleSettings;
  }

  static get instance() { return googleMapsService }
};

const googleMapsService = new GoogleMapsService();

export default googleMapsService;