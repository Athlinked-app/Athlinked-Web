# Clips API

Backend API for managing video clips and comments.

## Database Setup

Run the SQL schema file to create the required tables:

```sql
-- Run clips.schema.sql in your PostgreSQL database
```

The schema creates:

- `clips` table: Stores video clips with user information
- `clip_comments` table: Stores comments and replies (no username stored, fetched via JOIN)

## API Endpoints

### 1. Create Clip

**POST** `/api/clips`

**Auth Required:** Yes (user_id in body or auth middleware)

**Request Body:**

```json
{
  "user_id": "uuid",
  "video_url": "https://example.com/video.mp4",
  "description": "Optional description"
}
```

**Response:**

```json
{
  "success": true,
  "clip": {
    "id": "uuid",
    "user_id": "uuid",
    "username": "User Name",
    "video_url": "https://example.com/video.mp4",
    "description": "Description",
    "like_count": 0,
    "comment_count": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get Clips Feed

**GET** `/api/clips?page=1&limit=10`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "clips": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalClips": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Add Comment

**POST** `/api/clips/:clipId/comments`

**Auth Required:** Yes

**Request Body:**

```json
{
  "user_id": "uuid",
  "comment": "This is a comment"
}
```

**Response:**

```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "clip_id": "uuid",
    "user_id": "uuid",
    "comment": "This is a comment",
    "parent_comment_id": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Reply to Comment

**POST** `/api/comments/:commentId/reply`

**Auth Required:** Yes

**Request Body:**

```json
{
  "user_id": "uuid",
  "comment": "This is a reply"
}
```

**Response:**

```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "clip_id": "uuid",
    "user_id": "uuid",
    "comment": "This is a reply",
    "parent_comment_id": "parent-comment-uuid",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Get Comments for a Clip

**GET** `/api/clips/:clipId/comments`

**Response:**

```json
{
  "success": true,
  "comments": [
    {
      "id": "uuid",
      "clip_id": "uuid",
      "user_id": "uuid",
      "comment": "Main comment",
      "parent_comment_id": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "username": "User Name",
      "email": "user@example.com",
      "replies": [
        {
          "id": "uuid",
          "comment": "Reply comment",
          "parent_comment_id": "parent-uuid",
          "username": "Reply User",
          "replies": []
        }
      ]
    }
  ]
}
```

## Features

- ✅ UUID-based IDs
- ✅ Parameterized SQL queries (SQL injection protection)
- ✅ Transaction support for data consistency
- ✅ Username fetched from users table (not stored in clip_comments)
- ✅ Nested comment replies structure
- ✅ Pagination support
- ✅ Error handling
- ✅ Clean, readable code with async/await

## Notes

- Username is denormalized in `clips` table for performance
- Comments fetch username via JOIN from `users` table (not stored)
- All database operations use parameterized queries
- Transactions ensure atomic operations (e.g., adding comment + incrementing count)
