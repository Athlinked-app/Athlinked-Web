# Postman Testing Guide: `/api/signup/users` Endpoint

## 📋 Quick Setup

### **1. Basic Request Setup**

**Method:** `GET`  
**URL:** `http://localhost:3001/api/signup/users`

---

## 🧪 Test Scenarios

### **Test 1: Get Users WITHOUT Follow Status (All `isFollowing: false`)**

**Purpose:** Test basic endpoint functionality

**Steps:**
1. Open Postman
2. Create new GET request
3. Set URL: `http://localhost:3001/api/signup/users`
4. Click **Send**

**Expected Response:**
```json
{
    "success": true,
    "users": [
        {
            "id": "...",
            "full_name": "User Name",
            "isFollowing": false,  // Always false (no currentUserId provided)
            ...
        }
    ]
}
```

**Why `isFollowing: false`?**  
Because no `currentUserId` was provided, so the endpoint can't check follow status.

---

### **Test 2: Get Users WITH Follow Status (Accurate `isFollowing`)**

**Purpose:** Test follow status functionality

**Steps:**
1. **First, get your User ID:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/signup/users?limit=1`
   - Send request
   - Copy the `id` from the first user in response

2. **Then test with currentUserId:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&limit=10`
   - Replace `YOUR_USER_ID` with the ID you copied
   - Click **Send**

**Example URL:**
```
http://localhost:3001/api/signup/users?currentUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&limit=10
```

**Expected Response:**
```json
{
    "success": true,
    "users": [
        {
            "id": "...",
            "full_name": "User Name",
            "isFollowing": true,  // ✅ Accurate - if you're following them
            ...
        },
        {
            "id": "...",
            "full_name": "Another User",
            "isFollowing": false,  // ✅ Accurate - if you're NOT following them
            ...
        }
    ]
}
```

---

### **Test 3: Exclude Current User from Results**

**Purpose:** Get other users, excluding yourself

**Steps:**
1. Get your User ID (same as Test 2, step 1)
2. Method: `GET`
3. URL: `http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&excludeUserId=YOUR_USER_ID&limit=10`

**Example URL:**
```
http://localhost:3001/api/signup/users?currentUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&excludeUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&limit=10
```

**Expected Response:**
- Your user ID should NOT appear in the results
- All other users with accurate `isFollowing` status

---

### **Test 4: Using Authentication Token (Auto-detect User)**

**Purpose:** Test with authenticated request (auto-detects user from token)

**Steps:**
1. **Get Authentication Token:**
   - Login via `/api/login` endpoint
   - Copy the `accessToken` from response

2. **Set up authenticated request:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/signup/users?limit=10`
   - Go to **Headers** tab
   - Add header:
     - Key: `Authorization`
     - Value: `Bearer YOUR_ACCESS_TOKEN`
   - Click **Send**

**Expected Response:**
- Automatically uses authenticated user's ID as `currentUserId`
- Returns accurate `isFollowing` status

---

## 📝 Query Parameters Reference

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `currentUserId` | string | No* | `f129cded-1cf5-4d96-88a2-37ea6bd46ad2` | User ID to check follow status for |
| `follower_id` | string | No* | `f129cded-1cf5-4d96-88a2-37ea6bd46ad2` | Alternative name for `currentUserId` |
| `excludeUserId` | string | No | `f129cded-1cf5-4d96-88a2-37ea6bd46ad2` | User ID to exclude from results |
| `limit` | number | No | `10` | Number of users to return (default: 10) |

*Required if you want accurate `isFollowing` status

---

## 🔍 Step-by-Step Postman Setup

### **Option A: Using Query Parameters (Recommended for Testing)**

1. **Open Postman**
2. **Create New Request:**
   - Click **New** → **HTTP Request**
   - Name it: "Get Users with Follow Status"

3. **Set Method and URL:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/signup/users`

4. **Add Query Parameters:**
   - Click **Params** tab (next to URL)
   - Add parameters:
     ```
     Key: currentUserId
     Value: f129cded-1cf5-4d96-88a2-37ea6bd46ad2
     
     Key: limit
     Value: 10
     ```

5. **Send Request:**
   - Click **Send** button
   - View response in bottom panel

---

### **Option B: Using Full URL with Query String**

1. **Open Postman**
2. **Create New Request:**
   - Method: `GET`
   - URL: `http://localhost:3001/api/signup/users?currentUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&limit=10`

3. **Click Send**

---

## 🎯 Complete Test Workflow

### **Step 1: Get Your User ID**

**Request:**
```
GET http://localhost:3001/api/signup/users?limit=1
```

**Response:**
```json
{
    "success": true,
    "users": [
        {
            "id": "f129cded-1cf5-4d96-88a2-37ea6bd46ad2",  // ← Copy this ID
            "full_name": "Your Name",
            ...
        }
    ]
}
```

**Action:** Copy the `id` value

---

### **Step 2: Test Without currentUserId**

**Request:**
```
GET http://localhost:3001/api/signup/users?limit=10
```

**Expected:**
- All users have `isFollowing: false`
- This is expected behavior

---

### **Step 3: Test With currentUserId**

**Request:**
```
GET http://localhost:3001/api/signup/users?currentUserId=f129cded-1cf5-4d96-88a2-37ea6bd46ad2&limit=10
```

**Expected:**
- Some users have `isFollowing: true` (if you're following them)
- Some users have `isFollowing: false` (if you're not following them)
- Accurate follow status

---

### **Step 4: Verify Follow Relationships**

If all users show `isFollowing: false` even with `currentUserId`, check:

**Option A: Check Database Directly**
```sql
SELECT * FROM user_follows 
WHERE follower_id = 'f129cded-1cf5-4d96-88a2-37ea6bd46ad2';
```

**Option B: Use Network Endpoint**
```
GET http://localhost:3001/api/network/following?user_id=f129cded-1cf5-4d96-88a2-37ea6bd46ad2
```

This will show who you're following.

---

## 📊 Expected Response Structure

```json
{
    "success": true,
    "users": [
        {
            "id": "uuid-string",
            "full_name": "User Full Name",
            "username": "username or null",
            "email": "user@example.com",
            "user_type": "athlete|coach|parent",
            "profile_url": "url or null",
            "created_at": "2026-01-16T03:58:14.224Z",
            "dob": "1999-12-19T18:30:00.000Z",
            "isFollowing": true  // or false
        }
    ]
}
```

---

## 🐛 Troubleshooting

### **Issue 1: All `isFollowing: false`**

**Possible Causes:**
1. ❌ Not passing `currentUserId` parameter
2. ❌ Invalid `currentUserId` (wrong format)
3. ❌ No follow relationships exist in database

**Solutions:**
1. ✅ Add `?currentUserId=YOUR_USER_ID` to URL
2. ✅ Verify user ID is correct UUID format
3. ✅ Check `user_follows` table for relationships

---

### **Issue 2: "User not found" or Empty Response**

**Possible Causes:**
1. ❌ Server not running
2. ❌ Wrong URL
3. ❌ Database connection issue

**Solutions:**
1. ✅ Verify server is running: `http://localhost:3001/health`
2. ✅ Check URL: `http://localhost:3001/api/signup/users`
3. ✅ Check backend logs for errors

---

### **Issue 3: Wrong Follow Status**

**Possible Causes:**
1. ❌ Using wrong `currentUserId`
2. ❌ Database relationships incorrect

**Solutions:**
1. ✅ Verify `currentUserId` matches your actual user ID
2. ✅ Check `user_follows` table:
   ```sql
   SELECT * FROM user_follows 
   WHERE follower_id = 'YOUR_USER_ID' AND following_id = 'OTHER_USER_ID';
   ```

---

## ✅ Quick Test Checklist

- [ ] Server is running (`http://localhost:3001/health`)
- [ ] URL is correct: `http://localhost:3001/api/signup/users`
- [ ] Method is `GET`
- [ ] `currentUserId` parameter is added (if testing follow status)
- [ ] User ID is valid UUID format
- [ ] Response has `success: true`
- [ ] Users array is not empty
- [ ] `isFollowing` field exists in response

---

## 🎓 Example Postman Collection

### **Request 1: Get Users (No Follow Status)**
```
GET http://localhost:3001/api/signup/users?limit=10
```

### **Request 2: Get Users (With Follow Status)**
```
GET http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&limit=10
```

### **Request 3: Get Users (Exclude Self)**
```
GET http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&excludeUserId=YOUR_USER_ID&limit=10
```

### **Request 4: Get Users (Authenticated)**
```
GET http://localhost:3001/api/signup/users?limit=10
Headers:
  Authorization: Bearer YOUR_TOKEN
```

---

## 📸 Postman Screenshots Guide

### **Setting Query Parameters:**
1. Click **Params** tab
2. Add key-value pairs:
   - `currentUserId`: `your-user-id`
   - `limit`: `10`

### **Setting Headers (for Auth):**
1. Click **Headers** tab
2. Add:
   - Key: `Authorization`
   - Value: `Bearer your-token-here`

### **Viewing Response:**
1. Click **Send**
2. View response in bottom panel
3. Check **Pretty** tab for formatted JSON
4. Check **Status**: Should be `200 OK`

---

## 🚀 Quick Start

**Copy-paste this URL into Postman (replace YOUR_USER_ID):**

```
http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&limit=10
```

**Or use this if you want to exclude yourself:**

```
http://localhost:3001/api/signup/users?currentUserId=YOUR_USER_ID&excludeUserId=YOUR_USER_ID&limit=10
```

---

## 💡 Pro Tips

1. **Save as Collection:** Save these requests in a Postman collection for easy reuse
2. **Use Variables:** Set `baseUrl` and `userId` as Postman variables
3. **Test Scripts:** Add test scripts to verify response structure
4. **Environment:** Create different environments (dev, staging, prod)

---

## 📞 Need Help?

If you're still getting `isFollowing: false` for all users:

1. **Check Backend Logs:**
   - Look for: `[getAllUsers] Request params:`
   - Verify `currentUserId` is being received

2. **Verify Database:**
   ```sql
   -- Check if follow relationships exist
   SELECT COUNT(*) FROM user_follows;
   
   -- Check your specific follows
   SELECT * FROM user_follows WHERE follower_id = 'YOUR_USER_ID';
   ```

3. **Test SQL Directly:**
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
