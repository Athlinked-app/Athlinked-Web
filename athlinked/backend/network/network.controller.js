const networkService = require('./network.service');

/**
 * Controller to follow a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function followUser(req, res) {
  try {
    const followerId = req.user?.id || req.body.user_id;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!followingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID to follow is required',
      });
    }

    const result = await networkService.followUserService(
      followerId,
      followingId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Follow user controller error:', error);
    if (error.message.includes('Cannot follow yourself')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to unfollow a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function unfollowUser(req, res) {
  try {
    const followerId = req.user?.id || req.body.user_id;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!followingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID to unfollow is required',
      });
    }

    const result = await networkService.unfollowUserService(
      followerId,
      followingId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Unfollow user controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get followers list
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getFollowers(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await networkService.getFollowersService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get followers controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get following list
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getFollowing(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await networkService.getFollowingService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get following controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get follow counts
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getFollowCounts(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await networkService.getFollowCountsService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get follow counts controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to check if user is following another user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function isFollowing(req, res) {
  try {
    const followerId = req.user?.id || req.query.follower_id;
    const followingId = req.params.userId;

    if (!followerId || !followingId) {
      return res.status(400).json({
        success: false,
        message: 'Follower ID and Following ID are required',
      });
    }

    const result = await networkService.isFollowingService(
      followerId,
      followingId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Is following controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function sendConnectionRequest(req, res) {
  try {
    const requesterId = req.user?.id || req.body.user_id;
    const receiverId = req.params.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required',
      });
    }

    const result = await networkService.sendConnectionRequestService(
      requesterId,
      receiverId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Send connection request controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function acceptConnectionRequest(req, res) {
  try {
    const receiverId = req.user?.id || req.body.user_id;
    const requestId = req.params.requestId;

    if (!receiverId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const result = await networkService.acceptConnectionRequestService(
      requestId,
      receiverId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Accept connection request controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function rejectConnectionRequest(req, res) {
  try {
    const receiverId = req.user?.id || req.body.user_id;
    const requestId = req.params.requestId;

    if (!receiverId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const result = await networkService.rejectConnectionRequestService(
      requestId,
      receiverId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Reject connection request controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getConnectionRequests(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await networkService.getConnectionRequestsService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get connection requests controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function checkConnectionRequestStatus(req, res) {
  try {
    const requesterId = req.user?.id || req.query.requester_id;
    const receiverId = req.params.userId;

    if (!requesterId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Requester ID and Receiver ID are required',
      });
    }

    const result = await networkService.checkConnectionRequestStatusService(
      requesterId,
      receiverId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Check connection request status controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowCounts,
  isFollowing,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  checkConnectionRequestStatus,
};
