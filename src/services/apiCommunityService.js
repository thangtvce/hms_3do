import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://a2d2-2402-800-63b5-930f-acd2-f39f-14cb-5625.ngrok-free.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log(`Request: ${config.url}`, { method: config.method, params: config.params });
      }
      return config;
    } catch (error) {
      console.error(`Request interceptor error for ${config.url}:`, error.message);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor failed:', error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.config.url}`, { status: response.status });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`Response error for ${originalRequest.url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized, skipping token refresh for debugging');
      throw new Error(error.response?.data?.message || 'Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export default {
  async fetchGroups(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get('/CommunityGroup/all-active-group', {
        params: { pageNumber: page, pageSize },
      });
      const groups = response.data.data?.groups || [];
      console.log('Fetched groups:', groups.length);
      return groups;
    } catch (error) {
      console.error('fetchGroups error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch groups');
    }
  },

  async fetchGroupById(groupId) {
    try {
      const response = await apiClient.get(`/CommunityGroup/${groupId}`);
      const group = response.data.data;
      console.log('Fetched group:', groupId);
      return group;
    } catch (error) {
      console.error('fetchGroupById error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch group');
    }
  },

  async fetchPosts(groupId, page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get('/CommunityPost', {
        params: { groupId, pageNumber: page, pageSize },
      });
      const result = {
        posts: response.data.data?.Posts || [],
        totalPages: response.data.data?.TotalPages || 0,
      };
      console.log('Fetched posts for group', groupId, ':', result.posts.length);
      return result;
    } catch (error) {
      console.error('fetchPosts error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  },

  async searchPosts(search = '', tagId = null, page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get('/CommunityPost/search', {
        params: { search, tagId, pageNumber: page, pageSize },
      });
      const result = {
        posts: response.data.data?.Posts || [],
        totalPages: response.data.data?.TotalPages || 0,
      };
      console.log('Search posts:', result.posts.length);
      return result;
    } catch (error) {
      console.error('searchPosts error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to search posts');
    }
  },

  async createPost(groupId, content, thumbnail, tagIds = []) {
    try {
      const userId = await getUserId();
      const response = await apiClient.post('/CommunityPost', {
        groupId,
        content,
        thumbnail,
        tagIds,
        userId,
        status: 'active', // This is hardcoded
      });
      console.log('Created post:', response.data.data.postId);
      return response.data;
    } catch (error) {
      console.error('createPost error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  },

  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'image.jpg',
      });
      const response = await apiClient.post('/UploadImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Uploaded image:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('uploadImage error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  },

  async fetchComments(postId, page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(`/PostComment/by-post/${postId}`, {
        params: { pageNumber: page, pageSize },
      });
      const comments = response.data.data?.comments || [];
      console.log('Fetched comments for post', postId, ':', comments.length);
      return comments;
    } catch (error) {
      console.error('fetchComments error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch comments');
    }
  },

  async createComment(postId, commentText) {
    try {
      const userId = await getUserId();
      const response = await apiClient.post('/PostComment', {
        postId,
        commentText,
        userId,
      });
      console.log('Created comment:', response.data.data.commentId);
      return response.data.data;
    } catch (error) {
      console.error('createComment error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to create comment');
    }
  },

  async fetchReactions(postId, page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(`/PostReaction/by-post/${postId}`, {
        params: { pageNumber: page, pageSize },
      });
      const reactions = response.data.data?.Reactions || [];
      console.log('Fetched reactions for post', postId, ':', reactions.length);
      return reactions;
    } catch (error) {
      console.error('fetchReactions error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch reactions');
    }
  },

  async fetchReactionTypes() {
    try {
      const response = await apiClient.get('/ReactionType');
      const types = response.data.data?.ReactionTypes || [];
      console.log('Fetched reaction types:', types.length);
      return types;
    } catch (error) {
      console.error('fetchReactionTypes error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch reaction types');
    }
  },

  async createReaction(postId, reactionTypeId) {
    try {
      const userId = await getUserId();
      const response = await apiClient.post('/PostReaction', {
        postId,
        reactionTypeId,
        userId,
      });
      console.log('Created reaction:', response.data.data.reactionId);
      return response.data.data;
    } catch (error) {
      console.error('createReaction error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to create reaction');
    }
  },

  async updateReaction(reactionId, reactionTypeId) {
    try {
      const userId = await getUserId();
      const response = await apiClient.put(`/PostReaction/${reactionId}`, {
        reactionId,
        reactionTypeId,
        userId,
        postId: null,
      });
      console.log('Updated reaction:', response.data.data.reactionId);
      return response.data.data;
    } catch (error) {
      console.error('updateReaction error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to update reaction');
    }
  },

  async deleteReaction(reactionId) {
    try {
      const response = await apiClient.delete(`/PostReaction/${reactionId}`);
      console.log('Deleted reaction:', reactionId);
      return response.data;
    } catch (error) {
      console.error('deleteReaction error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete reaction');
    }
  },

  async createReport(postId, reasonId, reasonText, details) {
    try {
      const userId = await getUserId();
      const response = await apiClient.post('/PostReport', {
        postId,
        reasonId,
        reasonText,
        details,
        userId,
      });
      console.log('Created report:', response.data.data.reportId);
      return response.data.data;
    } catch (error) {
      console.error('createReport error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to create report');
    }
  },

  async fetchReportReasons() {
    try {
      const response = await apiClient.get('/ReportReason');
      const reasons = response.data.data?.ReportReasons || [];
      console.log('Fetched report reasons:', reasons.length);
      return reasons;
    } catch (error) {
      console.error('fetchReportReasons error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch report reasons');
    }
  },

  async fetchTags() {
    try {
      const response = await apiClient.get('/Tag');
      const tags = response.data.data?.Tags || [];
      console.log('Fetched tags:', tags.length);
      return tags;
    } catch (error) {
      console.error('fetchTags error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch tags');
    }
  },

  async createTag(tagName) {
    try {
      const response = await apiClient.post('/Tag', { tagName });
      console.log('Created tag:', response.data.data.tagId);
      return response.data.data;
    } catch (error) {
      console.error('createTag error:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to create tag');
    }
  },

  async joinGroup(groupId) {
  try {    
    const response = await apiClient.post('/GroupMember/join', { groupId });
    console.log('Joined group:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('joinGroup error:', error.message);
    throw new Error(error.response?.data?.message || 'Failed to join group');
  }
}
};

async function getUserId() {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      console.error('No user data in AsyncStorage');
      throw new Error('User not logged in');
    }
    const parsed = JSON.parse(userData);
    if (!parsed.userId) {
      console.error('Invalid user data:', parsed);
      throw new Error('Invalid user data');
    }
    console.log('getUserId:', parsed.userId);
    return parsed.userId;
  } catch (err) {
    console.error('getUserId error:', err.message);
    throw err;
  }
  
}

