# Nextif Accelerator Backend

The backend API service for the Nextif Accelerator Platform. It provides RESTful endpoints for the fellows and admin frontends, handling authentication, task management, submissions, and more.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Validation:** Zod
- **Authentication:** JWT & Bcryptjs
- **Testing:** Jest & Supertest
- **File Uploads:** Multer & Cloudinary
- **Email:** Nodemailer (SMTP based notifications)

## Core Features

- **Dynamic Task Management:** Supports Weekly, Monthly, and **ADHOC** task types.
- **Automated Email System:**
  - Welcome emails for new fellows.
  - Real-time notifications for task assignments.
  - Feedback-driven redo request notifications.
- **Advanced Submission Workflow:**
  - Multi-status tracking (Submitted, Completed, Rejected, **Redo**).
  - Individual due date overrides for redo requests.
  - Reviewer tracking for accountability.
- **Bulk Operations:** Onboard multiple fellows via CSV.
- **Event & Attendance System:**
  - Full CRUD operations for Webinars, Meetings, and Workshops.
  - Admin tools for marking attendance (Single & Bulk).
  - Attendance history tracking for fellows.
- **File & Link Submissions:** Secure uploads via Cloudinary.

- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- npm

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
FRONTEND_URL=url_of_ambassador_frontend
ADMIN_FRONTEND_URL=url_of_admin_frontend
```

## Installation

1. Navigate to the project directory:

   ```bash
   cd nextif-fellows-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server with hot-reload (using `ts-node-dev`):

```bash
npm run dev
```

The server will start on the port specified in `.env` (default: 3000).

## Building for Production

To compile the TypeScript code to JavaScript:

```bash
npm run build
```

This will generate the compiled files in the `dist` directory.

## Running in Production

To start the compiled server:

```bash
npm start
```

## Testing

To run the test suite:

```bash
npm test
```
