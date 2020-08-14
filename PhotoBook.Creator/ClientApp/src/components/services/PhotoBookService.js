import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import { ShowSuccessToast, ShowToastWithUndo } from './CommonService';
import axios from 'axios';

export class PhotoBookService {
  async get(id) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/PhotoBook/' + (id ? 'GetDetails?id=' + id : "Get"),
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
      );
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get PhotoBooks. ${e}`);
      }
      return [];
    }
  }
  async toggleImage(photoBookId, imageId, updateFn) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      return fetch('/api/PhotoBook/TogglePhoto?photoBookId=' + photoBookId + '&thumbnailId=' + imageId,
              {
                  headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
                  method: 'POST'
              })
          .then(response => response.json())
          .then(data => {
              if (data && data.success) {
                  ShowToastWithUndo(imageId + ":pb" + photoBookId, () => {/* Undo toggle image */
                      updateFn(null, 1/* Updating */);
                      photoBookService.toggleImage(photoBookId, imageId, updateFn)
                          .then(undoData => {
                              if (undoData && undoData.success) {
                                  updateFn(undoData.results, 0);
                              }
                          });
                  }, data.message);
              } else {
                  toast.error((data && data.message) || "Failed to toggle Image for PhotoBook.");
              }
              return data;
          });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to toggle Image for PhotoBook. ${e}`);
      }
    }
  }

  async create(photoBook) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/PhotoBook/Create',
          photoBook,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("photoBook" + response.data.results.id, response.data.message || "Created PhotoBook");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to create photo book");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to create photo book. ${e}`);
      }
    }
  }
  async update(photoBook) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/PhotoBook/Update',
          photoBook,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("photoBook" + response.data.results.id, response.data.message || "Updated PhotoBook");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to update photo book");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to update photo book. ${e}`);
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
          '/api/PhotoBook/Delete?id=' + id,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("photoBook" + id, response.data.message || "Removed Photo Book");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to remove photo book");
      }
      return false;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove photo book. ${e}`);
      }
    }
  }
  async publish(id) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return false;
      }
      const response = await axios
        .post(
          '/api/PhotoBook/Publish?id=' + id,
          {},
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("photoBook" + id, response.data.message || "Published Photo Book");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to publish photo book");
      }
      return false;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to publish photo book. ${e}`);
      }
    }
  }
  static get instance() { return photoBookService }
};

const photoBookService = new PhotoBookService();

export default photoBookService;