# Flutter Guide: Connection and Follow Relationship

## 📋 Overview

This document provides a complete guide for Flutter developers on implementing the **Connection** and **Follow** relationship features. These are **two separate** relationships with specific business rules.

---

## 🔑 Key Business Rules

### **Rule 1: Connect and Follow are SEPARATE**
- ✅ **Connect** and **Follow** are **different** relationships
- ✅ Users can **follow** without connecting
- ✅ Users can **connect** without following (though accepting a connection creates mutual follows)
- ✅ **Following does NOT automatically create a connection**
- ✅ **Connecting does NOT require following first**

### **Rule 2: Connected Users = Automatically Following (for UI)**
- ✅ If two users are **connected**, they are automatically considered as **following each other** (for UI display)
- ✅ Connected users will show **"Following"** button instead of **"Follow"** button
- ✅ The `isFollowing` endpoint returns `true` for connected users

### **Rule 3: Unfollow = Remove Connection**
- ✅ When two users are **mutually connected** and one **unfollows** the other:
  1. Remove the follow relationship (User A → User B)
  2. Remove the reverse follow relationship (User B → User A) if it exists
  3. Remove the connection (affects both users)
- ✅ This ensures the connection is **completely cut for BOTH users**

### **Rule 4: Following List Includes Connections**
- ✅ The **following list** includes both:
  1. Direct follows (from `user_follows` table)
  2. Connected users (from `user_connections` table)
- ✅ Connected users automatically appear in the following list

---

## 📡 API Endpoints

### **Base URL**
```
http://your-api-url/api/network
```

### **Authentication**
All endpoints (except public ones) require Bearer token:
```
Authorization: Bearer {accessToken}
```

---

## 🔄 Follow Endpoints

### **1. Follow a User**

**Endpoint:**
```
POST /api/network/follow/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to follow

**Request Body:** None (userId from path, current user from token)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User followed successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Cannot follow yourself"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "User authentication required"
}
```

**Flutter Implementation:**
```dart
Future<bool> followUser(String userId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/network/follow/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      return true;
    } else {
      throw Exception(data['message'] ?? 'Failed to follow user');
    }
  } catch (e) {
    print('Error following user: $e');
    rethrow;
  }
}
```

**Important Notes:**
- ✅ Following does **NOT** create a connection
- ✅ Following is independent of connections
- ✅ You can follow someone without being connected

---

### **2. Unfollow a User**

**Endpoint:**
```
POST /api/network/unfollow/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to unfollow

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "User authentication required"
}
```

**Flutter Implementation:**
```dart
Future<bool> unfollowUser(String userId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/network/unfollow/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      // IMPORTANT: If users were connected, the connection is automatically removed
      // No need to call disconnect endpoint separately
      return true;
    } else {
      throw Exception(data['message'] ?? 'Failed to unfollow user');
    }
  } catch (e) {
    print('Error unfollowing user: $e');
    rethrow;
  }
}
```

**Important Notes:**
- ⚠️ **If users are connected, unfollowing will automatically remove the connection**
- ⚠️ **Both users will no longer be connected after unfollow**
- ⚠️ **Both follow relationships (A→B and B→A) are removed**

---

### **3. Check if Following**

**Endpoint:**
```
GET /api/network/is-following/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to check

**Response (Success - 200):**
```json
{
  "success": true,
  "isFollowing": true
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "User authentication required"
}
```

**Flutter Implementation:**
```dart
Future<bool> isFollowing(String userId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/network/is-following/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      // Returns true if:
      // 1. Direct follow exists, OR
      // 2. Users are connected
      return data['isFollowing'] ?? false;
    } else {
      throw Exception(data['message'] ?? 'Failed to check follow status');
    }
  } catch (e) {
    print('Error checking follow status: $e');
    return false;
  }
}
```

**Important Notes:**
- ✅ Returns `true` if users are **directly following** OR **connected**
- ✅ Use this to determine if "Follow" or "Following" button should be shown
- ✅ Connected users will return `isFollowing: true`

---

### **4. Get Following List**

**Endpoint:**
```
GET /api/network/following/{userId}
```

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `userId` (string, required) - User ID

**Response (Success - 200):**
```json
{
  "success": true,
  "following": [
    {
      "id": "user-uuid",
      "username": "username or null",
      "fullName": "User Full Name",
      "userType": "athlete|coach|parent",
      "profileUrl": "url or null"
    }
  ]
}
```

**Important Notes:**
- ✅ Includes both **direct follows** and **connected users**
- ✅ Connected users automatically appear in this list
- ✅ No need to merge separate lists

---

### **5. Get Followers List**

**Endpoint:**
```
GET /api/network/followers/{userId}
```

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `userId` (string, required) - User ID

**Response (Success - 200):**
```json
{
  "success": true,
  "followers": [
    {
      "id": "user-uuid",
      "username": "username or null",
      "fullName": "User Full Name",
      "userType": "athlete|coach|parent",
      "profileUrl": "url or null"
    }
  ]
}
```

---

## 🔗 Connection Endpoints

### **1. Send Connection Request**

**Endpoint:**
```
POST /api/network/connect/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to connect with

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "request": {
    "id": "request-uuid",
    "requester_id": "requester-uuid",
    "receiver_id": "receiver-uuid",
    "status": "pending",
    "created_at": "2024-01-16T10:30:00.000Z"
  }
}
```

**Response (Error - 200, but success: false):**
```json
{
  "success": false,
  "message": "Already connected"
}
```

**Response (Error - 200, but success: false):**
```json
{
  "success": false,
  "message": "Connection request already pending"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Cannot send connection request to yourself"
}
```

**Flutter Implementation:**
```dart
Future<ConnectionRequestResult> sendConnectionRequest(String userId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/network/connect/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200) {
      if (data['success'] == true) {
        return ConnectionRequestResult(
          success: true,
          request: ConnectionRequest.fromJson(data['request']),
        );
      } else {
        // Handle specific error messages
        final message = data['message'] ?? 'Failed to send connection request';
        return ConnectionRequestResult(
          success: false,
          message: message,
        );
      }
    } else {
      throw Exception('HTTP ${response.statusCode}');
    }
  } catch (e) {
    print('Error sending connection request: $e');
    return ConnectionRequestResult(
      success: false,
      message: 'Network error: $e',
    );
  }
}
```

**Important Notes:**
- ✅ Checks if users are **already connected** in `user_connections` table
- ✅ Returns "Already connected" only if actual connection exists
- ✅ Returns "Connection request already pending" if request exists with status 'pending'
- ✅ **Does NOT require users to follow each other first**

---

### **2. Accept Connection Request**

**Endpoint:**
```
POST /api/network/accept/{requestId}
```

**Authentication:** Required

**Path Parameters:**
- `requestId` (string, required) - Connection request ID

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Connection request accepted"
}
```

**Response (Error - 200, but success: false):**
```json
{
  "success": false,
  "message": "Connection request not found"
}
```

**Flutter Implementation:**
```dart
Future<bool> acceptConnectionRequest(String requestId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/network/accept/$requestId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      // IMPORTANT: After accepting:
      // 1. Connection is created in user_connections table
      // 2. Mutual follows are created (if they don't exist)
      // 3. Users are now connected
      return true;
    } else {
      throw Exception(data['message'] ?? 'Failed to accept connection request');
    }
  } catch (e) {
    print('Error accepting connection request: $e');
    rethrow;
  }
}
```

**Important Notes:**
- ✅ Creates connection in `user_connections` table
- ✅ Creates mutual follows (if they don't already exist)
- ✅ Updates connection request status to 'accepted'
- ✅ Both users are now connected

---

### **3. Reject Connection Request**

**Endpoint:**
```
POST /api/network/reject/{requestId}
```

**Authentication:** Required

**Path Parameters:**
- `requestId` (string, required) - Connection request ID

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Connection request rejected"
}
```

**Flutter Implementation:**
```dart
Future<bool> rejectConnectionRequest(String requestId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/network/reject/$requestId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      return true;
    } else {
      throw Exception(data['message'] ?? 'Failed to reject connection request');
    }
  } catch (e) {
    print('Error rejecting connection request: $e');
    rethrow;
  }
}
```

---

### **4. Get Connection Requests (Invitations)**

**Endpoint:**
```
GET /api/network/invitations
```

**Authentication:** Required

**Response (Success - 200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request-uuid",
      "requester_id": "requester-uuid",
      "receiver_id": "receiver-uuid",
      "status": "pending",
      "created_at": "2024-01-16T10:30:00.000Z",
      "user_id": "requester-uuid",
      "username": "username or null",
      "full_name": "Requester Full Name",
      "user_type": "athlete|coach|parent",
      "profile_url": "url or null"
    }
  ]
}
```

**Flutter Implementation:**
```dart
Future<List<ConnectionRequest>> getConnectionRequests() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/network/invitations'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      final requests = data['requests'] as List;
      return requests.map((r) => ConnectionRequest.fromJson(r)).toList();
    } else {
      throw Exception(data['message'] ?? 'Failed to get connection requests');
    }
  } catch (e) {
    print('Error getting connection requests: $e');
    return [];
  }
}
```

---

### **5. Check Connection Status**

**Endpoint:**
```
GET /api/network/connection-status/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to check connection status with

**Response (Success - 200):**
```json
{
  "success": true,
  "exists": true,
  "status": "connected"
}
```

**Possible status values:**
- `"connected"` - Users are already connected
- `"pending"` - Connection request is pending
- `null` - No connection or request exists

**Flutter Implementation:**
```dart
Future<ConnectionStatus> checkConnectionStatus(String userId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/network/connection-status/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      return ConnectionStatus(
        exists: data['exists'] ?? false,
        status: data['status'],
      );
    } else {
      throw Exception(data['message'] ?? 'Failed to check connection status');
    }
  } catch (e) {
    print('Error checking connection status: $e');
    return ConnectionStatus(exists: false, status: null);
  }
}
```

---

### **6. Check if Connected**

**Endpoint:**
```
GET /api/network/is-connected/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID to check

**Response (Success - 200):**
```json
{
  "success": true,
  "isConnected": true
}
```

**Flutter Implementation:**
```dart
Future<bool> isConnected(String userId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/network/is-connected/$userId'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200 && data['success'] == true) {
      return data['isConnected'] ?? false;
    } else {
      throw Exception(data['message'] ?? 'Failed to check connection');
    }
  } catch (e) {
    print('Error checking connection: $e');
    return false;
  }
}
```

---

### **7. Get Connections List**

**Endpoint:**
```
GET /api/network/connections/{userId}
```

**Authentication:** Required

**Path Parameters:**
- `userId` (string, required) - User ID

**Response (Success - 200):**
```json
{
  "success": true,
  "connections": [
    {
      "id": "user-uuid",
      "username": "username or null",
      "full_name": "User Full Name",
      "user_type": "athlete|coach|parent",
      "profile_url": "url or null",
      "created_at": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

---

## 📦 Flutter Models

### **User Model**
```dart
class User {
  final String id;
  final String? username;
  final String fullName;
  final String? userType;
  final String? profileUrl;
  final String? coverUrl;
  final String? email;

  User({
    required this.id,
    this.username,
    required this.fullName,
    this.userType,
    this.profileUrl,
    this.coverUrl,
    this.email,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['user_id'] ?? '',
      username: json['username'],
      fullName: json['full_name'] ?? json['fullName'] ?? 'User',
      userType: json['user_type'] ?? json['userType'],
      profileUrl: json['profile_url'] ?? json['profileUrl'],
      coverUrl: json['cover_url'] ?? json['coverUrl'],
      email: json['email'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'user_type': userType,
      'profile_url': profileUrl,
      'cover_url': coverUrl,
      'email': email,
    };
  }
}
```

### **Connection Request Model**
```dart
class ConnectionRequest {
  final String id;
  final String requesterId;
  final String receiverId;
  final String status; // 'pending', 'accepted', 'rejected'
  final DateTime createdAt;
  final User? user; // User details of requester

  ConnectionRequest({
    required this.id,
    required this.requesterId,
    required this.receiverId,
    required this.status,
    required this.createdAt,
    this.user,
  });

  factory ConnectionRequest.fromJson(Map<String, dynamic> json) {
    return ConnectionRequest(
      id: json['id'] ?? '',
      requesterId: json['requester_id'] ?? json['requesterId'] ?? '',
      receiverId: json['receiver_id'] ?? json['receiverId'] ?? '',
      status: json['status'] ?? 'pending',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      user: json['user_id'] != null ? User.fromJson(json) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'requester_id': requesterId,
      'receiver_id': receiverId,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
```

### **Connection Status Model**
```dart
class ConnectionStatus {
  final bool exists;
  final String? status; // 'connected', 'pending', or null

  ConnectionStatus({
    required this.exists,
    this.status,
  });

  factory ConnectionStatus.fromJson(Map<String, dynamic> json) {
    return ConnectionStatus(
      exists: json['exists'] ?? false,
      status: json['status'],
    );
  }
}
```

### **Connection Request Result Model**
```dart
class ConnectionRequestResult {
  final bool success;
  final String? message;
  final ConnectionRequest? request;

  ConnectionRequestResult({
    required this.success,
    this.message,
    this.request,
  });
}
```

---

## 🔧 Flutter Service Implementation

### **Network Service Class**
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class NetworkService {
  final String baseUrl;
  final String Function() getAccessToken;

  NetworkService({
    required this.baseUrl,
    required this.getAccessToken,
  });

  // Follow endpoints
  Future<bool> followUser(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/follow/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      return response.statusCode == 200 && data['success'] == true;
    } catch (e) {
      print('Error following user: $e');
      rethrow;
    }
  }

  Future<bool> unfollowUser(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/unfollow/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // IMPORTANT: If users were connected, connection is automatically removed
        return true;
      } else {
        throw Exception(data['message'] ?? 'Failed to unfollow user');
      }
    } catch (e) {
      print('Error unfollowing user: $e');
      rethrow;
    }
  }

  Future<bool> isFollowing(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/is-following/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Returns true if directly following OR connected
        return data['isFollowing'] ?? false;
      } else {
        return false;
      }
    } catch (e) {
      print('Error checking follow status: $e');
      return false;
    }
  }

  Future<List<User>> getFollowing(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/following/$userId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        final following = data['following'] as List;
        // Includes both direct follows AND connected users
        return following.map((u) => User.fromJson(u)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error getting following list: $e');
      return [];
    }
  }

  Future<List<User>> getFollowers(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/followers/$userId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        final followers = data['followers'] as List;
        return followers.map((u) => User.fromJson(u)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error getting followers list: $e');
      return [];
    }
  }

  // Connection endpoints
  Future<ConnectionRequestResult> sendConnectionRequest(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/connect/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200) {
        if (data['success'] == true) {
          return ConnectionRequestResult(
            success: true,
            request: ConnectionRequest.fromJson(data['request']),
          );
        } else {
          return ConnectionRequestResult(
            success: false,
            message: data['message'] ?? 'Failed to send connection request',
          );
        }
      } else {
        throw Exception('HTTP ${response.statusCode}');
      }
    } catch (e) {
      print('Error sending connection request: $e');
      return ConnectionRequestResult(
        success: false,
        message: 'Network error: $e',
      );
    }
  }

  Future<bool> acceptConnectionRequest(String requestId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/accept/$requestId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Connection created, mutual follows created
        return true;
      } else {
        throw Exception(data['message'] ?? 'Failed to accept connection request');
      }
    } catch (e) {
      print('Error accepting connection request: $e');
      rethrow;
    }
  }

  Future<bool> rejectConnectionRequest(String requestId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/network/reject/$requestId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      return response.statusCode == 200 && data['success'] == true;
    } catch (e) {
      print('Error rejecting connection request: $e');
      rethrow;
    }
  }

  Future<List<ConnectionRequest>> getConnectionRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/invitations'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        final requests = data['requests'] as List;
        return requests.map((r) => ConnectionRequest.fromJson(r)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error getting connection requests: $e');
      return [];
    }
  }

  Future<ConnectionStatus> checkConnectionStatus(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/connection-status/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ConnectionStatus.fromJson(data);
      } else {
        return ConnectionStatus(exists: false, status: null);
      }
    } catch (e) {
      print('Error checking connection status: $e');
      return ConnectionStatus(exists: false, status: null);
    }
  }

  Future<bool> isConnected(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/is-connected/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return data['isConnected'] ?? false;
      } else {
        return false;
      }
    } catch (e) {
      print('Error checking connection: $e');
      return false;
    }
  }

  Future<List<User>> getConnections(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/network/connections/$userId'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        final connections = data['connections'] as List;
        return connections.map((u) => User.fromJson(u)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error getting connections: $e');
      return [];
    }
  }
}
```

---

## 🎨 UI Implementation Guide

### **Button Display Logic**

```dart
class UserActionButtons extends StatefulWidget {
  final String userId;
  final NetworkService networkService;

  const UserActionButtons({
    required this.userId,
    required this.networkService,
  });

  @override
  _UserActionButtonsState createState() => _UserActionButtonsState();
}

class _UserActionButtonsState extends State<UserActionButtons> {
  bool _isFollowing = false;
  bool _isConnected = false;
  ConnectionStatus? _connectionStatus;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    setState(() => _isLoading = true);
    
    // Check both follow and connection status
    final isFollowingResult = await widget.networkService.isFollowing(widget.userId);
    final connectionStatus = await widget.networkService.checkConnectionStatus(widget.userId);
    
    setState(() {
      _isFollowing = isFollowingResult;
      _isConnected = connectionStatus.status == 'connected';
      _connectionStatus = connectionStatus;
      _isLoading = false;
    });
  }

  Future<void> _handleFollow() async {
    try {
      await widget.networkService.followUser(widget.userId);
      setState(() => _isFollowing = true);
      // Show success message
    } catch (e) {
      // Show error message
    }
  }

  Future<void> _handleUnfollow() async {
    try {
      await widget.networkService.unfollowUser(widget.userId);
      setState(() {
        _isFollowing = false;
        _isConnected = false; // Connection is automatically removed
      });
      // Show success message
    } catch (e) {
      // Show error message
    }
  }

  Future<void> _handleConnect() async {
    try {
      final result = await widget.networkService.sendConnectionRequest(widget.userId);
      
      if (result.success) {
        // Show success: "Connection request sent"
        setState(() {
          _connectionStatus = ConnectionStatus(exists: true, status: 'pending');
        });
      } else {
        // Handle error messages
        if (result.message == 'Already connected') {
          // User is already connected
          setState(() => _isConnected = true);
        } else if (result.message == 'Connection request already pending') {
          // Request already sent
          setState(() {
            _connectionStatus = ConnectionStatus(exists: true, status: 'pending');
          });
        }
        // Show error message
      }
    } catch (e) {
      // Show error message
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return CircularProgressIndicator();
    }

    return Row(
      children: [
        // Follow/Unfollow Button
        if (_isFollowing)
          ElevatedButton(
            onPressed: _handleUnfollow,
            child: Text('Unfollow'),
          )
        else
          ElevatedButton(
            onPressed: _handleFollow,
            child: Text('Follow'),
          ),
        
        SizedBox(width: 8),
        
        // Connect Button (only show if not connected)
        if (!_isConnected && _connectionStatus?.status != 'pending')
          ElevatedButton(
            onPressed: _handleConnect,
            child: Text('Connect'),
          )
        else if (_connectionStatus?.status == 'pending')
          OutlinedButton(
            onPressed: null,
            child: Text('Request Pending'),
          )
        else if (_isConnected)
          OutlinedButton(
            onPressed: null,
            child: Text('Connected'),
          ),
      ],
    );
  }
}
```

---

## 📊 Flow Diagrams

### **Follow Flow**
```
User A clicks "Follow" on User B
   ↓
POST /api/network/follow/{userId}
   ↓
Backend creates follow relationship
   ↓
Response: { success: true }
   ↓
UI updates: "Follow" → "Following"
```

### **Unfollow Flow (Connected Users)**
```
User A clicks "Unfollow" on User B (they are connected)
   ↓
POST /api/network/unfollow/{userId}
   ↓
Backend:
  1. Removes follow (A → B)
  2. Removes reverse follow (B → A) if exists
  3. Removes connection (affects both)
   ↓
Response: { success: true }
   ↓
UI updates:
  - "Following" → "Follow"
  - "Connected" → "Connect"
  - Both users are no longer connected
```

### **Connection Request Flow**
```
User A clicks "Connect" on User B
   ↓
POST /api/network/connect/{userId}
   ↓
Backend checks:
  1. Are users already connected? → Return "Already connected"
  2. Is request pending? → Return "Request pending"
  3. Otherwise → Create connection request
   ↓
Response: { success: true, request: {...} }
   ↓
UI updates: "Connect" → "Request Pending"
```

### **Accept Connection Flow**
```
User B clicks "Accept" on connection request
   ↓
POST /api/network/accept/{requestId}
   ↓
Backend:
  1. Updates request status to 'accepted'
  2. Creates connection in user_connections
  3. Creates mutual follows (if they don't exist)
   ↓
Response: { success: true }
   ↓
UI updates:
  - "Request Pending" → "Connected"
  - "Follow" → "Following" (if wasn't following)
```

---

## ⚠️ Important Notes for Flutter Developers

### **1. Follow vs Connect**
- ✅ **Follow** = One-way relationship, can be done independently
- ✅ **Connect** = Two-way relationship, requires request + acceptance
- ✅ **Following does NOT create a connection**
- ✅ **Connecting does NOT require following first**

### **2. Unfollow Behavior**
- ⚠️ **If users are connected, unfollowing removes the connection**
- ⚠️ **Both users are affected** - connection is cut for both
- ⚠️ **Both follow relationships are removed** (A→B and B→A)

### **3. isFollowing Endpoint**
- ✅ Returns `true` if users are **directly following** OR **connected**
- ✅ Use this to determine button display
- ✅ Connected users will show "Following" button

### **4. Following List**
- ✅ Includes both **direct follows** and **connected users**
- ✅ No need to merge separate lists
- ✅ Connected users automatically appear

### **5. Connection Check**
- ✅ Always check `user_connections` table (via `isConnected` endpoint)
- ✅ Don't rely on `connection_requests` status alone
- ✅ "Already connected" only appears if actual connection exists

### **6. Error Handling**
- ✅ Handle "Already connected" message
- ✅ Handle "Connection request already pending" message
- ✅ Handle network errors gracefully
- ✅ Update UI state after each action

---

## 🧪 Testing Scenarios

### **Scenario 1: Follow Without Connect**
1. User A follows User B
2. ✅ User A is following User B
3. ✅ User A and User B are NOT connected
4. ✅ User A can still send connection request

### **Scenario 2: Connect Without Follow**
1. User A sends connection request to User B
2. User B accepts
3. ✅ User A and User B are connected
4. ✅ Mutual follows are created automatically
5. ✅ `isFollowing` returns `true` for both users

### **Scenario 3: Unfollow Connected User**
1. User A and User B are connected
2. User A unfollows User B
3. ✅ Follow relationship removed (A → B)
4. ✅ Reverse follow removed (B → A)
5. ✅ Connection removed for both users
6. ✅ Both users can send new connection request

### **Scenario 4: Check Connection Status**
1. User A checks connection status with User B
2. ✅ Returns `"connected"` if connection exists
3. ✅ Returns `"pending"` if request is pending
4. ✅ Returns `null` if no connection/request

---

## 📝 Summary

### **Key Takeaways:**
1. **Follow** and **Connect** are separate relationships
2. **Following does NOT create a connection**
3. **Unfollowing removes connection** if users are connected
4. **Connected users automatically show as "Following"**
5. **Following list includes connected users**
6. **Always check actual connection status**, not just request status

### **API Endpoints Summary:**
- **Follow:** `POST /api/network/follow/{userId}`
- **Unfollow:** `POST /api/network/unfollow/{userId}`
- **Check Following:** `GET /api/network/is-following/{userId}`
- **Get Following:** `GET /api/network/following/{userId}`
- **Get Followers:** `GET /api/network/followers/{userId}`
- **Connect:** `POST /api/network/connect/{userId}`
- **Accept:** `POST /api/network/accept/{requestId}`
- **Reject:** `POST /api/network/reject/{requestId}`
- **Get Requests:** `GET /api/network/invitations`
- **Check Status:** `GET /api/network/connection-status/{userId}`
- **Check Connected:** `GET /api/network/is-connected/{userId}`
- **Get Connections:** `GET /api/network/connections/{userId}`

---

**This guide provides everything you need to implement the connection and follow features correctly in Flutter!**
