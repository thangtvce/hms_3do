import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
        console.log(`Request: ${config.url}`,{ method: config.method,params: config.params });
      }
      return config;
    } catch (error) {
      console.log(`Request interceptor error for ${config.url}:`,error.message);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.log('Request interceptor failed:',error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.config.url}`,{ status: response.status });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log(`Response error for ${originalRequest.url}:`,JSON.stringify(error.response?.data,null,2));

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await apiClient.post('/Auth/refresh-token',{ refreshToken });
        if (response.data.statusCode === 200 && response.data.data) {
          const { accessToken: newAccessToken,refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken',newAccessToken);
          await AsyncStorage.setItem('refreshToken',newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
        throw new Error('Failed to refresh token');
      } catch (refreshError) {
        console.log('Token refresh failed:',refreshError);
        await AsyncStorage.multiRemove(['accessToken','refreshToken','user']);
        throw new Error('Unauthorized access, please log in again.');
      }
    }

    if (error.response?.status === 400 && error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
      throw new Error(errorMessages || 'Invalid request data.');
    }

    throw new Error(error.response?.data?.message || error.message);
  }
);

export const getAllActiveGroups = async (params = {}) => {
  try {
    const response = await apiClient.get('CommunityGroup/all-active-group',{ params });
    if (response.data.statusCode === 200) {
      return response.data.data.groups;
    } else {
      throw new Error(response.data.message || 'Failed to fetch groups');
    }
  } catch (error) {
    throw error;
  }
};

export const getGroupActiveById = async (id) => {
  try {
    const response = await apiClient.get(`CommunityGroup/active/${id}`);
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch group details');
    }
  } catch (error) {
    throw error;
  }
};

export const joinGroup = async (groupId,isPrivate = false) => {
  try {
    const response = await apiClient.post('GroupMember/join',{
      groupId,
      isRequested: isPrivate ? true : false
    });
    if (response.data.statusCode === 201) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to join group');
    }
  } catch (error) {
    throw error;
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const response = await apiClient.post('GroupMember/leave',{ groupId });
    if (response.data.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to leave group');
    }
  } catch (error) {
    throw error;
  }
};

export const getGroupPosts = async (groupId,params = {}) => {
  try {
    const response = await apiClient.get(`CommunityPost/group/${groupId}`,{ params });
    if (response.data.statusCode === 200) {
      return response.data.data.posts;
    } else {
      throw new Error(response.data.message || 'Failed to fetch posts');
    }
  } catch (error) {
    throw error;
  }
};

export const getAllReactionTypes = async (params = {}) => {
  try {
    const response = await apiClient.get('ReactionType',{ params });
    if (response.data.statusCode === 200) {
      return response.data.data.reactionTypes;
    } else {
      throw new Error(response.data.message || 'Failed to fetch reaction types');
    }
  } catch (error) {
    throw error;
  }
};

export const getCommentsByPostId = async (postId,params = {}) => {
  try {
    const response = await apiClient.get(`PostComment/active/by-post/${postId}`,{ params });
    if (response.data.statusCode === 200) {
      return response.data.data.comments;
    } else {
      throw new Error(response.data.message || 'Failed to fetch comments');
    }
  } catch (error) {
    throw error;
  }
};

export const addCommentByUser = async (postId,commentText) => {
  try {
    const response = await apiClient.post('PostComment/user',{ postId,commentText });
    if (response.data.statusCode === 201) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to add comment');
    }
  } catch (error) {
    throw error;
  }
};

export const editCommentByUser = async (commentId,postId,commentText) => {
  try {
    const response = await apiClient.put(`PostComment/user/${commentId}`,{ postId,commentText });
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to edit comment');
    }
  } catch (error) {
    throw error;
  }
};

export const deleteUserComment = async (commentId) => {
  try {
    const response = await apiClient.delete(`PostComment/delete/user/${commentId}`);
    if (response.data.statusCode === 200) {
      return true;
    } else {
      throw new Error(response.data.message || 'Failed to delete comment');
    }
  } catch (error) {
    throw error;
  }
};

export const createPost = async (postDto) => {
  try {
    const response = await apiClient.post('CommunityPost',postDto);
    if (response.data.statusCode === 201) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create post');
    }
  } catch (error) {
    throw error;
  }
};

export const updatePost = async (postId,postDto) => {
  try {
    const response = await apiClient.put(`CommunityPost/${postId}`,postDto);
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update post');
    }
  } catch (error) {
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await apiClient.delete(`CommunityPost/${postId}`);
    if (response.data.statusCode === 200) {
      return true;
    } else {
      throw new Error(response.data.message || 'Failed to delete post');
    }
  } catch (error) {
    throw error;
  }
};

export const getAllTags = async (params = {}) => {
  try {
    const response = await apiClient.get('Tag/active',{ params });
    if (response.data.statusCode === 200) {
      return response.data.data.tags;
    } else {
      throw new Error(response.data.message || 'Failed to fetch tags');
    }
  } catch (error) {
    throw error;
  }
};

export const reactToPost = async (postId,reactionTypeId,reactionText = null) => {
  try {
    const response = await apiClient.post('PostReaction/react',{
      postId,
      reactionTypeId,
      reactionText
    });
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to react to post');
    }
  } catch (error) {
    throw error;
  }
};

export const unreactToPost = async (postId) => {
  try {
    const response = await apiClient.delete(`PostReaction/unreact/${postId}`);
    if (response.data.statusCode === 200) {
      return true;
    } else {
      throw new Error(response.data.message || 'Failed to unreact to post');
    }
  } catch (error) {
    throw error;
  }
};

export const getAllActiveReportReasons = async (params = {}) => {
  try {
    const response = await apiClient.get('ReportReason/active',{ params });
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch report reasons');
    }
  } catch (error) {
    throw error;
  }
};

export const createReportByUser = async (reportDto) => {
  try {
    const response = await apiClient.post('PostReport/user',reportDto);
    if (response.data.statusCode === 201 && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create report');
    }
  } catch (error) {
    throw error;
  }
};

