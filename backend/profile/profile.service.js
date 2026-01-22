const profileModel = require('./profile.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

async function getUserProfileService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const profile = await profileModel.getUserProfile(userId);

    if (!profile) {
      return {
        userId,
        fullName: null,
        profileImage: null,
        coverImage: null,
        bio: null,
        education: null,
        city: null,
        primarySport: null,
        sportsPlayed: null,
        dob: null,
      };
    }

    // Process sports_played (list of all sports) - separate from primary_sport
    let sportsPlayed = null;
    if (profile.sports_played) {
      console.log('Processing sports_played from database:', {
        raw: profile.sports_played,
        type: typeof profile.sports_played,
        isArray: Array.isArray(profile.sports_played),
        primary_sport: profile.primary_sport, // Log to verify they're different
      });
      
      if (Array.isArray(profile.sports_played)) {
        // PostgreSQL array - join all sports with comma and space
        sportsPlayed = profile.sports_played.filter(Boolean).join(', ');
        console.log('Converted array to string:', sportsPlayed);
      } else if (typeof profile.sports_played === 'string') {
        let sportsString = profile.sports_played.trim();
        // Handle PostgreSQL array string format: {sport1,sport2,sport3}
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        // Remove quotes and split by comma
        sportsString = sportsString.replace(/["']/g, '');
        // Split by comma and rejoin to ensure proper formatting
        const sportsArray = sportsString.split(',').map(s => s.trim()).filter(Boolean);
        sportsPlayed = sportsArray.join(', ');
        console.log('Processed string array:', { 
          original: profile.sports_played, 
          processed: sportsPlayed, 
          array: sportsArray,
          count: sportsArray.length,
        });
      }
    } else {
      console.log('No sports_played in profile data (this is OK - user may not have set sports yet)');
    }

    // IMPORTANT: Keep primary_sport and sports_played separate
    // primary_sport is a single sport, sports_played is a list of all sports
    // Convert S3 keys to presigned URLs for images
    const profileImage = profile.profile_image_url 
      ? await convertKeyToPresignedUrl(profile.profile_image_url) 
      : null;
    const coverImage = profile.cover_image_url 
      ? await convertKeyToPresignedUrl(profile.cover_image_url) 
      : null;

    const result = {
      userId: profile.user_id,
      fullName: profile.full_name || null,
      profileImage: profileImage,
      coverImage: coverImage,
      bio: profile.bio || null,
      education: profile.education || null,
      city: profile.city || null,
      primarySport: profile.primary_sport || null, // Single sport
      sportsPlayed: sportsPlayed, // List of all sports (comma-separated)
      dob: profile.dob || null,
      userType: profile.user_type || null,
    };
    
    console.log('Service: Returning profile data:', {
      primarySport: result.primarySport,
      sportsPlayed: result.sportsPlayed,
      areTheyDifferent: result.primarySport !== result.sportsPlayed,
      sportsPlayedIsArray: Array.isArray(profile.sports_played),
    });
    
    return result;
  } catch (error) {
    console.error('Get user profile service error:', error.message);
    throw error;
  }
}

async function upsertUserProfileService(userId, profileData) {
  try {
    console.log('=== SERVICE: upsertUserProfileService ===');
    console.log('UserId:', userId);
    console.log('ProfileData:', JSON.stringify(profileData, null, 2));

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!profileData || Object.keys(profileData).length === 0) {
      console.log('WARNING: No profile data provided');
    }

    const updatedProfile = await profileModel.upsertUserProfile(
      userId,
      profileData
    );

    let sportsPlayed = null;
    if (updatedProfile.sports_played) {
      console.log('upsertUserProfileService: Processing sports_played from updated profile:', {
        raw: updatedProfile.sports_played,
        type: typeof updatedProfile.sports_played,
        isArray: Array.isArray(updatedProfile.sports_played),
      });
      
      if (Array.isArray(updatedProfile.sports_played)) {
        // PostgreSQL array - join all sports with comma and space
        sportsPlayed = updatedProfile.sports_played.filter(Boolean).join(', ');
        console.log('upsertUserProfileService: Converted array to string:', sportsPlayed);
      } else if (typeof updatedProfile.sports_played === 'string') {
        let sportsString = updatedProfile.sports_played.trim();
        // Handle PostgreSQL array string format: {sport1,sport2,sport3}
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        // Remove quotes and split by comma
        sportsString = sportsString.replace(/["']/g, '');
        // Split by comma and rejoin to ensure proper formatting
        const sportsArray = sportsString.split(',').map(s => s.trim()).filter(Boolean);
        sportsPlayed = sportsArray.join(', ');
        console.log('upsertUserProfileService: Processed string array:', { original: updatedProfile.sports_played, processed: sportsPlayed, array: sportsArray });
      }
    } else {
      console.log('upsertUserProfileService: No sports_played in updated profile');
    }

    console.log('Service: Profile updated successfully');
    // Convert S3 keys to presigned URLs for images
    const profileImage = updatedProfile.profile_image_url 
      ? await convertKeyToPresignedUrl(updatedProfile.profile_image_url) 
      : null;
    const coverImage = updatedProfile.cover_image_url 
      ? await convertKeyToPresignedUrl(updatedProfile.cover_image_url) 
      : null;

    return {
      success: true,
      message: 'Profile saved successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: profileImage,
        coverImage: coverImage,
        bio: updatedProfile.bio,
        education: updatedProfile.education,
        city: updatedProfile.city,
        primarySport: updatedProfile.primary_sport,
        sportsPlayed: sportsPlayed,
      },
    };
  } catch (error) {
    console.error('=== SERVICE ERROR: upsertUserProfileService ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

async function updateProfileImagesService(userId, imageData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get current profile to get old image URLs before updating
    const currentProfile = await profileModel.getCurrentUserProfile(userId);
    const oldProfileImageUrl = currentProfile?.profile_url;
    const oldCoverImageUrl = currentProfile?.cover_url;

    const updatedProfile = await profileModel.updateProfileImages(
      userId,
      imageData
    );

    // Delete old images from S3 if they exist and are being replaced
    const { deleteFromS3 } = require('../utils/s3');
    
    if (imageData.profileImageUrl !== undefined && oldProfileImageUrl && oldProfileImageUrl !== imageData.profileImageUrl) {
      try {
        await deleteFromS3(oldProfileImageUrl);
        console.log('Deleted old profile image from S3:', oldProfileImageUrl);
      } catch (s3Error) {
        // Log error but continue
        console.error('Error deleting old profile image from S3:', s3Error.message);
      }
    }

    if (imageData.coverImageUrl !== undefined && oldCoverImageUrl && oldCoverImageUrl !== imageData.coverImageUrl) {
      try {
        await deleteFromS3(oldCoverImageUrl);
        console.log('Deleted old cover image from S3:', oldCoverImageUrl);
      } catch (s3Error) {
        // Log error but continue
        console.error('Error deleting old cover image from S3:', s3Error.message);
      }
    }

    // Convert S3 keys to presigned URLs for images
    const profileImage = updatedProfile.profile_image_url 
      ? await convertKeyToPresignedUrl(updatedProfile.profile_image_url) 
      : null;
    const coverImage = updatedProfile.cover_image_url 
      ? await convertKeyToPresignedUrl(updatedProfile.cover_image_url) 
      : null;

    return {
      success: true,
      message: 'Profile images updated successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: profileImage,
        coverImage: coverImage,
      },
    };
  } catch (error) {
    console.error('Update profile images service error:', error.message);
    throw error;
  }
}

async function getCurrentUserProfileService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await profileModel.getCurrentUserProfile(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Format sports played similar to getUserProfileService
    let sportsPlayed = null;
    if (user.sports_played) {
      if (Array.isArray(user.sports_played)) {
        sportsPlayed = user.sports_played.join(', ');
      } else if (typeof user.sports_played === 'string') {
        let sportsString = user.sports_played;
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayed = sportsString;
      }
    }

    // Convert S3 keys to presigned URLs for images
    const profileUrl = user.profile_url 
      ? await convertKeyToPresignedUrl(user.profile_url) 
      : null;
    const coverUrl = user.cover_url 
      ? await convertKeyToPresignedUrl(user.cover_url) 
      : null;

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || null,
        username: user.username || null,
        full_name: user.full_name || null,
        profile_url: profileUrl,
        cover_url: coverUrl,
        bio: user.bio || null,
        education: user.education || null,
        city: user.city || null,
        primary_sport: user.primary_sport || null,
        sports_played: sportsPlayed,
        dob: user.dob || null,
        user_type: user.user_type || null,
      },
    };
  } catch (error) {
    console.error('Get current user profile service error:', error.message);
    throw error;
  }
}

/**
 * Get user profile with athletic performance and sports with IDs (optimized for stats page)
 * Combines user data, athletic performance, and sports in a single API call
 * @param {string} userId - User ID
 * @param {string} activeSport - Optional active sport to filter athletic performance
 * @returns {Promise<object>} Combined user data with athletic performance and sports
 */
async function getUserProfileWithStatsService(userId, activeSport = null) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const combinedData = await profileModel.getUserProfileWithStats(userId, activeSport);

    if (!combinedData) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Process sports_played for display
    let sportsPlayed = null;
    if (combinedData.sports_played_array && combinedData.sports_played_array.length > 0) {
      sportsPlayed = combinedData.sports_played_array.join(', ');
    }

    // Convert S3 keys to presigned URLs for images
    const profileUrl = combinedData.profile_image_url 
      ? await convertKeyToPresignedUrl(combinedData.profile_image_url) 
      : null;
    const coverUrl = combinedData.cover_image_url 
      ? await convertKeyToPresignedUrl(combinedData.cover_image_url) 
      : null;

    return {
      success: true,
      user: {
        id: combinedData.user_id,
        full_name: combinedData.full_name,
        profile_url: profileUrl,
        cover_url: coverUrl,
        bio: combinedData.bio,
        education: combinedData.education,
        city: combinedData.city,
        primary_sport: combinedData.primary_sport,
        sports_played: sportsPlayed,
        dob: combinedData.dob,
        user_type: combinedData.user_type || null,
      },
      athleticPerformance: combinedData.athletic_performance ? {
        id: combinedData.athletic_performance.id,
        height: combinedData.athletic_performance.height,
        weight: combinedData.athletic_performance.weight,
        hand: combinedData.athletic_performance.hand,
        arm: combinedData.athletic_performance.arm,
        jerseyNumber: combinedData.athletic_performance.jerseyNumber,
        sport: combinedData.athletic_performance.sport,
      } : null,
      sports: combinedData.sports || [], // Array of { id, name }
    };
  } catch (error) {
    console.error('Get user profile with stats service error:', error.message);
    throw error;
  }
}

/**
 * Get complete user profile with all sections (ultra-optimized - 2 queries max)
 * @param {string} userId - User ID
 * @param {string} currentUserId - Current logged-in user ID (optional)
 * @returns {Promise<object>} Complete profile data
 */
async function getUserProfileCompleteService(userId, currentUserId = null) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Execute both queries in parallel for maximum speed
    const [completeData, posts] = await Promise.all([
      profileModel.getUserProfileComplete(userId, currentUserId),
      profileModel.getUserPosts(userId, 50)
    ]);

    // Convert S3 keys to presigned URLs for posts
    const postsWithPresignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.user_profile_url) {
          post.user_profile_url = await convertKeyToPresignedUrl(post.user_profile_url);
        }
        if (post.media_url) {
          post.media_url = await convertKeyToPresignedUrl(post.media_url);
        }
        return post;
      })
    );

    if (!completeData) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Transform all arrays from snake_case to camelCase for frontend compatibility
    // Convert S3 keys to presigned URLs for PDFs
    const transformAchievements = async (arr) => {
      if (!Array.isArray(arr)) return [];
      return Promise.all(
        arr.map(async (item) => {
          const mediaPdf = item.media_pdf 
            ? await convertKeyToPresignedUrl(item.media_pdf)
            : null;
          return {
            id: item.id,
            title: item.title,
            organization: item.organization,
            dateAwarded: item.date_awarded,
            sport: item.sport,
            positionEvent: item.position_event,
            achievementType: item.achievement_type,
            level: item.level,
            location: item.location,
            description: item.description,
            mediaPdf: mediaPdf,
          };
        })
      );
    };

    const transformCompetitionClubs = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        clubOrTravelTeamName: item.club_or_travel_team_name,
        teamLevel: item.team_level,
        leagueOrOrganizationName: item.league_or_organization_name,
        tournamentParticipation: item.tournament_participation,
      }));
    };

    const transformCharacterLeadership = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        teamCaptain: item.team_captain,
        leadershipRoles: item.leadership_roles,
        languagesSpoken: Array.isArray(item.languages_spoken) 
          ? item.languages_spoken 
          : item.languages_spoken ? [item.languages_spoken] : [],
        communityService: item.community_service,
      }));
    };

    const transformHealthReadiness = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        injuryHistory: item.injury_history,
        restingHeartRate: item.resting_heart_rate,
        enduranceMetric: item.endurance_metric,
      }));
    };

    const transformVideoMedia = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        highlightVideoLink: item.highlight_video_link,
        videoStatus: item.video_status,
        verifiedMediaProfile: item.verified_media_profile,
      }));
    };

    const transformAcademicBackgrounds = async (arr) => {
      if (!Array.isArray(arr)) return [];
      return Promise.all(
        arr.map(async (item) => {
          const degreePdf = item.degree_pdf 
            ? await convertKeyToPresignedUrl(item.degree_pdf)
            : null;
          return {
            id: item.id,
            school: item.school,
            degree: item.degree,
            qualification: item.qualification,
            startDate: item.start_date,
            endDate: item.end_date,
            degreePdf: degreePdf,
            academicGpa: item.academic_gpa,
            satActScore: item.sat_act_score,
            academicHonors: item.academic_honors,
            collegeEligibilityStatus: item.college_eligibility_status,
            graduationYear: item.graduation_year,
            primaryStateRegion: item.primary_state_region,
            preferredCollegeRegions: item.preferred_college_regions,
            willingnessToRelocate: item.willingness_to_relocate,
            gender: item.gender,
          };
        })
      );
    };

    const transformAthleticPerformance = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        height: item.height,
        weight: item.weight,
        sport: item.sport,
        athleteHandedness: item.athlete_handedness,
        dominantSideOrFoot: item.dominant_side_or_foot,
        jerseyNumber: item.jersey_number,
        trainingHoursPerWeek: item.training_hours_per_week,
        multiSportAthlete: item.multi_sport_athlete,
        coachVerifiedProfile: item.coach_verified_profile,
        hand: item.hand,
        arm: item.arm,
      }));
    };

    // Convert S3 keys to presigned URLs for profile images
    const profileImage = completeData.user.profileImage 
      ? await convertKeyToPresignedUrl(completeData.user.profileImage) 
      : null;
    const coverImage = completeData.user.coverImage 
      ? await convertKeyToPresignedUrl(completeData.user.coverImage) 
      : null;

    // Transform arrays (PDFs will be converted to presigned URLs)
    const [
      academicBackgrounds,
      achievements,
      athleticPerformance,
      competitionClubs,
      characterLeadership,
      healthReadiness,
      videoMedia
    ] = await Promise.all([
      transformAcademicBackgrounds(completeData.academicBackgrounds),
      transformAchievements(completeData.achievements),
      Promise.resolve(transformAthleticPerformance(completeData.athleticPerformance)),
      Promise.resolve(transformCompetitionClubs(completeData.competitionClubs)),
      Promise.resolve(transformCharacterLeadership(completeData.characterLeadership)),
      Promise.resolve(transformHealthReadiness(completeData.healthReadiness)),
      Promise.resolve(transformVideoMedia(completeData.videoMedia))
    ]);

    return {
      success: true,
      profile: {
        ...completeData.user,
        profileImage: profileImage,
        coverImage: coverImage,
      },
      followCounts: completeData.followCounts,
      connectionStatus: completeData.connectionStatus,
      socialHandles: completeData.socialHandles || [],
      academicBackgrounds: academicBackgrounds,
      achievements: achievements,
      athleticPerformance: athleticPerformance,
      competitionClubs: competitionClubs,
      characterLeadership: characterLeadership,
      healthReadiness: healthReadiness,
      videoMedia: videoMedia,
      posts: postsWithPresignedUrls
    };
  } catch (error) {
    console.error('Get user profile complete service error:', error.message);
    throw error;
  }
}

module.exports = {
  getUserProfileService,
  upsertUserProfileService,
  updateProfileImagesService,
  getCurrentUserProfileService,
  getUserProfileWithStatsService,
  getUserProfileCompleteService,
};
