const profileModel = require('./profile.model');

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
    const result = {
      userId: profile.user_id,
      fullName: profile.full_name || null,
      profileImage: profile.profile_image_url || null,
      coverImage: profile.cover_image_url || null,
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
    return {
      success: true,
      message: 'Profile saved successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: updatedProfile.profile_image_url,
        coverImage: updatedProfile.cover_image_url,
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

    const updatedProfile = await profileModel.updateProfileImages(
      userId,
      imageData
    );

    return {
      success: true,
      message: 'Profile images updated successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: updatedProfile.profile_image_url,
        coverImage: updatedProfile.cover_image_url,
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

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || null,
        username: user.username || null,
        full_name: user.full_name || null,
        profile_url: user.profile_url || null,
        cover_url: user.cover_url || null,
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

    return {
      success: true,
      user: {
        id: combinedData.user_id,
        full_name: combinedData.full_name,
        profile_url: combinedData.profile_image_url,
        cover_url: combinedData.cover_image_url,
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

    if (!completeData) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Transform all arrays from snake_case to camelCase for frontend compatibility
    const transformAchievements = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
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
        mediaPdf: item.media_pdf,
      }));
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

    const transformAcademicBackgrounds = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => ({
        id: item.id,
        school: item.school,
        degree: item.degree,
        qualification: item.qualification,
        startDate: item.start_date,
        endDate: item.end_date,
        degreePdf: item.degree_pdf,
        academicGpa: item.academic_gpa,
        satActScore: item.sat_act_score,
        academicHonors: item.academic_honors,
        collegeEligibilityStatus: item.college_eligibility_status,
        graduationYear: item.graduation_year,
        primaryStateRegion: item.primary_state_region,
        preferredCollegeRegions: item.preferred_college_regions,
        willingnessToRelocate: item.willingness_to_relocate,
        gender: item.gender,
      }));
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

    return {
      success: true,
      profile: completeData.user,
      followCounts: completeData.followCounts,
      connectionStatus: completeData.connectionStatus,
      socialHandles: completeData.socialHandles || [],
      academicBackgrounds: transformAcademicBackgrounds(completeData.academicBackgrounds),
      achievements: transformAchievements(completeData.achievements),
      athleticPerformance: transformAthleticPerformance(completeData.athleticPerformance),
      competitionClubs: transformCompetitionClubs(completeData.competitionClubs),
      characterLeadership: transformCharacterLeadership(completeData.characterLeadership),
      healthReadiness: transformHealthReadiness(completeData.healthReadiness),
      videoMedia: transformVideoMedia(completeData.videoMedia),
      posts: posts
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
