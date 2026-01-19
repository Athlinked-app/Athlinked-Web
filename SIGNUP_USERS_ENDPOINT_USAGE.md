# `/api/signup/users` Endpoint Usage Guide

## Issue: `isFollowing` Always Returns `false`

If you're getting `isFollowing: false` for all users, it's because the `currentUserId` parameter is **not being passed**.

---

## ✅ Correct Usage

### **Option 1: Pass `currentUserId` as Query Parameter**

```
GET http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&limit=10
```

**Example:**
```
GET http://localhost:3001/api/signup/users?currentUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&limit=10
```

### **Option 2: Pass `follower_id` (Alternative Parameter Name)**

```
GET http://localhost:3001/api/signup/users?follower_id=YOUR_USER_ID&limit=10
```

### **Option 3: Use Authenticated Request**

If you're making an authenticated request (with Bearer token), the endpoint will automatically use `req.user.id` as `currentUserId`.

**Example with Auth:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/signup/users?limit=10
```

---

## ❌ What Happens Without `currentUserId`

If you call:
```
GET http://localhost:3001/api/signup/users
```

The endpoint will:
- Return all users
- Set `isFollowing: false` for **all users** (because it doesn't know who the current user is)
- This is expected behavior when no `currentUserId` is provided

---

## 🔍 How It Works

### **Backend Logic:**

1. **With `currentUserId`:**
   - Uses SQL `LEFT JOIN` with `user_follows` table
   - Checks if `currentUserId` (follower_id) is following each user (following_id)
   - Returns `isFollowing: true` if a follow relationship exists, `false` otherwise

2. **Without `currentUserId`:**
   - Returns `isFollowing: false` for all users
   - No database query for follow status (can't check without knowing who the current user is)

---

## 📝 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentUserId` | string | No* | User ID to check follow status for |
| `follower_id` | string | No* | Alternative name for `currentUserId` |
| `excludeUserId` | string | No | User ID to exclude from results |
| `limit` | number | No | Number of users to return (default: 10) |

*Required if you want accurate `isFollowing` status

---

## 🧪 Testing Examples

### **Test 1: Get Users with Follow Status**
```bash
# Replace USER_ID with an actual user ID
curl "http://localhost:3001/api/signup/users?currentUserId=USER_ID&limit=10"
```

### **Test 2: Exclude Current User**
```bash
curl "http://localhost:3001/api/signup/users?currentUserId=USER_ID&excludeUserId=USER_ID&limit=10"
```

### **Test 3: Without Follow Status (All False)**
```bash
curl "http://localhost:3001/api/signup/users?limit=10"
# Returns isFollowing: false for all
```

---

## 🔧 SQL Query Used

When `currentUserId` is provided:

```sql
SELECT 
  u.id, 
  u.full_name, 
  u.username, 
  u.email, 
  u.user_type, 
  u.profile_url, 
  u.created_at,
  u.dob,
  CASE 
    WHEN uf.id IS NOT NULL THEN true 
    ELSE false 
  END as is_following
FROM users u
LEFT JOIN user_follows uf ON uf.follower_id = $1 AND uf.following_id = u.id
WHERE u.id != $2  -- if excludeUserId provided
ORDER BY u.created_at DESC
LIMIT $3
```

**Join Logic:**
- `uf.follower_id = currentUserId` (the person checking)
- `uf.following_id = u.id` (the person being checked)
- If a row exists in `user_follows` matching both, `isFollowing = true`

---

## 🐛 Debugging

### **Check Backend Logs:**

The endpoint now logs:
```
[getAllUsers] Request params: { currentUserId: '...', ... }
[getAllUsers] Using query with currentUserId: { ... }
[getAllUsers] Query result: { totalUsers: 10, followingCount: 3, ... }
```

### **Verify Follow Relationships:**

Check if follow relationships exist in database:
```sql
SELECT * FROM user_follows 
WHERE follower_id = 'YOUR_USER_ID';
```

### **Test the JOIN Directly:**

```sql
SELECT 
  u.id,
  u.full_name,
  CASE 
    WHEN uf.id IS NOT NULL THEN true 
    ELSE false 
  END as is_following
FROM users u
LEFT JOIN user_follows uf ON uf.follower_id = 'YOUR_USER_ID' AND uf.following_id = u.id
LIMIT 10;
```

---

## ✅ Solution

**To get accurate `isFollowing` status:**

1. **Pass `currentUserId` in the query:**
   ```
   ?currentUserId=YOUR_USER_ID
   ```

2. **Or use authenticated request** (endpoint will auto-detect user from token)

3. **Verify follow relationships exist** in `user_follows` table

---

## 📊 Expected Response

**With `currentUserId`:**
```json
{
  "success": true,
  "users": [
    {
      "id": "...",
      "full_name": "User Name",
      "isFollowing": true,  // ✅ Accurate status
      ...
    },
    {
      "id": "...",
      "full_name": "Another User",
      "isFollowing": false,  // ✅ Accurate status
      ...
    }
  ]
}
```

**Without `currentUserId`:**
```json
{
  "success": true,
  "users": [
    {
      "id": "...",
      "full_name": "User Name",
      "isFollowing": false,  // ❌ Always false
      ...
    }
  ]
}
```
