# Stats API Documentation

Dynamic sports profile system for Athlinked.

## Database Schema

The system uses the following tables:
- `sports` - Master list of sports
- `sport_positions` - Positions for each sport
- `position_fields` - Fields/attributes for each position
- `user_sport_profiles` - Links users to sport + position combinations
- `user_position_stats` - Stores user-entered stat values

## API Endpoints

All endpoints are prefixed with `/api` when mounted in the Express app.

### 1. Get All Sports

**GET** `/api/sports`

Returns all available sports.

**Response:**
```json
{
  "success": true,
  "sports": [
    {
      "id": "uuid",
      "name": "Basketball"
    }
  ]
}
```

---

### 2. Get Positions for a Sport

**GET** `/api/sports/:sportId/positions`

Returns all positions for a specific sport.

**Parameters:**
- `sportId` (UUID) - The sport ID

**Response:**
```json
{
  "success": true,
  "positions": [
    {
      "id": "uuid",
      "name": "Point Guard",
      "sport_name": "Basketball"
    }
  ]
}
```

---

### 3. Get Fields for a Position

**GET** `/api/positions/:positionId/fields`

Returns all fields for a position, ordered by `sort_order`. Used for dynamic form generation.

**Parameters:**
- `positionId` (UUID) - The position ID

**Response:**
```json
{
  "success": true,
  "fields": [
    {
      "field_id": "uuid",
      "field_key": "wingspan",
      "field_label": "Wingspan",
      "field_type": "number",
      "unit": "inches",
      "is_required": false
    }
  ]
}
```

**Field Types:**
- `number` - Numeric values
- `percentage` - Percentage values
- `time` - Time measurements
- `text` - Text input
- `link` - URL/HUDL links

---

### 4. Create / Update User Sport Profile

**POST** `/api/user/sport-profile`

Creates or retrieves a user sport profile. If a profile already exists for the user + sport + position combination, returns the existing profile ID.

**Headers:**
- Authentication required (req.user.id must be set)

**Request Body:**
```json
{
  "sportId": "uuid",
  "positionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "user_sport_profile_id": "uuid",
  "message": "User sport profile created or retrieved successfully"
}
```

---

### 5. Save User Position Stats

**POST** `/api/user/position-stats`

Saves or updates user position stats. Uses UPSERT logic - deletes existing stats and inserts new ones.

**Headers:**
- Authentication required (req.user.id must be set)

**Request Body:**
```json
{
  "userSportProfileId": "uuid",
  "stats": [
    {
      "fieldId": "uuid",
      "value": "12.5"
    },
    {
      "fieldId": "uuid",
      "value": "85"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User position stats saved successfully"
}
```

**Note:** All existing stats for the profile are deleted before inserting new ones. This ensures data consistency.

---

### 6. Get User Stats for a Sport Profile

**GET** `/api/user/sport-profile/:id/stats`

Retrieves all saved stats for a user's sport profile.

**Headers:**
- Authentication required (req.user.id must be set)

**Parameters:**
- `id` (UUID) - The user_sport_profile_id

**Response:**
```json
{
  "success": true,
  "sport_name": "Basketball",
  "position_name": "Point Guard",
  "fields": [
    {
      "field_label": "Wingspan",
      "value": "72",
      "unit": "inches"
    },
    {
      "field_label": "Points per Game",
      "value": "15.5",
      "unit": null
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Implementation Notes

- All queries use parameterized SQL to prevent SQL injection
- UUIDs are used for all primary keys
- Names are denormalized (copied) at insert time for performance
- IDs remain the source of truth for relationships
- No ORM is used - raw SQL with `pg` library
- Transaction support for multi-step operations

---

## Database Requirements

Ensure the following tables exist with the exact schema:

1. **sports** - id (UUID PK), name (TEXT unique)
2. **sport_positions** - id (UUID PK), sport_id (UUID FK), sport_name (TEXT), name (TEXT)
3. **position_fields** - id (UUID PK), sport_id (UUID), sport_name (TEXT), position_id (UUID), position_name (TEXT), field_key (TEXT), field_label (TEXT), field_type (TEXT), unit (TEXT), is_required (BOOLEAN), sort_order (INT)
4. **user_sport_profiles** - id (UUID PK), user_id (UUID), sport_id (UUID), sport_name (TEXT), position_id (UUID), position_name (TEXT), created_at (TIMESTAMP)
5. **user_position_stats** - id (UUID PK), user_sport_profile_id (UUID), field_id (UUID), field_key (TEXT), field_label (TEXT), unit (TEXT), value (TEXT), created_at (TIMESTAMP), updated_at (TIMESTAMP)

