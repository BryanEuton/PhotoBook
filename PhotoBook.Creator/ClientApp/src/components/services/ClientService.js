import { toast } from 'react-toastify';
import axios from 'axios';

export class ClientService {

  async clearCookies() {
    try {
      const response = await axios.get('/api/client/cookies/clear');
      
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to clear cookies. ${e}`);
      }
    }
  }
  async logError(msg) {
    try {
      const response = await axios
        .post(
          '/api/client/log/error',
          { Error: msg}
        );
      
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to log error. ${e}`);
      }
    }
  }
  static get instance() { return clientService }
};
const clientService = new ClientService();

export default clientService;