# Notifications API

Backend APIs for the notification system in Athlinked.

## Database Schema

The `notifications` table has the following structure:

- `id` (UUID, PK)
- `recipient_user_id` (UUID, FK → users.id)
- `actor_user_id` (UUID, FK → users.id, nullable)
- `actor_full_name` (TEXT)
- `type` (TEXT) - Values: `like`, `comment`, `mention`, `follow_request`, `follow_accepted`
- `entity_type` (TEXT) - Examples: `post`, `comment`, `profile`, `clip`
- `entity_id` (UUID)
- `message` (TEXT) - Pre-built message text
- `is_read` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)

## API Endpoints

### 1. Get Notifications

**GET** `/api/notifications`

Get notifications for the logged-in user.

**Query Parameters:**

- `limit` (optional, default: 20, max: 100) - Number of notifications to return
- `offset` (optional, default: 0) - Number of notifications to skip

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "actorFullName": "John Doe",
      "type": "like",
      "message": "John Doe liked your post",
      "entityType": "post",
      "entityId": "uuid",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. Get Unread Notification Count

**GET** `/api/notifications/unread-count`

Get the count of unread notifications for the logged-in user.

**Response:**

```json
{
  "success": true,
  "unreadCount": 5
}
```

### 3. Mark Notification as Read

**POST** `/api/notifications/:id/read`

Mark a specific notification as read. Only the recipient can mark their own notifications as read.

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "id": "uuid",
    "isRead": true
  }
}
```

### 4. Mark All Notifications as Read

**POST** `/api/notifications/read-all`

Mark all notifications as read for the logged-in user.

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 10
}
```

## Helper Function for Creating Notifications

Use the `createNotification` helper function to create notifications from other parts of the codebase (e.g., when a user likes a post, comments, etc.).

### Import

```javascript
const { createNotification } = require('./notifications/notifications.helper');
```

### Usage Examples

#### Like Notification

```javascript
await createNotification({
  recipientUserId: postOwnerId,
  actorUserId: currentUserId,
  actorFullName: currentUserFullName,
  type: 'like',
  entityType: 'post',
  entityId: postId,
  message: `${currentUserFullName} liked your post`,
});
```

#### Comment Notification

```javascript
await createNotification({
  recipientUserId: postOwnerId,
  actorUserId: currentUserId,
  actorFullName: currentUserFullName,
  type: 'comment',
  entityType: 'post',
  entityId: postId,
  message: `${currentUserFullName} commented on your post`,
});
```

#### Mention Notification

```javascript
await createNotification({
  recipientUserId: mentionedUserId,
  actorUserId: currentUserId,
  actorFullName: currentUserFullName,
  type: 'mention',
  entityType: 'post',
  entityId: postId,
  message: `${currentUserFullName} mentioned you in a post`,
});
```

#### Follow Request Notification

```javascript
await createNotification({
  recipientUserId: userToFollowId,
  actorUserId: currentUserId,
  actorFullName: currentUserFullName,
  type: 'follow_request',
  entityType: 'profile',
  entityId: currentUserId,
  message: `${currentUserFullName} sent you a follow request`,
});
```

#### Follow Accepted Notification

```javascript
await createNotification({
  recipientUserId: followerId,
  actorUserId: currentUserId,
  actorFullName: currentUserFullName,
  type: 'follow_accepted',
  entityType: 'profile',
  entityId: currentUserId,
  message: `${currentUserFullName} accepted your follow request`,
});
```

### Important Notes

1. **Self-Actions**: The helper function automatically skips creating notifications when `actorUserId === recipientUserId` (users cannot notify themselves).

2. **Required Fields**: All fields are required except `actorUserId` (which can be null for system notifications).

3. **Message Format**: The `message` field should be pre-built and ready to display. It should include the actor's name and the action.

4. **Entity Types**: Use appropriate entity types like `post`, `comment`, `profile`, `clip`, etc.

5. **Error Handling**: The function will throw an error if required fields are missing or if there's a database error.

## Database Setup

Run the SQL script to create the notifications table:

```bash
psql your_database_name < notifications/create-notifications-table.sql
```

Or manually run the SQL commands from `create-notifications-table.sql`.

## Authentication

All endpoints require authentication. The system expects `req.user.id` to contain the authenticated user's UUID.

If authentication middleware is not set up, you may need to add it to the routes or modify the controllers to handle authentication differently.
