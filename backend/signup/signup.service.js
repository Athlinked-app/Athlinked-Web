const signupModel = require('./signup.model');
const { hashPassword } = require('../utils/hash');
const { startOTPFlow, verifyOTP } = require('./otp.service');
const { sendOTPEmail, sendParentSignupLink } = require('../utils/email');
const profileModel = require('../profile/profile.model');
const refreshTokensService = require('../auth/refresh-tokens.service');

/**
 * Check if string is an email
 * @param {string} str - String to check
 * @returns {boolean} True if email, false otherwise
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Start signup process: validate email/username, generate and send OTP
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Service result
 */
async function startSignupService(userData) {
  try {
    if (!userData.email) {
      throw new Error('Email or username is required');
    }

    const input = userData.email.trim();
    let emailToSendOTP;
    let username = null;
    let parentEmail = null;

    if (isEmail(input)) {
      emailToSendOTP = input.toLowerCase();
      const existingUser = await signupModel.findByEmail(emailToSendOTP);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      parentEmail = userData.parent_email;
    } else {
      if (input.length < 6) {
        throw new Error('Username must be at least 6 characters long');
      }

      username = input.toLowerCase();

      const existingUser = await signupModel.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already taken');
      }

      parentEmail = userData.parent_email;
      if (!parentEmail) {
        throw new Error('Parent email is required when using username');
      }

      emailToSendOTP = parentEmail.toLowerCase().trim();
    }

    const otpData = isEmail(input)
      ? { ...userData, email: emailToSendOTP }
      : {
          ...userData,
          email: emailToSendOTP,
          username: username,
          _isUsernameSignup: true,
        };

    const otp = startOTPFlow(otpData);

    await sendOTPEmail(emailToSendOTP, otp);

    if (parentEmail) {
      // Check if parent account already exists
      const existingParent = await signupModel.findByEmail(parentEmail.toLowerCase().trim());
      
      if (existingParent && existingParent.user_type === 'parent') {
        console.log(
          `ℹ️ Parent account already exists for ${parentEmail}, skipping parent signup email`
        );
      } else {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const signupLink = username
          ? `${baseUrl}/parent-signup?username=${encodeURIComponent(username)}`
          : `${baseUrl}/parent-signup?email=${encodeURIComponent(input.toLowerCase())}`;

        console.log(
          `📧 Attempting to send parent signup link to: ${parentEmail}`
        );
        try {
          await sendParentSignupLink(parentEmail, username || input, signupLink);
        } catch (error) {
          console.error('❌ Error: Failed to send parent signup link:', error);
          console.error('Error details:', error.message, error.stack);
        }
      }
    } else {
    }

    return {
      success: true,
      message: 'OTP sent to email',
      email: emailToSendOTP,
    };
  } catch (error) {
    console.error('Start signup service error:', error.message);
    throw error;
  }
}

/**
 * Verify OTP and create user account
 * @param {string} email - User email (this should be the parent email when username was used)
 * @param {string} otp - User-entered OTP
 * @returns {Promise<object>} Service result with user data
 */
async function verifyOtpService(email, otp) {
  try {
    const verification = verifyOTP(email.toLowerCase(), otp);

    if (!verification.isValid) {
      const error = new Error(verification.error);
      error.errorType = verification.errorType;
      throw error;
    }

    const { signupData } = verification;

    const hashedPassword = await hashPassword(signupData.password);

    const userDataToCreate = {
      ...signupData,
      password: hashedPassword,
    };

    // Normalize parent_email if it exists
    if (userDataToCreate.parent_email) {
      userDataToCreate.parent_email = userDataToCreate.parent_email.toLowerCase().trim();
      console.log('Creating user with parent_email:', userDataToCreate.parent_email);
    }

    if (signupData.username || signupData._isUsernameSignup) {
      userDataToCreate.email = null;
      delete userDataToCreate._isUsernameSignup;
    }

    const createdUser = await signupModel.createUser(userDataToCreate);
    
    // Verify parent_email was saved correctly
    if (userDataToCreate.parent_email) {
      const verifyUser = createdUser.email
        ? await signupModel.findByEmail(createdUser.email)
        : createdUser.username
          ? await signupModel.findByUsername(createdUser.username)
          : null;
      
      if (verifyUser) {
        console.log('User created - parent_email verification:', {
          userId: createdUser.id,
          requested_parent_email: userDataToCreate.parent_email,
          saved_parent_email: verifyUser.parent_email,
          match: verifyUser.parent_email?.toLowerCase().trim() === userDataToCreate.parent_email,
        });
      }
    }

    const completeUser = createdUser.email
      ? await signupModel.findByEmail(createdUser.email)
      : createdUser.username
        ? await signupModel.findByUsername(createdUser.username)
        : null;

    // Create profile entry with sports data
    try {
      const sportsArray = Array.isArray(signupData.sports_played)
        ? signupData.sports_played
        : signupData.sports_played
          ? [signupData.sports_played]
          : [];

      // Remove duplicates from sports array
      const uniqueSportsArray = [...new Set(sportsArray)];
      const primarySport =
        signupData.primary_sport ||
        (uniqueSportsArray.length > 0 ? uniqueSportsArray[0] : null);

      await profileModel.upsertUserProfile(createdUser.id, {
        fullName: signupData.full_name,
        primarySport: primarySport,
      });

      // deduplicated sports stored in profile; no local use needed
    } catch (profileError) {
      console.error(
        '⚠️ Error creating profile during signup:',
        profileError.message
      );
      // Don't fail signup if profile creation fails
    }

    const userData = {
      id: createdUser.id,
      email: createdUser.email || null,
      username: createdUser.username || null,
      full_name: createdUser.full_name,
      user_type: createdUser.user_type,
      primary_sport: completeUser?.primary_sport || null,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } =
      await refreshTokensService.createTokenPair(userData);

    return {
      success: true,
      message: 'Welcome',
      accessToken,
      refreshToken,
      user: userData,
    };
  } catch (error) {
    console.error('Verify OTP service error:', error.message);
    throw error;
  }
}

/**
 * Complete parent signup by creating a new parent user account
 * @param {string} username - Child's username (optional)
 * @param {string} email - Child's email (optional)
 * @param {string} password - Plain text password for parent
 * @returns {Promise<object>} Service result
 */
async function parentCompleteService(username, email, password) {
  try {
    let childUser;

    if (username) {
      childUser = await signupModel.findByUsername(
        username.toLowerCase().trim()
      );
      // username is used to find the childUser above
    } else if (email) {
      childUser = await signupModel.findByEmail(email.toLowerCase().trim());
      // email is used to find the childUser above
    } else {
      throw new Error('Username or email is required');
    }

    if (!childUser) {
      throw new Error('Child user not found');
    }

    const parentEmail = childUser.parent_email;
    const parentName = childUser.parent_name;

    if (!parentEmail) {
      throw new Error('Parent email not found in child record');
    }

    const existingUser = await signupModel.findByEmail(
      parentEmail.toLowerCase().trim()
    );
    if (existingUser) {
      if (existingUser.user_type === 'parent') {
        throw new Error('Parent account already exists');
      }
      throw new Error('This email is already registered');
    }

    const hashedPassword = await hashPassword(password);

    const newParentUser = await signupModel.createUser({
      user_type: 'parent',
      full_name: parentName || 'Parent',
      dob: null,
      sports_played: null,
      primary_sport: null,
      email: parentEmail.toLowerCase().trim(),
      username: null,
      password: hashedPassword,
      parent_name: null,
      parent_email: null,
      parent_dob: null,
    });

    const userData = {
      id: newParentUser.id,
      email: newParentUser.email,
      full_name: newParentUser.full_name,
      user_type: newParentUser.user_type,
    };

    // Generate JWT token
    const { generateToken } = require('../utils/jwt');
    const token = generateToken(userData);

    return {
      success: true,
      message: 'Parent account created successfully',
      token,
      user: userData,
    };
  } catch (error) {
    console.error('Parent complete service error:', error.message);
    throw error;
  }
}

/**
 * Get all users service
 * @param {string} excludeUserId - User ID to exclude from results
 * @param {number} limit - Maximum number of users to return
 * @param {string} currentUserId - Optional current user ID to check follow status
 * @returns {Promise<object>} Service result with users array including isFollowing status
 */
async function getAllUsersService(excludeUserId = null, limit = 10, currentUserId = null) {
  try {
    const users = await signupModel.getAllUsers(excludeUserId, limit, currentUserId);

    // Remove password from all users (produce shallow copies)
    // Also convert is_following to isFollowing (camelCase) for frontend consistency
    const sanitizedUsers = users.map(user => {
      const copy = { ...user };
      delete copy.password;
      // Convert is_following (snake_case from DB) to isFollowing (camelCase)
      if ('is_following' in copy) {
        copy.isFollowing = copy.is_following;
        delete copy.is_following;
      }
      return copy;
    });

    return {
      success: true,
      users: sanitizedUsers,
    };
  } catch (error) {
    console.error('Get all users service error:', error.message);
    throw error;
  }
}

/**
 * Get children for a parent by parent email
 * @param {string} parentEmail - Parent's email address
 * @returns {Promise<object>} Service result with children array
 */
async function getChildrenByParentEmailService(parentEmail) {
  try {
    if (!parentEmail) {
      throw new Error('Parent email is required');
    }

    const children = await signupModel.getChildrenByParentEmail(parentEmail);

    // Remove password from all children (produce shallow copies)
    const sanitizedChildren = children.map(child => {
      const copy = { ...child };
      delete copy.password;
      return copy;
    });

    return {
      success: true,
      children: sanitizedChildren,
    };
  } catch (error) {
    console.error('Get children service error:', error.message);
    throw error;
  }
}

/**
 * Delete user account
 * @param {string} userId - User ID to delete
 * @returns {Promise<object>} Service result
 */
async function deleteAccountService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await signupModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store deleted account information before deletion
    const deletedAccountsModel = require('./deleted-accounts.model');
    try {
      await deletedAccountsModel.storeDeletedAccount({
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        user_type: user.user_type,
        deleted_at: new Date(),
      });
    } catch (storeError) {
      console.error('Error storing deleted account data:', storeError);
      // Continue with deletion even if storing fails
    }

    // Delete user from database
    const deleted = await signupModel.deleteUser(userId);

    if (!deleted) {
      throw new Error('Failed to delete user account');
    }

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Delete account service error:', error.message);
    throw error;
  }
}

/**
 * Get all activities (posts, clips, articles) for parent's children
 * @param {string} parentEmail - Parent's email address
 * @returns {Promise<object>} Service result with activities grouped by athlete
 */
async function getChildrenActivitiesService(parentEmail) {
  try {
    if (!parentEmail) {
      throw new Error('Parent email is required');
    }

    console.log('getChildrenActivitiesService - Starting with parentEmail:', parentEmail);
    
    // Get all children
    const children = await signupModel.getChildrenByParentEmail(parentEmail.toLowerCase().trim());
    console.log('getChildrenActivitiesService - Found children:', children?.length || 0);
    
    // Handle case where children is not an array or is empty
    if (!Array.isArray(children) || children.length === 0) {
      return {
        success: true,
        activities: {},
      };
    }

    const childrenIds = children.map(child => child.id).filter(id => id); // Filter out any null/undefined IDs
    
    // Get activities for all children in parallel
    const postsModel = require('../profile/profile.model');
    const clipsModel = require('../clips/clips.model');
    const articlesModel = require('../articles/articles.model');
    const videosModel = require('../videos/videos.model');
    const templatesModel = require('../templates/templates.model');
    const resourcesModel = require('../resources/resources.model');
    
    // Fetch all activities in parallel for all children
    const activityPromises = childrenIds.map(async (childId) => {
      try {
        // Wrap each call in a try-catch to handle individual errors
        let posts = [];
        let clips = [];
        let articles = [];
        let videos = [];
        let templates = [];
        let resources = [];
        
        try {
          posts = await postsModel.getUserPosts(childId, 50);
          if (!Array.isArray(posts)) posts = [];
          console.log(`getChildrenActivitiesService - Fetched ${posts.length} posts for child ${childId}`);
        } catch (err) {
          console.error(`Error fetching posts for child ${childId}:`, err.message || err);
          console.error(`Error stack:`, err.stack);
          posts = [];
        }
        
        try {
          clips = await clipsModel.getClipsByUserId(childId, 50);
          if (!Array.isArray(clips)) clips = [];
        } catch (err) {
          console.error(`Error fetching clips for child ${childId}:`, err.message || err);
          clips = [];
        }
        
        try {
          articles = await articlesModel.getAllArticles(childId);
          if (!Array.isArray(articles)) articles = [];
        } catch (err) {
          console.error(`Error fetching articles for child ${childId}:`, err.message || err);
          articles = [];
        }
        
        try {
          videos = await videosModel.getAllVideos(childId);
          if (!Array.isArray(videos)) videos = [];
        } catch (err) {
          console.error(`Error fetching videos for child ${childId}:`, err.message || err);
          videos = [];
        }
        
        try {
          templates = await templatesModel.getAllTemplates(childId);
          if (!Array.isArray(templates)) templates = [];
        } catch (err) {
          console.error(`Error fetching templates for child ${childId}:`, err.message || err);
          templates = [];
        }
        
        // Fetch resources (videos and templates from resources page)
        try {
          resources = await resourcesModel.getAllResources(childId);
          if (!Array.isArray(resources)) resources = [];
          
          // Separate resources into videos and templates
          const resourceVideos = resources.filter(r => r.resource_type === 'video' || r.video_url);
          const resourceTemplates = resources.filter(r => r.resource_type === 'template' || r.file_url);
          
          // Merge with existing videos and templates
          videos = [...videos, ...resourceVideos];
          templates = [...templates, ...resourceTemplates];
        } catch (err) {
          console.error(`Error fetching resources for child ${childId}:`, err.message || err);
        }
        
        return {
          athleteId: childId,
          posts: posts || [],
          clips: clips || [],
          articles: articles || [],
          videos: videos || [],
          templates: templates || [],
        };
      } catch (error) {
        console.error(`Error processing activities for child ${childId}:`, error.message || error);
        console.error(`Error stack:`, error.stack);
        // Return empty activities for this child if there's an error
        return {
          athleteId: childId,
          posts: [],
          clips: [],
          articles: [],
        };
      }
    });
    
    const activitiesResults = await Promise.all(activityPromises);
    
    // Group activities by athlete ID
    const activities = {};
    activitiesResults.forEach(result => {
      activities[result.athleteId] = {
        posts: result.posts || [],
        clips: result.clips || [],
        articles: result.articles || [],
        videos: result.videos || [],
        templates: result.templates || [],
      };
      console.log(`getChildrenActivitiesService - Activities for ${result.athleteId}:`, {
        posts: result.posts?.length || 0,
        clips: result.clips?.length || 0,
        articles: result.articles?.length || 0,
        videos: result.videos?.length || 0,
        templates: result.templates?.length || 0,
      });
    });

    console.log('getChildrenActivitiesService - Returning activities for', Object.keys(activities).length, 'children');
    return {
      success: true,
      activities,
    };
  } catch (error) {
    console.error('Get children activities service error:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  startSignupService,
  verifyOtpService,
  parentCompleteService,
  getAllUsersService,
  getChildrenByParentEmailService,
  getChildrenActivitiesService,
  deleteAccountService,
};
