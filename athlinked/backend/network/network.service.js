const networkModel = require('./network.model');

/**
 * Follow a user service
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user to follow
 * @returns {Promise<object>} Service result
 */
async function followUserService(followerId, followingId) {
  try {
    if (!followerId || !followingId) {
      throw new Error('Follower ID and Following ID are required');
    }

    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const success = await networkModel.followUser(followerId, followingId);

    if (!success) {
      return {
        success: false,
        message: 'Already following this user',
      };
    }

    return {
      success: true,
      message: 'Successfully followed user',
    };
  } catch (error) {
    console.error('Follow user service error:', error.message);
    throw error;
  }
}

/**
 * Unfollow a user service
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user to unfollow
 * @returns {Promise<object>} Service result
 */
async function unfollowUserService(followerId, followingId) {
  try {
    if (!followerId || !followingId) {
      throw new Error('Follower ID and Following ID are required');
    }

    const success = await networkModel.unfollowUser(followerId, followingId);

    if (!success) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    return {
      success: true,
      message: 'Successfully unfollowed user',
    };
  } catch (error) {
    console.error('Unfollow user service error:', error.message);
    throw error;
  }
}

/**
 * Get followers list service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result with followers list
 */
async function getFollowersService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const followers = await networkModel.getFollowers(userId);

    return {
      success: true,
      followers,
    };
  } catch (error) {
    console.error('Get followers service error:', error.message);
    throw error;
  }
}

/**
 * Get following list service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result with following list
 */
async function getFollowingService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const following = await networkModel.getFollowing(userId);

    return {
      success: true,
      following,
    };
  } catch (error) {
    console.error('Get following service error:', error.message);
    throw error;
  }
}

/**
 * Get follow counts service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result with counts
 */
async function getFollowCountsService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const counts = await networkModel.getFollowCounts(userId);

    return {
      success: true,
      ...counts,
    };
  } catch (error) {
    console.error('Get follow counts service error:', error.message);
    throw error;
  }
}

/**
 * Check if user is following another user service
 * @param {string} followerId - User ID of the potential follower
 * @param {string} followingId - User ID of the potential following
 * @returns {Promise<object>} Service result with isFollowing boolean
 */
async function isFollowingService(followerId, followingId) {
  try {
    if (!followerId || !followingId) {
      throw new Error('Follower ID and Following ID are required');
    }

    const isFollowing = await networkModel.isFollowing(followerId, followingId);

    return {
      success: true,
      isFollowing,
    };
  } catch (error) {
    console.error('Is following service error:', error.message);
    throw error;
  }
}

async function sendConnectionRequestService(requesterId, receiverId) {
  try {
    if (!requesterId || !receiverId) {
      throw new Error('Requester ID and Receiver ID are required');
    }

    if (requesterId === receiverId) {
      throw new Error('Cannot send connection request to yourself');
    }

    const result = await networkModel.sendConnectionRequest(
      requesterId,
      receiverId
    );

    return result;
  } catch (error) {
    console.error('Send connection request service error:', error.message);
    throw error;
  }
}

async function acceptConnectionRequestService(requestId, receiverId) {
  try {
    if (!requestId || !receiverId) {
      throw new Error('Request ID and Receiver ID are required');
    }

    const result = await networkModel.acceptConnectionRequest(
      requestId,
      receiverId
    );

    return result;
  } catch (error) {
    console.error('Accept connection request service error:', error.message);
    throw error;
  }
}

async function rejectConnectionRequestService(requestId, receiverId) {
  try {
    if (!requestId || !receiverId) {
      throw new Error('Request ID and Receiver ID are required');
    }

    const result = await networkModel.rejectConnectionRequest(
      requestId,
      receiverId
    );

    return result;
  } catch (error) {
    console.error('Reject connection request service error:', error.message);
    throw error;
  }
}

async function getConnectionRequestsService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const requests = await networkModel.getConnectionRequests(userId);
    console.log(`Service: Found ${requests.length} connection requests for user ${userId}`);

    return {
      success: true,
      requests,
    };
  } catch (error) {
    console.error('Get connection requests service error:', error.message);
    throw error;
  }
}

async function checkConnectionRequestStatusService(requesterId, receiverId) {
  try {
    if (!requesterId || !receiverId) {
      throw new Error('Requester ID and Receiver ID are required');
    }

    const status = await networkModel.checkConnectionRequestStatus(
      requesterId,
      receiverId
    );

    return {
      success: true,
      ...status,
    };
  } catch (error) {
    console.error(
      'Check connection request status service error:',
      error.message
    );
    throw error;
  }
}

module.exports = {
  followUserService,
  unfollowUserService,
  getFollowersService,
  getFollowingService,
  getFollowCountsService,
  isFollowingService,
  sendConnectionRequestService,
  acceptConnectionRequestService,
  rejectConnectionRequestService,
  getConnectionRequestsService,
  checkConnectionRequestStatusService,
};
