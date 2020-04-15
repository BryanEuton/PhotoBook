import authService from '../api-authorization/AuthorizeService';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShowSuccessToast, ShowToastWithUndo } from './CommonService';

export class FaceService {
  removeToast(imageId, faceId) {
    if (toast.isActive(imageId + ":fc" + faceId)) {
      toast.dismiss(imageId + ":fc" + faceId);
    }
  }

  async save(face, imageId, undoFn /*args: addItem, updating, id, face*/, origFace) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      let postArgs = Object.assign({ imageId: imageId }, face);
      postArgs.x = Math.round(postArgs.x);
      postArgs.y = Math.round(postArgs.y);
      postArgs.width = Math.round(postArgs.width);
      postArgs.height = Math.round(postArgs.height);
      const response = await axios
          .post(
              '/api/Faces/Save/',
              postArgs,
              {
                  headers: { 'Authorization': `Bearer ${token}` }
              }
          );
      if (response.data && response.data.success) {
        const isNew = face.id <= 0,
          toastId = imageId + ":fc" + face.id,
          faceId = isNew ? response.data.results.id : face.id;
        if (isNew) {
          face = response.data.results;
          origFace = response.data.results;
        }
        if (undoFn) {
          ShowToastWithUndo(toastId,
            () => {
              undoFn(false, true);
              if (isNew) {
                faceService.remove(origFace, imageId, undoFn, face, toastId).then(data => {
                    undoFn(false, false, faceId, null);
                });
              } else {
                faceService.save(origFace, imageId, undoFn, face).then(data => {
                    undoFn(true, false, faceId, data);
                });
              }
              
            }, response.data.message);
        } else {
          ShowSuccessToast(toastId, response.data.message || "Updated Face.");
        }
        return response.data.results;
      } else {
          toast.error((response.data && response.data.message) || "Failed to update face.");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to save face for Image. ${e}`);
      }
    }
  }
  async setTag(face, undoFn /*args: updating, face*/, origFace) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      let postArgs = Object.assign({ }, face);
      if (postArgs.tagId > 0 && postArgs.name) {
        postArgs.name = null;
      }
      const response = await axios
        .post(
          '/api/Faces/Tag/',
          postArgs,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowToastWithUndo("ft:" + face.id,
          () => {
            undoFn(true);
            faceService.setTag(origFace, undoFn, face).then(data => {
              undoFn(false, data);
            });
          }, response.data.message);
        return response.data.results;
      } else {
        toast.error((response.data && response.data.message) || "Failed to update face name.");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to update face name. ${e}`);
      }
    }
  }
  async remove(face, imageId, undoFn /*args: addItem, updating, id, face*/, origFace, toastId) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return null;
      }
      return fetch(`/api/Faces/${(face.isValid || face.isNew ? "Remove" : "UndoRemove")}?faceId=${face.id}`,
        {
            headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
            method: 'POST'
        })
      .then(response => response.json())
      .then(data => {
        if (data && data.success) {
          toastId = toastId || (imageId + "|" + face.id);
          if (undoFn) {
            ShowToastWithUndo(toastId,
              () => {
                undoFn(false, true);
                faceService.remove(origFace, imageId, undoFn, face, toastId).then(results => {
                  if (results !== null) {
                    undoFn(!results.isHidden, false, face.id, results);
                  }
                });
              }, data.message);
          } else {
            ShowSuccessToast(toastId, data.message || "Removed Face");
          }
          
          return data.results;
        } else {
            toast.error((data && data.message) || "Failed to remove Face.");
        }
        return null;
      });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove Faces for Image. ${e}`);
      }
    }
  }
  async removeAllFaces(imageId) {
    try {
        const token = await authService.getAccessToken();
        if (!token) {
            return [];
        }
        return fetch('/api/Faces/RemoveAll?thumbnailId=' + imageId,
                {
                    headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
                    method: 'POST'
                })
            .then(response => response.json())
            .then(data => {
                if (data && data.success) {
                    ShowSuccessToast(imageId, data.message || "Removed Faces for Image");
                } else {
                    toast.error((data && data.message) || "Failed to remove Faces for Image.");
                }
                return data;
            });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove Faces for Image. ${e}`);
      }
    }
    }

  async validate(face, undoFn /*args: updating, id, face*/) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const faceId = face.id;
      const response = await axios
        .post(
          '/api/Faces/Validate?id=' + faceId, null,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowToastWithUndo(":fc" + faceId,
          () => {
            undoFn(true);
            faceService.validate(face, undoFn).then(data => {
              undoFn(false, faceId, data);
            });
          }, response.data.message);
        return response.data.results;
      } else {
        toast.error((response.data && response.data.message) || "Failed to validate face.");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to validate face. ${e}`);
      }
    }
  }
  async search(params, terms) {
    try {
      const token = await authService.getAccessToken();
      const response = await axios
        .post(
          '/api/faces/PagedResults/',
          params,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        return { terms, results: response.data.results, totalResults: response.data.totalResults, resultsOrder: response.data.resultsOrder };
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to search for faces. ${e}`);
      }
    }
  }
  async find(params) {
    try {
      const token = await authService.getAccessToken();
      const response = await axios
        .post(
          '/api/faces/Find/',
          params,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        return { params, results: response.data.results, totalResults: response.data.totalResults, resultsOrder: response.data.resultsOrder };
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to search for faces. ${e}`);
      }
    }
  }

  static get instance() { return faceService; }
};

const faceService = new FaceService();

export default faceService;