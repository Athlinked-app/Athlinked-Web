# Flutter Guide: Network Page API Calls

## 📋 Overview

This document provides complete API call information for the Network Page, including all endpoints, request/response formats, and usage examples for Flutter developers.

---

## 🔄 API Calls Summary

### **Total API Calls on Network Page Load: 4-5 calls**

1. **GET `/api/profile`** - Get current user profile (for header display)
2. **GET `/api/network/followers/{userId}`** - Get followers list
3. **GET `/api/network/following/{userId}`** - Get following list
4. **GET `/api/network/invitations`** - Get connection requests (invitations)
5. **GET `/api/network/is-following/{userId}`** - Check follow status (for each follower not in following list)

### **Additional API Calls (User Actions):**

6. **POST `/api/network/follow/{userId}`** - Follow a user
7. **POST `/api/network/unfollow/{userId}`** - Unfollow a user
8. **POST `/api/network/accept/{requestId}`** - Accept connection request
9. **POST `/api/network/reject/{requestId}`** - Reject connection request

---

## 📡 Detailed API Endpoints

---

### **1. Get Current User Profile**

**Purpose:** Fetch current user's profile data for header display

**Endpoint:**
```
GET /api/profile
```

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid-string",
    "fullName": "User Full Name",
    "email": "user@example.com",
    "username": "username or null",
    "userType": "athlete|coach|parent",
    "profileUrl": "url or null",
    "coverUrl": "url or null",
    "bio": "bio text or null",
    "city": "city name or null",
    "primarySport": "sport name or null",
    "sportsPlayed": "sport1, sport2" or null,
    "dob": "1999-12-19T18:30:00.000Z" or null,
    "userType": "athlete|coach|parent" or null
  }
}
```

**Flutter Usage:**
```dart
// Get current user profile
final response = await http.get(
  Uri.parse('$baseUrl/api/profile'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
);

final data = json.decode(response.body);
if (data['success'] == true) {
  final user = data['user'];
  // Use: user['fullName'], user['profileUrl'], etc.
}
```

---

### **2. Get Followers List**

**Purpose:** Get list of users who are following the current user

**Endpoint:**
```
GET /api/network/followers/{userId}
```

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `userId` (string, required) - User ID to get followers for

**Response:**
```json
{
  "success": true,
  "followers": [
    {
      "id": "uuid-string",
      "username": "username or null",
      "full_name": "User Full Name",
      "user_type": "athlete|coach|parent",
      "profile_url": "url or null"
    }
  ]
}
```

**Flutter Usage:**
```dart
// Get followers list
final response = await http.get(
  Uri.parse('$baseUrl/api/network/followers/$userId'),
  headers: {
    'Content-Type': 'application/json',
  },
);

final data = json.decode(response.body);
if (data['success'] == true) {
  final followers = data['followers'] as List;
  // Process followers list
}
```

---

### **3. Get Following List**

**Purpose:** Get list of users that the current user is following

**Endpoint:**
```
GET /api/network/following/{userId}
```

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `userId` (string, required) - User ID to get following list for

**Response:**
```json
{
  "success": true,
  "following": [
    {
      "id": "uuid-string",
      "username": "username or null",
      "full_name": "User Full Name",
      "user_type": "athlete|coach|parent",
      "profile_url": "url or null"
    }
  ]
}
```

**Flutter Usage:**
```dart
// Get following list
final response = await http.get(
  Uri.parse('$baseUrl/api/network/following/$userId'),
  headers: {
    'Content-Type': 'application/json',
  },
);

final data = json.decode(response.body);
if (data['success'] == true) {
  final following = data['following'] as List;
  // Process following list
}
```

---

### **4. Get Connection Requests (Invitations)**

**Purpose:** Get all pending connection requests for the current user

**Endpoint:**
```
GET /api/network/invitations
```

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request-uuid",
      "requester_id": "user-uuid",
      "receiver_id": "user-uuid",
      "status": "pending",
      "created_at": "2026-01-16T03:58:14.224Z",
      "user_id": "user-uuid",
      "username": "username or null",
      "full_name": "User Full Name",
      "user_type": "athlete|coach|parent",
      "profile_url": "url or null"
    }
  ]
}
```

**Flutter Usage:**
```dart
// Get connection requests
final response = await http.get(
  Uri.parse('$baseUrl/api/network/invitations'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
);

final data = json.decode(response.body);
if (data['success'] == true) {
  final requests = data['requests'] as List;
  // Process connection requests
}
```

---

### **5. Check Follow Status**

**Purpose:** Check if current user is following a specific user

**Endpoint:**
```
GET /api/network/is-following/{userId}
```

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `userId` (string, required) - User ID to check follow status for

**Query Parameters (Alternative):**
- `follower_id` (string, optional) - If not using auth token, pass follower ID

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "isFollowing": true
}
```

**Flutter Usage:**
```dart
// Check if following a user
final response = await http.get(
  Uri.parse('$baseUrl/api/network/is-following/$userId'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
);

final data = json.decode(response.body);
if (data['success'] == true) {
  final isFollowing = data['isFollowing'] as bool;
  // Use isFollowing status
}
```

**Note:** This is called for each follower who is not in the following list to determine if you're following them back.

---

### **6. Follow a User**

**Purpose:** Follow another user

**Endpoint:**
```
POST /api/network/follow/{userId}
```

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `userId` (string, required) - User ID to follow

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Empty body - user ID comes from token, target user from path)

**Response:**
```json
{
  "success": true,
  "message": "Successfully followed user"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Already following this user" | "Cannot follow yourself"
}
```

**Flutter Usage:**
```dart
// Follow a user
final response = await http.post(
  Uri.parse('$baseUrl/api/network/follow/$userId'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
  body: json.encode({}),
);

final data = json.decode(response.body);
if (data['success'] == true) {
  // User followed successfully
  // Refresh network data
} else {
  // Handle error: data['message']
}
```

---

### **7. Unfollow a User**

**Purpose:** Unfollow a user

**Endpoint:**
```
POST /api/network/unfollow/{userId}
```

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `userId` (string, required) - User ID to unfollow

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Empty body)

**Response:**
```json
{
  "success": true,
  "message": "Successfully unfollowed user"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Not following this user"
}
```

**Flutter Usage:**
```dart
// Unfollow a user
final response = await http.post(
  Uri.parse('$baseUrl/api/network/unfollow/$userId'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
  body: json.encode({}),
);

final data = json.decode(response.body);
if (data['success'] == true) {
  // User unfollowed successfully
  // Refresh network data
} else {
  // Handle error: data['message']
}
```

---

### **8. Accept Connection Request**

**Purpose:** Accept a pending connection request

**Endpoint:**
```
POST /api/network/accept/{requestId}
```

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `requestId` (string, required) - Connection request ID

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Empty body)

**Response:**
```json
{
  "success": true,
  "message": "Connection request accepted"
}
```

**Flutter Usage:**
```dart
// Accept connection request
final response = await http.post(
  Uri.parse('$baseUrl/api/network/accept/$requestId'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
  body: json.encode({}),
);

final data = json.decode(response.body);
if (data['success'] == true) {
  // Request accepted
  // Remove from invitations list
  // Refresh network data
} else {
  // Handle error: data['message']
}
```

---

### **9. Reject Connection Request**

**Purpose:** Reject a pending connection request

**Endpoint:**
```
POST /api/network/reject/{requestId}
```

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `requestId` (string, required) - Connection request ID

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Empty body)

**Response:**
```json
{
  "success": true,
  "message": "Connection request rejected"
}
```

**Flutter Usage:**
```dart
// Reject connection request
final response = await http.post(
  Uri.parse('$baseUrl/api/network/reject/$requestId'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'Content-Type': 'application/json',
  },
  body: json.encode({}),
);

final data = json.decode(response.body);
if (data['success'] == true) {
  // Request rejected
  // Remove from invitations list
} else {
  // Handle error: data['message']
}
```

---

## 📊 Complete Flow Diagram

### **Page Load Flow:**

```
1. Get Current User ID (from token/localStorage)
   ↓
2. GET /api/profile (for header)
   ↓
3. GET /api/network/followers/{userId}
   ↓
4. GET /api/network/following/{userId}
   ↓
5. GET /api/network/invitations
   ↓
6. For each follower NOT in following list:
   GET /api/network/is-following/{followerId}
```

### **Follow/Unfollow Flow:**

```
User clicks Follow/Unfollow button
   ↓
POST /api/network/follow/{userId} OR
POST /api/network/unfollow/{userId}
   ↓
If success:
   - Update local state
   - Refresh network data (call steps 2-6 again)
```

### **Accept/Reject Invitation Flow:**

```
User clicks Accept/Reject
   ↓
POST /api/network/accept/{requestId} OR
POST /api/network/reject/{requestId}
   ↓
If success:
   - Remove from invitations list
   - Refresh network data
```

---

## 🎯 Flutter Implementation Example

### **Complete Network Page Service:**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class NetworkService {
  final String baseUrl;
  final String? accessToken;

  NetworkService({required this.baseUrl, this.accessToken});

  // Get headers with authentication
  Map<String, String> getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }
    return headers;
  }

  // 1. Get current user profile
  Future<Map<String, dynamic>?> getCurrentUserProfile() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/profile'),
        headers: getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['user'];
        }
      }
      return null;
    } catch (e) {
      print('Error fetching user profile: $e');
      return null;
    }
  }

  // 2. Get followers list
  Future<List<dynamic>> getFollowers(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/followers/$userId'),
        headers: getHeaders(includeAuth: false),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['followers'] ?? [];
        }
      }
      return [];
    } catch (e) {
      print('Error fetching followers: $e');
      return [];
    }
  }

  // 3. Get following list
  Future<List<dynamic>> getFollowing(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/following/$userId'),
        headers: getHeaders(includeAuth: false),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['following'] ?? [];
        }
      }
      return [];
    } catch (e) {
      print('Error fetching following: $e');
      return [];
    }
  }

  // 4. Get connection requests
  Future<List<dynamic>> getInvitations() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/invitations'),
        headers: getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['requests'] ?? [];
        }
      }
      return [];
    } catch (e) {
      print('Error fetching invitations: $e');
      return [];
    }
  }

  // 5. Check follow status
  Future<bool> isFollowing(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/is-following/$userId'),
        headers: getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['isFollowing'] ?? false;
        }
      }
      return false;
    } catch (e) {
      print('Error checking follow status: $e');
      return false;
    }
  }

  // 6. Follow a user
  Future<bool> followUser(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/follow/$userId'),
        headers: getHeaders(),
        body: json.encode({}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error following user: $e');
      return false;
    }
  }

  // 7. Unfollow a user
  Future<bool> unfollowUser(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/unfollow/$userId'),
        headers: getHeaders(),
        body: json.encode({}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error unfollowing user: $e');
      return false;
    }
  }

  // 8. Accept connection request
  Future<bool> acceptInvitation(String requestId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/accept/$requestId'),
        headers: getHeaders(),
        body: json.encode({}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error accepting invitation: $e');
      return false;
    }
  }

  // 9. Reject connection request
  Future<bool> rejectInvitation(String requestId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/reject/$requestId'),
        headers: getHeaders(),
        body: json.encode({}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error rejecting invitation: $e');
      return false;
    }
  }

  // Complete network data fetch (all in one)
  Future<Map<String, dynamic>> fetchNetworkData(String userId) async {
    try {
      // Fetch all data in parallel
      final results = await Future.wait([
        getCurrentUserProfile(),
        getFollowers(userId),
        getFollowing(userId),
        getInvitations(),
      ]);

      final currentUser = results[0] as Map<String, dynamic>?;
      final followers = results[1] as List<dynamic>;
      final following = results[2] as List<dynamic>;
      final invitations = results[3] as List<dynamic>;

      // Build follow status map
      final followStatuses = <String, bool>{};
      
      // All users in following list are being followed
      for (var user in following) {
        followStatuses[user['id']] = true;
      }

      // Check follow status for followers not in following list
      for (var follower in followers) {
        final followerId = follower['id'] as String;
        if (followerId != userId && !followStatuses.containsKey(followerId)) {
          final isFollowingStatus = await isFollowing(followerId);
          followStatuses[followerId] = isFollowingStatus;
        }
      }

      return {
        'currentUser': currentUser,
        'followers': followers,
        'following': following,
        'invitations': invitations,
        'followStatuses': followStatuses,
      };
    } catch (e) {
      print('Error fetching network data: $e');
      return {
        'currentUser': null,
        'followers': [],
        'following': [],
        'invitations': [],
        'followStatuses': <String, bool>{},
      };
    }
  }
}
```

---

## 📱 Flutter Model Classes

### **User Model:**

```dart
class NetworkUser {
  final String id;
  final String? username;
  final String? fullName;
  final String? userType;
  final String? profileUrl;

  NetworkUser({
    required this.id,
    this.username,
    this.fullName,
    this.userType,
    this.profileUrl,
  });

  factory NetworkUser.fromJson(Map<String, dynamic> json) {
    return NetworkUser(
      id: json['id'] as String,
      username: json['username'] as String?,
      fullName: json['full_name'] as String?,
      userType: json['user_type'] as String?,
      profileUrl: json['profile_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'user_type': userType,
      'profile_url': profileUrl,
    };
  }
}
```

### **Connection Request Model:**

```dart
class ConnectionRequest {
  final String id;
  final String requesterId;
  final String receiverId;
  final String status;
  final DateTime createdAt;
  final String userId;
  final String? username;
  final String? fullName;
  final String? userType;
  final String? profileUrl;

  ConnectionRequest({
    required this.id,
    required this.requesterId,
    required this.receiverId,
    required this.status,
    required this.createdAt,
    required this.userId,
    this.username,
    this.fullName,
    this.userType,
    this.profileUrl,
  });

  factory ConnectionRequest.fromJson(Map<String, dynamic> json) {
    return ConnectionRequest(
      id: json['id'] as String,
      requesterId: json['requester_id'] as String,
      receiverId: json['receiver_id'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      userId: json['user_id'] as String,
      username: json['username'] as String?,
      fullName: json['full_name'] as String?,
      userType: json['user_type'] as String?,
      profileUrl: json['profile_url'] as String?,
    );
  }
}
```

---

## 🔄 Optimization Notes

### **Current Implementation:**
- **4-5 API calls** on page load
- **1 additional call per follower** not in following list (to check follow status)

### **Potential Optimization:**
The follow status check (step 5) could be optimized by:
1. Including follow status in the followers/following endpoints
2. Using a batch endpoint to check multiple users at once

**Current:** N+1 problem (1 call per follower)
**Optimized:** Could be reduced to 3-4 calls total

---

## 📝 Summary Table

| # | Endpoint | Method | Auth | Purpose | When Called |
|---|----------|--------|------|---------|-------------|
| 1 | `/api/profile` | GET | ✅ | Get current user | Page load |
| 2 | `/api/network/followers/{userId}` | GET | ❌ | Get followers | Page load |
| 3 | `/api/network/following/{userId}` | GET | ❌ | Get following | Page load |
| 4 | `/api/network/invitations` | GET | ✅ | Get requests | Page load |
| 5 | `/api/network/is-following/{userId}` | GET | ✅ | Check status | For each follower not in following |
| 6 | `/api/network/follow/{userId}` | POST | ✅ | Follow user | User action |
| 7 | `/api/network/unfollow/{userId}` | POST | ✅ | Unfollow user | User action |
| 8 | `/api/network/accept/{requestId}` | POST | ✅ | Accept request | User action |
| 9 | `/api/network/reject/{requestId}` | POST | ✅ | Reject request | User action |

---

## 🚀 Quick Start for Flutter

1. **Initialize Service:**
   ```dart
   final networkService = NetworkService(
     baseUrl: 'http://localhost:3001/api',
     accessToken: 'your-access-token',
   );
   ```

2. **Fetch Network Data:**
   ```dart
   final data = await networkService.fetchNetworkData(userId);
   final followers = data['followers'] as List;
   final following = data['following'] as List;
   final invitations = data['invitations'] as List;
   final followStatuses = data['followStatuses'] as Map<String, bool>;
   ```

3. **Handle User Actions:**
   ```dart
   // Follow
   final success = await networkService.followUser(userId);
   if (success) {
     // Refresh data
     await networkService.fetchNetworkData(currentUserId);
   }

   // Accept invitation
   final accepted = await networkService.acceptInvitation(requestId);
   if (accepted) {
     // Remove from list and refresh
   }
   ```

---

## ⚠️ Important Notes

1. **Authentication:** Most endpoints require Bearer token in `Authorization` header
2. **User ID:** Get from token or localStorage after login
3. **Error Handling:** Always check `success` field in response
4. **Refresh Data:** After follow/unfollow/accept/reject, refresh network data
5. **Follow Status:** Check status for followers not in following list to show correct button state

---

## 🔍 Testing in Postman

See `POSTMAN_TEST_SIGNUP_USERS.md` for detailed Postman testing instructions for similar endpoints.

---

## 📞 Support

For questions or issues:
1. Check backend logs for error messages
2. Verify authentication token is valid
3. Ensure user ID format is correct (UUID)
4. Check network connectivity
