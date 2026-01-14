# AthLinked API Endpoints Documentation

Complete list of all API endpoints in the AthLinked project.

**Base URL:** `/api`

**Authentication:** Most endpoints require Bearer token authentication unless specified as `security: []`

---

## 🔐 Authentication & Authorization

### Signup
- **POST** `/api/signup/start` - Start signup process (send OTP)
  - Body: `{ email: string }`
  - Auth: None

- **POST** `/api/signup/verify-otp` - Verify OTP and create account
  - Body: `{ email: string, otp: string }`
  - Auth: None

- **GET** `/api/signup/user/:email` - Get user by email
  - Auth: None

- **GET** `/api/signup/user-by-username/:username` - Get user by username
  - Auth: None

- **POST** `/api/signup/parent-complete` - Complete parent signup
  - Body: `{ email: string, password: string }`
  - Auth: None

- **GET** `/api/signup/users` - Get all users (People you may know)
  - Query: `excludeUserId`, `limit`
  - Auth: None

- **GET** `/api/signup/my-children` - Get my children (for parents)
  - Auth: Required

- **DELETE** `/api/signup/delete-account` - Delete user account
  - Auth: Required

### Login
- **POST** `/api/login` - Authenticate user
  - Body: `{ email: string, password: string }`
  - Returns: `{ accessToken, refreshToken, user }`
  - Auth: None

### Auth (Google OAuth & Token Management)
- **POST** `/api/auth/google` - Google OAuth sign-in
  - Body: `{ google_id, email, full_name, profile_picture, email_verified }`
  - Auth: None

- **POST** `/api/auth/google/complete` - Complete Google OAuth signup (set user type)
  - Body: `{ google_id, user_type: "athlete" | "coach" | "organization" }`
  - Auth: None

- **POST** `/api/auth/google/complete-profile` - Complete Google OAuth profile
  - Body: `{ google_id, sports_played[], primary_sport, company_name, designation }`
  - Auth: None

- **POST** `/api/auth/google/send-athlete-emails` - Send OTP to athlete and parent signup link
  - Body: `{ athlete_email, athlete_name, parent_email, parent_name, google_id }`
  - Auth: None

- **POST** `/api/auth/google/verify-athlete-otp` - Verify OTP for Google athlete signup
  - Body: `{ google_id, otp }`
  - Auth: None

- **POST** `/api/auth/google/complete-signup-full` - Complete full Google signup
  - Auth: None

- **POST** `/api/auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Auth: None

- **POST** `/api/auth/logout` - Logout (invalidate refresh token)
  - Body: `{ refreshToken }`
  - Auth: None

- **POST** `/api/auth/logout-all` - Logout from all devices
  - Auth: Required

### Forgot Password
- **POST** `/api/forgot-password/request` - Request password reset link
  - Body: `{ emailOrUsername: string }`
  - Auth: None

- **POST** `/api/forgot-password/reset` - Reset password using token
  - Body: `{ token: string, newPassword: string }`
  - Auth: None

---

## 👤 Profile

### Profile Management
- **POST** `/api/profile` - Create or update user profile (UPSERT)
  - Body: `{ firstName, lastName, bio, dateOfBirth, ... }`
  - Auth: Required

- **GET** `/api/profile` - Get current user profile
  - Auth: Required

- **GET** `/api/profile/:userId` - Get user profile by ID
  - Auth: None

- **POST** `/api/profile/upload` - Upload profile or cover image
  - FormData: `file` (PNG, JPG, GIF, max 10MB)
  - Auth: Required

- **POST** `/api/profile/images` - Update profile images
  - Body: `{ profileImage: string, coverImage: string }`
  - Auth: Required

### Social Handles
- **GET** `/api/profile/:userId/social-handles` - Get social handles
  - Auth: None

- **POST** `/api/profile/:userId/social-handles` - Create social handle
  - Body: `{ platform: string, handle: string }`
  - Auth: Required

- **PUT** `/api/profile/social-handles/:id` - Update social handle
  - Body: `{ platform, handle }`
  - Auth: Required

- **DELETE** `/api/profile/social-handles/:id` - Delete social handle
  - Auth: Required

### Academic Backgrounds
- **GET** `/api/profile/:userId/academic-backgrounds` - Get academic backgrounds
  - Auth: None

- **POST** `/api/profile/:userId/academic-backgrounds` - Create academic background
  - FormData: `{ school, degree, startDate, endDate, degreePdf? }` (PDF upload)
  - Field: `degreePdf` (PDF only, max 10MB)
  - Auth: Required

- **PUT** `/api/profile/academic-backgrounds/:id` - Update academic background
  - FormData: `{ school, degree, startDate, endDate, degreePdf? }` (PDF upload)
  - Field: `degreePdf` (PDF only, max 10MB)
  - Auth: Required

- **DELETE** `/api/profile/academic-backgrounds/:id` - Delete academic background
  - Auth: Required

### Achievements
- **GET** `/api/profile/:userId/achievements` - Get achievements
  - Auth: None

- **POST** `/api/profile/:userId/achievements` - Create achievement
  - FormData: `{ title, description, date, mediaPdf? }` (PDF upload)
  - Field: `mediaPdf` (PDF only, max 10MB)
  - Auth: Required

- **PUT** `/api/profile/achievements/:id` - Update achievement
  - FormData: `{ title, description, date, mediaPdf? }` (PDF upload)
  - Field: `mediaPdf` (PDF only, max 10MB)
  - Auth: Required

- **DELETE** `/api/profile/achievements/:id` - Delete achievement
  - Auth: Required

### Athletic Performance
- **GET** `/api/profile/:userId/athletic-performance` - Get athletic performance data
  - Auth: None

- **POST** `/api/profile/:userId/athletic-performance` - Create athletic performance entry
  - Body: `{ metric: string, value: string, date: string }`
  - Auth: Required

- **PUT** `/api/profile/athletic-performance/:id` - Update athletic performance entry
  - Body: `{ metric, value, date }`
  - Auth: Required

- **DELETE** `/api/profile/athletic-performance/:id` - Delete athletic performance entry
  - Auth: Required

### Competition Clubs
- **GET** `/api/profile/:userId/competition-clubs` - Get competition clubs
  - Auth: None

- **POST** `/api/profile/:userId/competition-clubs` - Create competition club entry
  - Body: `{ clubName, position, startDate, endDate }`
  - Auth: Required

- **PUT** `/api/profile/competition-clubs/:id` - Update competition club entry
  - Body: `{ clubName, position, startDate, endDate }`
  - Auth: Required

- **DELETE** `/api/profile/competition-clubs/:id` - Delete competition club entry
  - Auth: Required

### Character and Leadership
- **GET** `/api/profile/:userId/character-leadership` - Get character and leadership data
  - Auth: None

- **POST** `/api/profile/:userId/character-leadership` - Create character and leadership entry
  - Body: `{ title, description, date }`
  - Auth: Required

- **PUT** `/api/profile/character-leadership/:id` - Update character and leadership entry
  - Body: `{ title, description, date }`
  - Auth: Required

- **DELETE** `/api/profile/character-leadership/:id` - Delete character and leadership entry
  - Auth: Required

### Health and Readiness
- **GET** `/api/profile/:userId/health-readiness` - Get health and readiness data
  - Auth: None

- **POST** `/api/profile/:userId/health-readiness` - Create health and readiness entry
  - Body: `{ condition, notes, date }`
  - Auth: Required

- **PUT** `/api/profile/health-readiness/:id` - Update health and readiness entry
  - Body: `{ condition, notes, date }`
  - Auth: Required

- **DELETE** `/api/profile/health-readiness/:id` - Delete health and readiness entry
  - Auth: Required

### Video and Media
- **GET** `/api/profile/:userId/video-media` - Get video and media data
  - Auth: None

- **POST** `/api/profile/:userId/video-media` - Create video and media entry
  - Body: `{ title, url, description }`
  - Auth: Required

- **PUT** `/api/profile/video-media/:id` - Update video and media entry
  - Body: `{ title, url, description }`
  - Auth: Required

- **DELETE** `/api/profile/video-media/:id` - Delete video and media entry
  - Auth: Required

---

## 📝 Posts

- **POST** `/api/posts` - Create a new post
  - FormData: `{ content: string, media? }` (image/video)
  - Field: `media` (image/video file)
  - Auth: Required

- **GET** `/api/posts` - Get posts feed
  - Query: `page`, `limit`
  - Auth: None

- **GET** `/api/posts/:postId/like-status` - Check like status
  - Auth: Required

- **POST** `/api/posts/:postId/like` - Like a post
  - Auth: Required

- **POST** `/api/posts/:postId/unlike` - Unlike a post
  - Auth: Required

- **POST** `/api/posts/:postId/comments` - Add a comment to a post
  - Body: `{ comment: string }`
  - Auth: Required

- **GET** `/api/posts/:postId/comments` - Get comments for a post
  - Auth: None

- **POST** `/api/posts/comments/:commentId/reply` - Reply to a comment
  - Body: `{ reply: string }`
  - Auth: Required

- **POST** `/api/posts/:postId/save` - Save a post
  - Auth: Required

- **DELETE** `/api/posts/:postId` - Delete a post
  - Auth: Required

---

## 🎬 Clips

- **POST** `/api/clips` - Create a new clip
  - FormData: `video` (max 50MB)
  - Field: `video` (video file)
  - Auth: Required

- **GET** `/api/clips` - Get clips feed
  - Query: `page`, `limit`
  - Auth: None

- **POST** `/api/clips/:clipId/like` - Like a clip
  - Auth: Required

- **POST** `/api/clips/:clipId/unlike` - Unlike a clip
  - Auth: Required

- **POST** `/api/clips/:clipId/comments` - Add a comment to a clip
  - Body: `{ comment: string }`
  - Auth: Required

- **GET** `/api/clips/:clipId/comments` - Get comments for a clip
  - Auth: None

- **POST** `/api/clips/comments/:commentId/reply` - Reply to a comment
  - Body: `{ comment: string }`
  - Auth: Required

- **DELETE** `/api/clips/:clipId` - Delete a clip
  - Auth: Required

---

## 💬 Comments

- **POST** `/api/comments/:commentId/reply` - Reply to a comment
  - Body: `{ reply: string }`
  - Auth: Required

---

## 📰 Articles

- **POST** `/api/articles` - Create a new article
  - Body: `{ title: string, content: string, description?: string }`
  - Auth: Required

- **GET** `/api/articles` - Get all active articles
  - Query: `page`, `limit`
  - Auth: None

- **DELETE** `/api/articles/:id` - Delete an article (soft delete)
  - Auth: Required

---

## 🎥 Videos

- **POST** `/api/videos` - Create a new video
  - FormData: `{ title: string, description?: string, file }`
  - Field: `file` (video file)
  - Auth: Required

- **GET** `/api/videos` - Get all active videos
  - Query: `page`, `limit`
  - Auth: None

- **DELETE** `/api/videos/:id` - Delete a video (soft delete)
  - Auth: Required

---

## 📄 Templates

- **POST** `/api/templates` - Create a new template
  - FormData: `{ title: string, description?: string, file }`
  - Field: `file` (PDF file)
  - Auth: Required

- **GET** `/api/templates` - Get all active templates
  - Query: `page`, `limit`
  - Auth: None

- **DELETE** `/api/templates/:id` - Delete a template (soft delete)
  - Auth: Required

---

## 📚 Resources

- **POST** `/api/resources` - Create a new resource
  - FormData: `{ title: string, description?: string, resource_type: "article" | "video" | "template", file }`
  - Field: `file` (resource file)
  - Auth: Required

- **GET** `/api/resources` - Get all active resources
  - Query: `type`, `page`, `limit`
  - Auth: None

- **DELETE** `/api/resources/:id` - Delete a resource (soft delete)
  - Auth: Required

---

## 🌐 Network

- **POST** `/api/network/follow/:userId` - Follow a user
  - Auth: Required

- **POST** `/api/network/unfollow/:userId` - Unfollow a user
  - Auth: Required

- **GET** `/api/network/followers/:userId` - Get followers list
  - Auth: None

- **GET** `/api/network/following/:userId` - Get following list
  - Auth: None

- **GET** `/api/network/counts/:userId` - Get follow counts
  - Auth: None

- **GET** `/api/network/is-following/:userId` - Check if following user
  - Auth: Required

- **POST** `/api/network/connect/:userId` - Send connection request
  - Auth: Required

- **POST** `/api/network/accept/:requestId` - Accept connection request
  - Auth: Required

- **POST** `/api/network/reject/:requestId` - Reject connection request
  - Auth: Required

- **GET** `/api/network/invitations` - Get connection requests
  - Auth: Required

- **GET** `/api/network/connection-status/:userId` - Check connection request status
  - Auth: Required

- **GET** `/api/network/connections/:userId` - Get connections list
  - Auth: Required

---

## 💌 Messages

- **GET** `/api/messages/conversations` - Get conversations
  - Auth: Required

- **POST** `/api/messages/conversations/create` - Get or create conversation
  - Body: `{ userId: string }`
  - Auth: Required

- **GET** `/api/messages/search/users` - Search users
  - Query: `query: string`
  - Auth: Required

- **GET** `/api/messages/:conversationId` - Get messages
  - Query: `page`, `limit`
  - Auth: Required

- **POST** `/api/messages/:conversationId/read` - Mark messages as read
  - Auth: Required

- **POST** `/api/messages/upload` - Upload message file
  - FormData: `file` (any file type)
  - Field: `file`
  - Auth: Required

- **GET** `/api/messages/unread-count` - Get unread message count
  - Auth: Required

- **DELETE** `/api/messages/message/:messageId` - Delete a message
  - Auth: Required

- **DELETE** `/api/messages/conversation/:conversationId` - Delete a conversation
  - Auth: Required

---

## 🔔 Notifications

- **GET** `/api/notifications` - Get notifications
  - Query: `page`, `limit`
  - Auth: Required

- **GET** `/api/notifications/unread-count` - Get unread notification count
  - Auth: Required

- **POST** `/api/notifications/read-all` - Mark all notifications as read
  - Auth: Required

- **POST** `/api/notifications/:id/read` - Mark notification as read
  - Auth: Required

- **DELETE** `/api/notifications/:id` - Delete a notification
  - Auth: Required

---

## ⭐ Favorites

- **GET** `/api/favorites` - Get all favorites
  - Auth: Required

- **POST** `/api/favorites/:athleteId` - Add athlete to favorites
  - Auth: Required

- **DELETE** `/api/favorites/:athleteId` - Remove athlete from favorites
  - Auth: Required

- **GET** `/api/favorites/:athleteId/status` - Check favorite status
  - Auth: Required

---

## 🔍 Search

- **GET** `/api/search` - Search and filter users
  - Query: `searchQuery`, `sortBy`, `searchType`, `collegeSchool`, `location`, `sportSpecialization`, `gender`, `teamLevel`, `teamCaptain`
  - Auth: None

- **GET** `/api/search/users` - Get all users
  - Query: `limit`
  - Auth: None

- **GET** `/api/search/user/:userId` - Get user by ID
  - Auth: None

---

## 📊 Stats

- **GET** `/api/sports` - Get all sports
  - Auth: None

- **GET** `/api/sports/:sportId/positions` - Get positions for a sport
  - Auth: None

- **GET** `/api/positions/:positionId/fields` - Get fields for a position
  - Auth: None

- **POST** `/api/user-sport-profile` - Create or update user sport profile
  - Body: `{ sportId: string, positionId?: string }`
  - Auth: Required

- **POST** `/api/user/position-stats` - Save user position stats
  - Body: `{ profileId: string, stats: object }`
  - Auth: Required

- **GET** `/api/user/sport-profile/:id/stats` - Get user stats for a sport
  - Auth: None

- **GET** `/api/user/:userId/sport-profiles` - Get all user sport profiles
  - Auth: None

---

## 📋 Document Upload Endpoints Summary

### Profile Image Upload
- **POST** `/api/profile/upload`
  - Field: `file` (PNG, JPG, GIF, max 10MB)
  - Auth: Required

### Academic Background Document Upload
- **POST** `/api/profile/:userId/academic-backgrounds`
  - Field: `degreePdf` (PDF only, max 10MB)
  - Auth: Required

- **PUT** `/api/profile/academic-backgrounds/:id`
  - Field: `degreePdf` (PDF only, max 10MB)
  - Auth: Required

### Achievement Document Upload
- **POST** `/api/profile/:userId/achievements`
  - Field: `mediaPdf` (PDF only, max 10MB)
  - Auth: Required

- **PUT** `/api/profile/achievements/:id`
  - Field: `mediaPdf` (PDF only, max 10MB)
  - Auth: Required

---

## 📝 Notes

- All file uploads use `multipart/form-data` content type
- PDF uploads are limited to 10MB
- Image uploads (profile/cover) are limited to 10MB
- Video uploads (clips) are limited to 50MB
- Most endpoints return JSON with `{ success: boolean, ... }` structure
- Authentication tokens should be sent in the `Authorization` header as `Bearer <token>`
- Query parameters are optional unless specified
- Path parameters (e.g., `:userId`, `:id`) are required

---

## 🏥 Health Check

- **GET** `/health` - Server health check
  - Returns: `{ status: "OK", message: "Server is running" }`
  - Auth: None

---

## 📖 API Documentation

- **GET** `/api-docs` - Swagger API documentation
  - Auth: None

---

## 📊 Endpoint Summary

### Total Endpoints by Category:

- **Authentication & Authorization**: 18 endpoints
  - Signup: 8 endpoints
  - Login: 1 endpoint
  - Auth (Google OAuth & Token Management): 8 endpoints
  - Forgot Password: 2 endpoints

- **Profile**: 45 endpoints
  - Profile Management: 5 endpoints
  - Social Handles: 4 endpoints
  - Academic Backgrounds: 4 endpoints (with PDF upload)
  - Achievements: 4 endpoints (with PDF upload)
  - Athletic Performance: 4 endpoints
  - Competition Clubs: 4 endpoints
  - Character and Leadership: 4 endpoints
  - Health and Readiness: 4 endpoints
  - Video and Media: 4 endpoints

- **Posts**: 9 endpoints

- **Clips**: 7 endpoints

- **Comments**: 1 endpoint

- **Articles**: 3 endpoints

- **Videos**: 3 endpoints

- **Templates**: 3 endpoints

- **Resources**: 3 endpoints

- **Network**: 12 endpoints

- **Messages**: 8 endpoints

- **Notifications**: 5 endpoints

- **Favorites**: 4 endpoints

- **Search**: 3 endpoints

- **Stats**: 7 endpoints

- **Health Check**: 1 endpoint

- **API Documentation**: 1 endpoint

### **Grand Total: 127 API Endpoints**

### File Upload Endpoints:
- Profile image upload: 1 endpoint
- Academic background PDF upload: 2 endpoints (POST & PUT)
- Achievement PDF upload: 2 endpoints (POST & PUT)
- Post media upload: 1 endpoint
- Clip video upload: 1 endpoint
- Video resource upload: 1 endpoint
- Template PDF upload: 1 endpoint
- Resource file upload: 1 endpoint
- Message file upload: 1 endpoint

**Total File Upload Endpoints: 11**
