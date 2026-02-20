# Athlinked Environment Configuration Guide

This document describes the environment variables used in the Athlinked project. The project consists of a Next.js frontend and a Node.js/Express backend.

## Setting Up Environment Variables

1.  **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in the values.
2.  **Frontend**: Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values.

---

## Backend Variables (`backend/.env`)

The backend uses `dotenv` to load configurations. Some variables support dual naming for compatibility with different environments.

### Database Configuration
| Variable | Description | Fallback / Notes |
| :--- | :--- | :--- |
| `DB_HOST` / `host` | Database server hostname | Default: `localhost` |
| `DB_PORT` / `port` | Database server port | Default: `5432` |
| `DB_NAME` / `database` | Database name | |
| `DB_USER` / `username` | Database user | |
| `DB_PASSWORD` / `password` | Database password | |
| `DB_SSL` / `sslmode` | SSL mode for connection | Set to `true` or `require` for cloud DBs |
| `DB_SSL_REJECT_UNAUTHORIZED` | Whether to reject unauthorized SSL | Default: `true`. Set `false` for self-signed certs. |
| `DB_POOL_MAX` | Max database connections | Default: `30`, Cap: `50` |

### Server Configuration
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the backend server | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | URL of the frontend application | Used for CORS and Socket.io |
| `CLIENT_URL` | Alternative to `FRONTEND_URL` | |

### Authentication (JWT)
| Variable | Description |
| :--- | :--- |
| `JWT_SECRET` | Secret key for signing Access Tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | Validity period for access tokens (e.g., `2h`) |
| `REFRESH_TOKEN_EXPIRES_IN` | Validity period for refresh tokens (e.g., `7d`) |

### AWS S3 Storage
Used for uploading profile images, posts, and messages media.

| Variable | Description | Notes |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | Required for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | Required for S3 |
| `AWS_REGION` | AWS Region | Default: `us-east-1` |
| `AWS_S3_BUCKET_NAME` | S3 Bucket Name | |
| `S3_PRESIGNED_URL_EXPIRATION` | Duration for shared links | Max: `604800` (7 days) |

### Email (SMTP)
| Variable | Description | Notes |
| :--- | :--- | :--- |
| `SMTP_HOST` | SMTP server host | Default: `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | Default: `587` |
| `SMTP_USER` | Email address for sending | |
| `SMTP_PASS` / `SMTP_PASSWORD` | Email password or app password | |
| `SMTP_FROM` | "From" address in emails | Defaults to `SMTP_USER` |
| `DEEP_LINK_SCHEME` | Mobile app deep link scheme | Default: `athlinked`. Used for password reset. |

### Firebase (Push Notifications)
| Variable | Description |
| :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to `service-account.json` file |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON string of service account (for prod) |

---

## Frontend Variables (`frontend/.env.local`)

Next.js requires the `NEXT_PUBLIC_` prefix for variables to be accessible in the browser.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL of the backend API | `http://localhost:3001` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | |

---

## Docker Configuration
The `docker-compose.yml` file uses these variables to orchestrate containers. Ensure the `PORT` matches between your `.env` and Docker configuration if you change it.
