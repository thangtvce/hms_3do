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

export default {
  async fetchGroups(page = 1,pageSize = 10) {
    try {
      console.log('🏘️ Fetching groups:',{ page,pageSize });

      const response = await apiClient.get('/CommunityGroup/all-active-group',{
        params: { pageNumber: page,pageSize },
      });

      console.log('📋 Groups API response:',{
        status: response.status,
        dataStructure: Object.keys(response.data || {}),
        hasGroups: !!(response.data?.data?.groups || response.data?.groups)
      });

      const groups = response.data?.data?.groups || response.data?.groups || [];

      console.log('✅ Fetched groups result:',{
        groupsCount: groups.length,
        firstGroup: groups[0] ? {
          groupId: groups[0].groupId,
          groupName: groups[0].groupName,
          memberCount: groups[0].memberCount
        } : null
      });

      return groups;
    } catch (error) {
      console.log('❌ fetchGroups error:',{
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch groups');
    }
  },

  async fetchGroupById(groupId) {
    try {
      const response = await apiClient.get(`/CommunityGroup/active/${groupId}`);
      const group = response.data.data;
      console.log('Fetched group:',groupId);
      return group;
    } catch (error) {
      console.log('fetchGroupById error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch group');
    }
  },

  async fetchPosts({ groupId,pageNumber = 1,pageSize = 10,searchTerm } = {}) {
    try {
      const response = await apiClient.get(`/CommunityPost/group/${groupId}`,{
        params: {
          pageNumber,
          pageSize,
          searchTerm: searchTerm || undefined,
        },
      });

      console.log('📋 Raw API response structure:',{
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        hasData: !!response.data?.data,
        hasPosts: !!(response.data?.Posts || response.data?.data?.Posts)
      });

      const responseData = response.data?.data || response.data;
      const posts = responseData?.Posts || responseData?.posts || [];
      const totalPages = responseData?.TotalPages || responseData?.totalPages || 0;
      const totalCount = responseData?.TotalCount || responseData?.totalCount || 0;

      const result = {
        posts,
        totalPages,
        totalCount,
        currentPage: pageNumber,
        hasMore: pageNumber < totalPages
      };

      console.log('✅ Processed posts result:',{
        postsCount: result.posts.length,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        firstPost: result.posts[0] ? {
          postId: result.posts[0].postId,
          content: result.posts[0].content?.substring(0,50) + '...',
          userFullName: result.posts[0].userFullName
        } : null
      });

      return result;
    } catch (error) {
      console.log('❌ fetchPosts error:',{
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        groupId,
        pageNumber
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  },

  async searchPosts(search = '',tagId = null,page = 1,pageSize = 10) {
    try {
      // Lấy tất cả bài post (giả sử dùng fetchPosts)
      const resultAll = await this.fetchPosts({ pageNumber: page,pageSize });
      let posts = resultAll.posts || [];
      // Lọc theo tag nếu có tagId
      if (tagId) {
        posts = posts.filter(post => Array.isArray(post.tags) && post.tags.some(tag => tag.tagId === tagId));
      }
      // Lọc theo nội dung nếu có search
      if (search && search.trim()) {
        const searchLower = search.trim().toLowerCase();
        posts = posts.filter(post =>
          (post.content && post.content.toLowerCase().includes(searchLower)) ||
          (Array.isArray(post.tags) && post.tags.some(tag => tag.tagName.toLowerCase().includes(searchLower)))
        );
      }
      const result = {
        posts,
        totalPages: resultAll.totalPages || 0,
      };
      console.log('Search posts (local):',result.posts.length);
      return result;
    } catch (error) {
      console.log('searchPosts error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to search posts');
    }
  },

  // Upload image (base64) to server, return imageUrl
  async uploadImage(image) {
    try {
      // image: { base64, name, type } hoặc chỉ base64 string
      let base64 = image.base64 || image;
      const response = await apiClient.post('/Upload',{
        image: base64,
      });
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('uploadImage error: Received HTML instead of JSON.');
        throw new Error('Server error: Received HTML instead of JSON.');
      }
      if (!response.data || !response.data.imageUrl) {
        console.log('uploadImage error: Unexpected response',response.data);
        throw new Error('Upload image failed: Unexpected response');
      }
      console.log('Uploaded image, got url:',response.data.imageUrl);
      return response.data;
    } catch (error) {
      console.log('uploadImage error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload image');
    }
  },

  async createPost(groupId,content,thumbnail,tagIds = []) {
    try {
      const userId = await getUserId();
      const payload = {
        groupId,
        content,
        tagIds,
        userId,
        status: "active",
      };

      // Nếu không có thumbnail, gán mặc định là một URL ảnh placeholder
      if (!thumbnail || typeof thumbnail !== "string" || !thumbnail.trim()) {
        payload.thumbnail = "https://placehold.co/600x400?text=No+Image";
      } else {
        // Kiểm tra xem thumbnail có phải là base64 hoặc URL hợp lệ
        const isBase64 = thumbnail.startsWith("data:image/") && thumbnail.includes(";base64,");
        const isUrl = /^https?:\/\/[\S]+$/i.test(thumbnail);
        if (isBase64 || isUrl) {
          payload.thumbnail = thumbnail;
        } else {
          console.warn("⚠️ Invalid thumbnail format, using default placeholder.",thumbnail);
          payload.thumbnail = "https://placehold.co/600x400?text=No+Image";
        }
      }

      console.log("📤 Sending create post request:",payload);

      const response = await apiClient.post("/CommunityPost",payload);
      if (typeof response.data === "string" && response.data.startsWith("<!DOCTYPE html")) {
        console.log("createPost error: Received HTML instead of JSON.");
        throw new Error("Lỗi server: Nhận được HTML thay vì JSON.");
      }

      console.log("✅ Created post:",response.data.data?.postId,response.data);
      return response.data;
    } catch (error) {
      console.error("❌ createPost error:",error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || "Không thể tạo bài viết");
    }
  },
  async updatePost(postId,groupId,content,thumbnail,tagIds = []) {
    try {
      const userId = await getUserId();
      const payload = {
        PostId: postId,
        UserId: userId,
        GroupId: groupId,
        Content: content,
        Thumbnail: thumbnail,
        Status: 'active',
        TagIds: tagIds
      };
      const response = await apiClient.put(`/CommunityPost/${postId}`,payload);

      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        throw new Error('Server error: Received HTML instead of JSON.');
      }

      if (response.data?.statusCode === 200 && response.data?.data) {
        return {
          statusCode: 200,
          data: response.data.data,
          message: response.data.message || 'Post updated successfully.'
        };
      }
      throw new Error(response.data?.message || 'Failed to update post');
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update post');
    }
  },

  async deletePost(postId) {
    try {
      console.log('🗑️ Deleting post:',postId);
      const response = await apiClient.delete(`/CommunityPost/${postId}`);

      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('deletePost error: Received HTML instead of JSON.');
        throw new Error('Server error: Received HTML instead of JSON.');
      }

      console.log('Post deleted successfully:',response.data);
      return response; // Return full response to access status and data
    } catch (error) {
      console.log('deletePost error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  },
  async fetchComments(postId,page = 1,pageSize = 10) {
    try {
      console.log('💬 Fetching comments:',{ postId,page,pageSize });

      const response = await apiClient.get(`/PostComment/by-post/${postId}`,{
        params: { pageNumber: page,pageSize },
      });

      console.log('📋 Comments API response:',{
        status: response.status,
        postId,
        dataStructure: Object.keys(response.data || {}),
        hasComments: !!(response.data?.data?.comments || response.data?.comments)
      });

      const comments = response.data?.data?.comments || response.data?.comments || [];

      console.log('✅ Fetched comments result:',{
        postId,
        commentsCount: comments.length,
        firstComment: comments[0] ? {
          commentId: comments[0].commentId,
          commentText: comments[0].commentText?.substring(0,50) + '...',
          userFullName: comments[0].userFullName
        } : null
      });

      return comments;
    } catch (error) {
      console.log('❌ fetchComments error:',{
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        postId
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch comments');
    }
  },

  async createComment(postId,commentText) {
    try {
      const response = await apiClient.post('/PostComment/user',{
        postId,
        commentText,
      });
      // Check if response is JSON and has expected structure
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('createComment error: Received HTML instead of JSON. Possible backend/ngrok error.');
        throw new Error('Server error: Received HTML instead of JSON. Check backend or ngrok status.');
      }
      if (!response.data || !response.data.data || !response.data.data.commentId) {
        console.log('createComment error: Unexpected response structure',response.data);
        throw new Error('Unexpected response frrrrrrrrrrom server when posting comment.');
      }
      console.log('Created comment:',response.data.data.commentId,response.data.data);
      return response.data;
    } catch (error) {
      console.log('createComment error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create comment');
    }
  },
  async fetchReactions(postId,page = 1,pageSize = 10) {
    try {
      console.log('👍 Fetching reactions:',{ postId,page,pageSize });
      const response = await apiClient.get(`/PostReaction/by-post/${postId}`,{
        params: { pageNumber: page,pageSize },
      });

      const reactions = response.data?.data?.reactions || response.data?.reactions || [];
      console.log('✅ Fetched reactions resultzzzzzzzzzzzzzzzzzz:',{
        postId,
        reactionsCount: reactions.length,
        reactionTypes: reactions.reduce((acc,r) => {
          acc[r.reactionTypeId] = (acc[r.reactionTypeId] || 0) + 1;
          return acc;
        },{})
      });
      return reactions;
    } catch (error) {
      console.log('❌ fetchReactions error:',{
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        postId
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch reactions');
    }
  },
  async fetchReactionTypes() {
    try {
      const response = await apiClient.get('/ReactionType');
      // Check if response is JSON and has expected structure
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('fetchReactionTypes error: Received HTML instead of JSON. Possible backend/ngrok error.');
        throw new Error('Server error: Received HTML instead of JSON. Check backend or ngrok status.');
      }
      const types = response.data.data?.reactionTypes || response.data?.reactionTypes || [];
      console.log('Fetched reaction types:',types.length,types);
      return types;
    } catch (error) {
      console.log('fetchReactionTypes error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reaction types');
    }
  },
  async createReaction(postId,reactionTypeId) {
    try {

      const response = await apiClient.post('/PostReaction/react',{
        postId,
        reactionTypeId,


      });
      console.log('Created reaction:',response.data);

      return response.data;

    } catch (error) {
      console.log('createReaction error:',error);
      throw new Error(error || 'Failed to create reaction');
    }
  },
  async editCommentByUser(commentId,postId,commentText) {
    try {
      const response = await apiClient.put(`/PostComment/user/${commentId}`,{
        postId,
        commentText
      });

      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.error('editCommentByUser error: Received HTML instead of JSON.');
        throw new Error('Server error: Received HTML instead of JSON.');
      }

      console.log('Updated comment:',response.data.data?.CommentId,response.data);
      return response.data;
    } catch (error) {
      console.log('editCommentByUser error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update comment');
    }
  },
  async updateReaction(reactionId,reactionTypeId) {
    try {
      const userId = await getUserId();
      const response = await apiClient.put(`/PostReaction/${reactionId}`,{
        reactionId,
        reactionTypeId,
        userId,
        postId: null,
      });
      console.log('Updated reaction:',response.data.data.reactionId);
      return response.data.data;
    } catch (error) {
      console.log('updateReaction error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to update reaction');
    }
  },

  async deleteReaction(reactionId) {
    try {
      const response = await apiClient.delete(`/PostReaction/${reactionId}`);
      console.log('Deleted reaction:',reactionId);
      return response.data;
    } catch (error) {
      console.log('deleteReaction error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete reaction');
    }
  },

  async createReport(postId,reasonId,reasonText,details) {
    try {
      const userId = await getUserId();
      const response = await apiClient.post('/PostReport',{
        postId,
        reasonId,
        reasonText,
        details,
        userId,
      });
      console.log('Created report:',response.data.data.reportId);
      return response.data.data;
    } catch (error) {
      console.log('createReport error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to create report');
    }
  },

  async fetchReportReasons() {
    try {
      const response = await apiClient.get('/ReportReason');
      const reasons = response.data.data?.ReportReasons || [];
      console.log('Fetched report reasons:',reasons.length);
      return reasons;
    } catch (error) {
      console.log('fetchReportReasons error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch report reasons');
    }
  },
  async fetchTags() {
    try {
      console.log('🏷️ Fetching tags...');

      const response = await apiClient.get('/Tag/active');

      console.log('📋 Tags API response:',{
        status: response.status,
        dataStructure: Object.keys(response.data || {}),
        hasTags: !!(response.data?.tags || response.data?.tags)
      });

      const tags = response.data?.data?.tags || response.data?.tags || [];

      console.log('🚀 Final tags data returned by fetchTags:',tags);

      return tags;
    } catch (error) {
      console.log('❌ fetchTags error:',{
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch tags');
    }
  },

  async createTag(tagName) {
    try {
      const response = await apiClient.post('/Tag',{ tagName });
      console.log('Created tag:',response.data.data.tagId);
      return response.data.data;
    } catch (error) {
      console.log('createTag error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to create tag');
    }
  },
  async deleteCommentByUser(commentId) {
    try {
      const response = await apiClient.delete(`/CommunityPost/user/${commentId}`);

      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('deleteCommentByUser error: Received HTML instead of JSON.');
        throw new Error('Server error: Received HTML instead of JSON.');
      }

      console.log('Deleted comment:',commentId,response.data);
      return response.data;
    } catch (error) {
      console.log('deleteCommentByUser error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete comment');
    }
  },
  async joinGroup(groupId) {
    try {
      const response = await apiClient.post('/GroupMember/join',{ groupId });
      console.log('Joined group:',response.data.data);
      return response.data.data;
    } catch (error) {
      console.log('joinGroup error:',error.message);
      throw new Error(error.response?.data?.message || 'Failed to join group');
    }
  },
  async deleteCommentByUser(commentId) {
    try {
      const response = await apiClient.delete(`/PostComment/delete/user/${commentId}`);

      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html')) {
        console.log('deleteCommentByUser error: Received HTML instead of JSON.');
        throw new Error('Server error: Received HTML instead of JSON.');
      }

      console.log('Deleted comment:',commentId,response.data);
      return response.data;
    } catch (error) {
      console.log('deleteCommentByUser error:',error.message,error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete comment');
    }
  }

};

async function getUserId() {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      console.log('No user data in AsyncStorage');
      throw new Error('User not logged in');
    }
    const parsed = JSON.parse(userData);
    if (!parsed.userId) {
      console.log('Invalid user data:',parsed);
      throw new Error('Invalid user data');
    }
    console.log('getUserId:',parsed.userId);
    return parsed.userId;
  } catch (err) {
    console.log('getUserId error:',err.message);
    throw err;
  }

}

