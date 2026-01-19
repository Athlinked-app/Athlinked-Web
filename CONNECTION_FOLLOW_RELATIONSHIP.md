# Connection and Follow Relationship Implementation

## 📋 Business Rules

### **Rule 1: Connected Users = Automatically Following**
- If two users are **connected**, they are automatically considered as **following each other**
- Connected users will show **"Following"** button instead of **"Follow"** button
- No need to manually follow someone you're already connected with

### **Rule 2: Unfollow = Remove Connection AND Reverse Follow**
- When two users are **mutually connected** and one **unfollows** the other:
  1. Remove the follow relationship (User A → User B)
  2. Remove the reverse follow relationship (User B → User A) if it exists
  3. Remove the connection (affects both users)
- This ensures the connection is **completely cut for BOTH users**
- Both users are no longer connected to each other

### **Rule 3: Connect and Follow are Separate**
- **Connect** and **Follow** are **different** relationships
- Users can follow without connecting
- Users can connect without following (though connection acceptance creates mutual follows)
- **Only when unfollowing** should the connection be removed
- **Following does NOT automatically create a connection**

### **Rule 3: Follow ≠ Create Connection**
- When a user **follows** someone, it does **NOT** automatically create a connection
- Connections are only created through the connection request/accept flow
- Following is independent of connections (except for display purposes)

### **Rule 4: Following List Includes Connections**
- The **following list** includes both:
  1. Direct follows (from `user_follows` table)
  2. Connected users (from `user_connections` table)
- This ensures connected users appear in the following list automatically

---

## 🔄 Implementation Details

### **Backend Changes**

#### **1. Updated `isFollowing()` Function**
**File:** `backend/network/network.model.js`

**Changes:**
- Now checks both direct follows AND connections
- Returns `true` if users are connected (even without direct follow)
- This ensures UI shows "Following" button for connected users

**Logic:**
```javascript
1. Check if direct follow exists → return true
2. If not, check if users are connected → return true
3. Otherwise → return false
```

#### **2. Updated `getFollowing()` Function**
**File:** `backend/network/network.model.js`

**Changes:**
- Now includes connected users in the following list
- Uses UNION to combine direct follows and connections
- Connected users automatically appear in following list

**Query:**
```sql
SELECT users FROM (
  -- Direct follows
  SELECT following_id FROM user_follows WHERE follower_id = $1
  UNION
  -- Connected users
  SELECT connected_user_id FROM user_connections WHERE user_id_1 = $1 OR user_id_2 = $1
)
```

#### **3. Updated `unfollowUser()` Function**
**File:** `backend/network/network.model.js`

**Changes:**
- After removing follow relationship, checks if users are connected
- If connected, **removes the connection** automatically
- This ensures connections are removed when users unfollow

**Logic:**
```javascript
1. Remove follow relationship
2. Update follower/following counts
3. Check if users are connected
4. If connected → Remove connection
5. Commit transaction
```

#### **4. `followUser()` Function (No Changes)**
**File:** `backend/network/network.model.js`

**Status:** ✅ Already correct
- Does NOT create connections when following
- Only creates follow relationship
- Connections remain independent

---

## 📊 Flow Diagrams

### **Connection Accept Flow:**
```
User A sends connection request to User B
   ↓
User B accepts connection request
   ↓
1. Create connection in user_connections table
2. Create mutual follows (if not already following)
3. Update follower/following counts
   ↓
Result: Users are connected AND following each other
```

### **Follow Flow:**
```
User A follows User B
   ↓
1. Create follow relationship in user_follows table
2. Update follower/following counts
   ↓
Result: User A is following User B
Note: Connection is NOT created
```

### **Unfollow Flow (Connected Users):**
```
User A unfollows User B (both are connected)
   ↓
1. Remove follow relationship (User A → User B) from user_follows table
2. Update follower/following counts for User A and User B
3. Check if users are connected
4. If connected:
   a. Remove reverse follow relationship (User B → User A) if it exists
   b. Update follower/following counts for reverse follow
   c. Remove connection from user_connections table (affects both users)
   ↓
Result: 
- Follow removed (User A → User B)
- Reverse follow removed (User B → User A, if existed)
- Connection removed for BOTH users
- Both users are no longer connected
```

### **Follow Status Check Flow:**
```
Check if User A is following User B
   ↓
1. Check user_follows table (direct follow)
   ↓
   If found → Return true
   ↓
2. Check user_connections table (connection)
   ↓
   If found → Return true (connected = auto-follow)
   ↓
3. Return false
```

---

## 🎯 UI Behavior

### **Scenario 1: Users Are Connected**
- **Following List:** Connected user appears in following list
- **Follow Status:** `isFollowing` returns `true`
- **Button Display:** Shows **"Following"** button (not "Follow")
- **Action:** User can unfollow, which will also remove connection

### **Scenario 2: User Follows (Not Connected)**
- **Following List:** User appears in following list
- **Follow Status:** `isFollowing` returns `true`
- **Button Display:** Shows **"Following"** button
- **Action:** User can unfollow (no connection to remove)

### **Scenario 3: User Unfollows Connected User (Mutual Connection)**
- **Follow Relationship (A → B):** Removed from `user_follows`
- **Reverse Follow Relationship (B → A):** Removed from `user_follows` (if existed)
- **Connection:** Automatically removed from `user_connections` (affects both users)
- **Following List:** User removed from following list for both users
- **Button Display:** Changes to **"Follow"** button for both users
- **Result:** Connection completely cut for BOTH users

### **Scenario 4: User Unfollows Non-Connected User**
- **Follow Relationship:** Removed from `user_follows`
- **Connection:** No connection exists, nothing to remove
- **Following List:** User removed from following list
- **Button Display:** Changes to **"Follow"** button

---

## 🔍 Database Schema

### **Tables Involved:**

1. **`user_follows`**
   - Stores direct follow relationships
   - Columns: `follower_id`, `following_id`

2. **`user_connections`**
   - Stores connection relationships
   - Columns: `user_id_1`, `user_id_2` (normalized order)

3. **`connection_requests`**
   - Stores pending connection requests
   - Columns: `requester_id`, `receiver_id`, `status`

---

## ✅ Verification Checklist

- [x] Connected users show as "Following" (no follow button)
- [x] Unfollowing removes connection if it exists
- [x] Following does NOT create connection
- [x] Following list includes connected users
- [x] `isFollowing` checks both follows and connections
- [x] Backend logs connection removal on unfollow

---

## 🧪 Testing Scenarios

### **Test 1: Connect → Should Show as Following**
1. User A sends connection request to User B
2. User B accepts
3. **Expected:** User B appears in User A's following list
4. **Expected:** `isFollowing(User A, User B)` returns `true`
5. **Expected:** UI shows "Following" button

### **Test 2: Unfollow Connected User → Connection Removed for BOTH**
1. User A and User B are connected (mutual connection)
2. User A unfollows User B
3. **Expected:** Follow relationship removed (User A → User B)
4. **Expected:** Reverse follow relationship removed (User B → User A, if existed)
5. **Expected:** Connection removed from `user_connections` (affects both users)
6. **Expected:** User B removed from User A's following list
7. **Expected:** User A removed from User B's following list (if they were following)
8. **Expected:** UI shows "Follow" button for both users
9. **Expected:** Connection completely cut for BOTH users

### **Test 3: Follow (Not Connected) → No Connection Created**
1. User A follows User B (not connected)
2. **Expected:** Follow relationship created
3. **Expected:** NO connection created in `user_connections`
4. **Expected:** User B appears in User A's following list

### **Test 4: Unfollow (Not Connected) → Only Follow Removed**
1. User A follows User B (not connected)
2. User A unfollows User B
3. **Expected:** Follow relationship removed
4. **Expected:** No connection to remove (none existed)
5. **Expected:** User B removed from User A's following list

---

## 📝 Code Changes Summary

### **Files Modified:**

1. **`backend/network/network.model.js`**
   - ✅ Updated `isFollowing()` to check connections
   - ✅ Updated `getFollowing()` to include connected users
   - ✅ Updated `unfollowUser()` to remove connections
   - ✅ Added logging for connection removal

### **Files NOT Modified (Already Correct):**

1. **`backend/network/network.model.js`**
   - ✅ `followUser()` - Already correct (doesn't create connections)

2. **`frontend/app/(pages)/network/page.tsx`**
   - ✅ Already uses `isFollowing` endpoint which now includes connections
   - ✅ No changes needed

---

## 🚀 Deployment Notes

1. **Database:** No schema changes required
2. **Backend:** Restart required for changes to take effect
3. **Frontend:** No changes required (uses existing endpoints)
4. **Backward Compatibility:** ✅ Maintained (existing follows/connections work as before)

---

## 🔍 Debugging

### **Check Connection Status:**
```sql
SELECT * FROM user_connections 
WHERE (user_id_1 = 'USER_A_ID' AND user_id_2 = 'USER_B_ID') 
   OR (user_id_1 = 'USER_B_ID' AND user_id_2 = 'USER_A_ID');
```

### **Check Follow Status:**
```sql
SELECT * FROM user_follows 
WHERE follower_id = 'USER_A_ID' AND following_id = 'USER_B_ID';
```

### **Backend Logs:**
Look for:
- `[isFollowing] Users ... are connected, returning true (auto-follow)`
- `[unfollowUser] Removing connection between ... (connection removed due to unfollow)`
- `[getFollowing] Found N users (includes direct follows and connections)`

---

## 📞 Summary

**What Changed:**
1. ✅ Connected users automatically show as "Following"
2. ✅ Unfollowing removes connection if it exists
3. ✅ Following does NOT create connection (unchanged)
4. ✅ Following list includes connected users

**What Stayed the Same:**
- ✅ Follow endpoint behavior (doesn't create connections)
- ✅ Connection accept flow (creates mutual follows)
- ✅ Frontend code (no changes needed)

**Result:**
- Connected users = Automatically following (no follow button needed)
- Unfollow = Removes connection automatically
- Follow = Independent of connections
