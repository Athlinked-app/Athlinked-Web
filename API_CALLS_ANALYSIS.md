# API Calls Analysis: "People You May Know" Feature

## Current Implementation Analysis

### RightSideBar Component (`frontend/components/RightSideBar/index.tsx`)

**Current API calls per "People You May Know" load:**

1. **1 API call** - Get current user (lines 140-151)
   - `/signup/user-by-username/{username}` OR `/signup/user/{email}`
   - **Purpose**: Get current user ID to exclude from list and check follow status

2. **1 API call** - Get list of suggested users (line 172)
   - `/signup/users?limit=10&excludeUserId={userId}`
   - **Returns**: 10 users (default limit)

3. **10 API calls** - Check follow status for EACH user (lines 176-210)
   - `/network/is-following/{user.id}?follower_id={userId}`
   - **Made in parallel** using `Promise.all`, but still 10 separate requests
   - **One call per user** to check if current user is following them

### **Total: 12 API calls to display 10 people**

## The Problem

This is **highly inefficient** because:
- For 10 users, we make **10 separate follow status checks**
- Each check requires a database query
- Network overhead for 10 separate HTTP requests
- No caching, so every page load makes all 12 calls

## Impact

If a user navigates to a page with "People you may know":
- **Home page**: 12 API calls
- **Profile page**: 12 API calls  
- **Search page**: 12 API calls
- **Network page**: 12 API calls
- Any page with RightSideBar: 12 API calls

**Total per page visit: 12 API calls just for the sidebar!**

## Recommended Solutions

### Solution 1: Backend Optimization (BEST) ⭐
Modify the backend to include follow status in the users list response.

**Benefits:**
- Reduces from 12 calls to 2 calls
- Single database query with JOIN instead of 10+ queries
- Much faster response time

**Implementation:**
Modify `/api/signup/users` endpoint to accept optional `currentUserId` and return `isFollowing` status for each user.

### Solution 2: Batch Follow Status Check API
Create a new endpoint: `/network/batch-is-following` that accepts array of user IDs.

**Benefits:**
- Reduces from 12 calls to 3 calls
- Single database query for all follow statuses

### Solution 3: Frontend Caching (Quick Fix)
Add caching to follow status checks.

**Benefits:**
- Reduces redundant calls on subsequent loads
- Quick to implement
- Doesn't solve the root issue but helps

### Solution 4: Combine All (Recommended)
- Backend includes follow status in users list
- Frontend caches the result
- Best performance and user experience
