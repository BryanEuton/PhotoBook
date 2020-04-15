import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import { ShowSuccessToast, ShowToastWithUndo } from './CommonService';
import axios from 'axios';
//import { TagDispatcher, TagActionTypes } from "../dispatchers";

export class TagService {

  async get() {
    try {
          
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/tag/get',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
      );
      //TagDispatcher.dispatch({ type: TagActionTypes.SET_TAGS, tags: response.data });
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get tags. ${e}`);
      }
    }
  }
  async create(tag) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/Tag/Create',
          tag,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("tag" + response.data.results.id, response.data.message || "Created Tag");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to create tag");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to create tag. ${e}`);
      }
    }
  }
  async update(tag) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/Tag/Update',
          tag,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("tag" + response.data.results.id, response.data.message || "Updated Tag");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to update tag");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to update tag. ${e}`);
      }
    }
  }
  async remove(id) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return false;
      }
      const response = await axios
        .delete(
          '/api/Tag/Delete?id=' + id,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("tag" + id, response.data.message || "Removed Tag");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to remove tag");
      }
      return false;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove tag. ${e}`);
      }
    }
  }
  async tagImage(tagId, imageId, updateFn) {
    try { 
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      return fetch('/api/tag/ToggleTagImage?tagId=' + tagId + '&thumbnailId=' + imageId,
              {
                  headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
                  method: 'POST'
              })
          .then(response => response.json())
          .then(data => {
              if (data && data.success) {
                  ShowToastWithUndo(imageId + ":tg" + tagId, () => {/* Undo tag image */
                      updateFn(null, 1/* Updating */);
                      tagService.tagImage(tagId, imageId, updateFn)
                          .then(undoData => {
                              if (undoData && undoData.success) {
                                  updateFn(undoData.results, 0);
                              }
                          });
                  }, data.message);
                  //toast.success(data.message || "Toggled Tag for Image");
              } else {
                  toast.error((data && data.message) || "Failed to toggle Tag for Image.");
              }
              return data;
          });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to toggle Tag for Image. ${e}`);
      }
    }
  }
  static get instance() { return tagService }
};
const tagService = new TagService();

export default tagService;