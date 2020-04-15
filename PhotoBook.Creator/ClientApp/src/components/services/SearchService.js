import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import axios from 'axios';
//import { SearchDispatcher, SearchActionTypes } from "../dispatchers";

class SearchService {

  async search(params, terms) {
    try {
      const token = await authService.getAccessToken();
      const response = await axios
        .post(
          '/api/search/PagedSearchResults/',
          params,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        //SearchDispatcher.dispatch({ type: SearchActionTypes.SET_SEARCH_RESULTS, terms, results: response.data.results, totalResults: response.data.totalResults });
        return { terms, results: response.data.results, totalResults: response.data.totalResults, resultsOrder: response.data.resultsOrder};
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to search for images. ${e}`);
      }
    }
  }
  static get instance() { return searchService; }
};
const searchService = new SearchService();

export default searchService;