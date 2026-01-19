# Profile Page Optimization - Ultra Efficient (Minimal DB Queries)

## 🎯 Goal

**Reduce to 1-2 database queries** using PostgreSQL JSON aggregation and subqueries, while maintaining speed.

---

## 📊 Current vs Optimized

### Current Approach (12+ queries):
- 1 query: User data
- 1 query: Follow counts
- 1 query: Connection status
- 8 queries: Profile sections (one per section)
- 1 query: Posts
- **Total: 12+ database queries**

### Optimized Approach (1-2 queries):
- 1 query: User + Follow counts + Connection status + All profile sections (using JSON aggregation)
- 1 query: Posts (optional, can be combined if needed)
- **Total: 1-2 database queries**

---

## 🔧 Optimized Implementation

### Backend: `backend/profile/profile.model.js`

**ADD** ultra-optimized function using PostgreSQL JSON functions:

```javascript
/**
 * Get complete user profile with all sections using minimal database queries
 * Uses PostgreSQL JSON aggregation to combine all data in 1-2 queries
 * @param {string} userId - User ID
 * @param {string} currentUserId - Current logged-in user ID (optional)
 * @returns {Promise<object|null>} Complete profile data
 */
async function getUserProfileComplete(userId, currentUserId = null) {
  try {
    // SINGLE QUERY using JSON aggregation and subqueries
    const completeQuery = `
      WITH user_data AS (
        SELECT 
          u.id as user_id,
          u.full_name,
          u.profile_url as profile_image_url,
          u.cover_url as cover_image_url,
          u.bio,
          u.education,
          u.city,
          u.primary_sport,
          u.sports_played,
          u.dob,
          u.user_type,
          u.username,
          u.email,
          -- Follow counts as subqueries
          (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
          (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
          -- Connection status as subquery (if viewing another user)
          ${currentUserId && currentUserId !== userId ? `
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM user_connections 
                WHERE (user_id_1 = $2 AND user_id_2 = u.id) 
                OR (user_id_1 = u.id AND user_id_2 = $2)
              ) THEN 'connected'
              WHEN EXISTS (
                SELECT 1 FROM connection_requests 
                WHERE requester_id = $2 AND receiver_id = u.id AND status = 'pending'
              ) THEN 'pending'
              WHEN EXISTS (
                SELECT 1 FROM connection_requests 
                WHERE requester_id = u.id AND receiver_id = $2 AND status = 'pending'
              ) THEN 'received'
              ELSE NULL
            END as connection_status
          ` : 'NULL as connection_status'}
        FROM users u
        WHERE u.id = $1
      ),
      profile_sections AS (
        SELECT 
          -- Social Handles as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'platform', platform,
              'url', url,
              'created_at', created_at,
              'updated_at', updated_at
            )) FROM social_handles WHERE user_id = $1),
            '[]'::json
          ) as social_handles,
          
          -- Academic Backgrounds as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'school', school,
              'degree', degree,
              'qualification', qualification,
              'start_date', start_date,
              'end_date', end_date,
              'degree_pdf', degree_pdf,
              'academic_gpa', academic_gpa,
              'sat_act_score', sat_act_score,
              'academic_honors', academic_honors,
              'college_eligibility_status', college_eligibility_status,
              'graduation_year', graduation_year,
              'primary_state_region', primary_state_region,
              'preferred_college_regions', preferred_college_regions,
              'willingness_to_relocate', willingness_to_relocate,
              'gender', gender,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM academic_backgrounds WHERE user_id = $1),
            '[]'::json
          ) as academic_backgrounds,
          
          -- Achievements as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'title', title,
              'description', description,
              'date', date,
              'media_pdf', media_pdf,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM achievements WHERE user_id = $1),
            '[]'::json
          ) as achievements,
          
          -- Athletic Performance as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'height', height,
              'weight', weight,
              'sport', sport,
              'athlete_handedness', athlete_handedness,
              'dominant_side_or_foot', dominant_side_or_foot,
              'jersey_number', jersey_number,
              'training_hours_per_week', training_hours_per_week,
              'multi_sport_athlete', multi_sport_athlete,
              'coach_verified_profile', coach_verified_profile,
              'hand', hand,
              'arm', arm,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM athletic_performance WHERE user_id = $1),
            '[]'::json
          ) as athletic_performance,
          
          -- Competition Clubs as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'club_name', club_name,
              'position', position,
              'start_date', start_date,
              'end_date', end_date,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM competition_clubs WHERE user_id = $1),
            '[]'::json
          ) as competition_clubs,
          
          -- Character Leadership as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'title', title,
              'description', description,
              'date', date,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM character_leadership WHERE user_id = $1),
            '[]'::json
          ) as character_leadership,
          
          -- Health Readiness as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'condition', condition,
              'notes', notes,
              'date', date,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM health_readiness WHERE user_id = $1),
            '[]'::json
          ) as health_readiness,
          
          -- Video Media as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'title', title,
              'url', url,
              'description', description,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM video_media WHERE user_id = $1),
            '[]'::json
          ) as video_media
      )
      SELECT 
        ud.*,
        ps.social_handles,
        ps.academic_backgrounds,
        ps.achievements,
        ps.athletic_performance,
        ps.competition_clubs,
        ps.character_leadership,
        ps.health_readiness,
        ps.video_media
      FROM user_data ud
      CROSS JOIN profile_sections ps
    `;

    const queryParams = [userId];
    if (currentUserId && currentUserId !== userId) {
      queryParams.push(currentUserId);
    }

    const result = await pool.query(completeQuery, queryParams);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Process sports_played
    let sportsPlayed = null;
    if (row.sports_played) {
      if (Array.isArray(row.sports_played)) {
        sportsPlayed = row.sports_played.join(', ');
      } else if (typeof row.sports_played === 'string') {
        let sportsString = row.sports_played.trim();
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayed = sportsString;
      }
    }

    // Process connection status
    let connectionStatus = null;
    if (row.connection_status) {
      connectionStatus = {
        exists: true,
        status: row.connection_status
      };
    }

    return {
      user: {
        userId: row.user_id,
        fullName: row.full_name,
        profileImage: row.profile_image_url,
        coverImage: row.cover_image_url,
        bio: row.bio,
        education: row.education,
        city: row.city,
        primarySport: row.primary_sport,
        sportsPlayed: sportsPlayed,
        dob: row.dob,
        userType: row.user_type,
        username: row.username,
        email: row.email
      },
      followCounts: {
        followers: parseInt(row.followers_count) || 0,
        following: parseInt(row.following_count) || 0
      },
      connectionStatus: connectionStatus,
      socialHandles: row.social_handles || [],
      academicBackgrounds: row.academic_backgrounds || [],
      achievements: row.achievements || [],
      athleticPerformance: row.athletic_performance || [],
      competitionClubs: row.competition_clubs || [],
      characterLeadership: row.character_leadership || [],
      healthReadiness: row.health_readiness || [],
      videoMedia: row.video_media || []
    };
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    throw error;
  }
}
```

**ADD** separate optimized query for posts (can be combined if needed):

```javascript
/**
 * Get user posts (separate query for better performance)
 * Can be combined with main query if needed, but keeping separate for flexibility
 * @param {string} userId - User ID
 * @param {number} limit - Limit of posts to return
 * @returns {Promise<Array>} Array of posts
 */
async function getUserPosts(userId, limit = 50) {
  const postsQuery = `
    SELECT 
      p.id,
      p.user_id,
      p.username,
      p.user_profile_url,
      p.user_type,
      p.post_type,
      p.caption,
      p.media_url,
      p.article_title,
      p.article_body,
      p.event_title,
      p.event_date,
      p.event_location,
      p.created_at,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM post_saves WHERE post_id = p.id) as save_count
    FROM posts p
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(postsQuery, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
}
```

**UPDATE** `module.exports`:

```javascript
module.exports = {
  getUserProfile,
  getCurrentUserProfile,
  upsertUserProfile,
  updateProfileImages,
  getUserProfileWithStats,
  getUserProfileComplete,  // ADD
  getUserPosts  // ADD
};
```

---

### Backend: `backend/profile/profile.service.js`

**UPDATE** service to use both queries efficiently:

```javascript
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

    return {
      success: true,
      profile: completeData.user,
      followCounts: completeData.followCounts,
      connectionStatus: completeData.connectionStatus,
      socialHandles: completeData.socialHandles,
      academicBackgrounds: completeData.academicBackgrounds,
      achievements: completeData.achievements,
      athleticPerformance: completeData.athleticPerformance,
      competitionClubs: completeData.competitionClubs,
      characterLeadership: completeData.characterLeadership,
      healthReadiness: completeData.healthReadiness,
      videoMedia: completeData.videoMedia,
      posts: posts
    };
  } catch (error) {
    console.error('Get user profile complete service error:', error.message);
    throw error;
  }
}
```

---

## 📊 Query Count Comparison

### Before Optimization:
- **12+ separate database queries**
- Sequential execution
- Multiple round trips

### After Optimization:
- **2 database queries** (executed in parallel)
  - 1 query: User + Follow counts + Connection status + All 8 profile sections (using JSON aggregation)
  - 1 query: Posts (with subqueries for counts)
- Parallel execution using `Promise.all()`
- Minimal round trips

---

## ⚡ Performance Benefits

### Database Query Reduction:
- **From 12+ queries → 2 queries**
- **83% reduction in database queries**
- **Parallel execution** = faster overall time

### Speed Improvements:
- **Single optimized query** with JSON aggregation = faster than multiple queries
- **Parallel execution** = both queries run simultaneously
- **Subqueries** = efficient, no N+1 problem
- **JSON aggregation** = PostgreSQL handles efficiently

### Network Efficiency:
- **1 API call** instead of 15+
- **Single response** with all data
- **Reduced overhead**

---

## 🔍 How It Works

### PostgreSQL JSON Aggregation:
```sql
-- Instead of 8 separate queries, use JSON aggregation:
SELECT json_agg(json_build_object('id', id, 'platform', platform, ...))
FROM social_handles WHERE user_id = $1
```

### Subqueries for Counts:
```sql
-- Instead of separate query, use subquery:
(SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
```

### CTE (Common Table Expression):
```sql
-- Organize complex query:
WITH user_data AS (...), profile_sections AS (...)
SELECT ... FROM user_data CROSS JOIN profile_sections
```

---

## ✅ Benefits Summary

1. **Minimal DB Queries:** 2 queries instead of 12+
2. **Fast Execution:** Parallel queries + optimized SQL
3. **No DB Structure Changes:** Uses existing tables
4. **Efficient:** PostgreSQL JSON aggregation is highly optimized
5. **Scalable:** Handles large datasets efficiently

---

## 🚀 Expected Performance

**Before:**
- 12+ database queries
- Sequential execution
- ~500-800ms total

**After:**
- 2 database queries (parallel)
- Optimized SQL with JSON aggregation
- ~200-300ms total

**Improvement:**
- ⚡ **2-3x faster** database execution
- 📉 **83% fewer** database queries
- 🎯 **Same data**, better performance
