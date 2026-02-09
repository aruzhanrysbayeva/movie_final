# CineTrack (Movie Tracker)

A full-stack movie tracking app where users can browse movies, build a personal watchlist, and leave reviews. The backend is built with Node.js, Express, and MongoDB, following a modular structure (routes, controllers, models, middleware, configuration).

## Project Overview
- **Topic:** Movie tracking app (watchlist + reviews)
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** Static HTML/CSS/JS
- **Collections:** `users`, `movies`, `watchlists`
- **Authentication:** JWT with role-based access control (RBAC)
- **Email:** SMTP welcome email on registration (Nodemailer)

## Setup Instructions

### 1) Backend

```bash
cd /Users/test/Downloads/web2_final\ 2/backend
npm install
npm run dev
```

Create a `.env` file in `/Users/test/Downloads/web2_final 2/backend`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/movies
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d

# SMTP (optional)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="CineTrack <no-reply@yourdomain.com>"
SMTP_SECURE=false
```

### 2) Frontend
Open the HTML pages in `/Users/test/Downloads/web2_final 2/frontend/pages`.

## API Documentation

**Base URL:** `http://localhost:5000/api`

### Authentication (Public)
- `POST /auth/register`
  - Body: `username`, `email`, `password`, optional `role` (`user` or `premium`)
- `POST /auth/login`
  - Body: `email`, `password`

### User Management (Private)
- `GET /users/profile`
- `PUT /users/profile`
  - Body: `username`, `email`
- `GET /users/all` (Admin only)
- `PUT /users/:id/role` (Admin only)
  - Body: `role` (`user`, `premium`, `admin`)

### Movies (Resource)
- `GET /movies`
- `GET /movies/:id`
- `POST /movies` (Admin only)
- `PUT /movies/:id` (Admin only)
- `DELETE /movies/:id` (Admin only)

### Reviews (Private)
- `POST /movies/:id/reviews`
- `PUT /movies/:id/reviews/:reviewId` (Owner, Admin, or Moderator)
- `DELETE /movies/:id/reviews/:reviewId` (Owner, Admin, or Moderator)
- `GET /movies/:id/reviews`

### Watchlist (Second Collection)
- `POST /watchlist`
- `GET /watchlist`
- `GET /watchlist/stats` (Premium or Admin)
- `PUT /watchlist/:id`
- `DELETE /watchlist/:id`

**Auth Header:**
```
Authorization: Bearer <token>
```

## RBAC Roles
- `user`: Default role. Can manage their own watchlist and reviews.
- `premium`: Same as user + access to `/watchlist/stats`.
- `admin`: Full access to manage movies and list users.

## Validation and Error Handling
- Input validation via `express-validator`
- Centralized error handling middleware
- Proper HTTP status codes: `400`, `401`, `403`, `404`, `500`

## Deployment
Deploy on Render, Railway, or Replit. Set environment variables in the platform dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- SMTP variables if using email

## Screenshots

**Home:** quick access to trending movies and recommendations.

![Home](docs/screenshots/home.svg)

**Movies:** search and browse the movie library.

![Movies](docs/screenshots/movies.svg)

**Watchlist:** update status, rating, and favorites.

![Watchlist](docs/screenshots/watchlist.svg)

**Login:** secure authentication with JWT.

![Login](docs/screenshots/login.svg)

**Profile:** update username and email.

![Profile](docs/screenshots/profile.svg)
