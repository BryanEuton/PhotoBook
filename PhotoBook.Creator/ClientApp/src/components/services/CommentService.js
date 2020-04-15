import authService from '../api-authorization/AuthorizeService';
import { toast } from 'react-toastify';
import { ShowSuccessToast } from './CommonService';
import axios from 'axios';

export class CommentService {

  async get(thumbnailId) {
    try {
          
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/comment/get?thumbnailId=' + thumbnailId,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
      );
      
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get comments. ${e}`);
      }
    }
  }
  async create(comment) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/comment/create',
          comment,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("comment" + response.data.results.id, response.data.message || "Created Comment");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to create comment");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to create comment. ${e}`);
      }
    }
  }
  async update(comment) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return null;
      }
      const response = await axios
        .post(
          '/api/comment/update',
          comment,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("comment" + response.data.results.id, response.data.message || "Updated Comment");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to update comment");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to update comment. ${e}`);
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
          '/api/comment/delete?id=' + id,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowSuccessToast("comment" + id, response.data.message || "Removed Comment");
        return response.data.results;
      } else {
        toast.error(response.data.message || "Failed to remove comment");
      }
      return false;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove comment. ${e}`);
      }
    }
  }
  static get instance() { return commentService }
};
const commentService = new CommentService();

export default commentService;