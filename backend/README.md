# VidyaPath Backend API

Backend API for VidyaPath - A career guidance platform for students.

## Features

- User authentication with Clerk
- 4-step onboarding survey data storage
- User dashboard data retrieval
- Job recommendations based on user profile
- Career roadmaps for different jobs
- Chatbot with Q&A stored in MongoDB
- Rural jobs database

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- Clerk (Authentication)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key (optional for now)
```

3. Seed the database:
```bash
npm run seed:all
```

Or seed individually:
```bash
npm run seed:jobs
npm run seed:chatbot
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### User Routes

- `POST /api/users/onboarding` - Save or update user onboarding data
- `GET /api/users/:email` - Get user profile
- `GET /api/users/:email/dashboard` - Get user dashboard data

### Chatbot Routes

- `GET /api/chatbot/questions?email=user@example.com` - Get chatbot questions based on user profile
- `POST /api/chatbot/conversation` - Save chatbot conversation
- `POST /api/chatbot/answer` - Get chatbot answer for a question
- `GET /api/chatbot` - Get all chatbot Q&A
- `POST /api/chatbot` - Create chatbot Q&A (Admin)

### Job Routes

- `GET /api/jobs/recommendations/:email` - Get job recommendations for a user
- `GET /api/jobs` - Get all jobs (with optional filters: category, location, isRural)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create a job (Admin)

### Roadmap Routes

- `GET /api/roadmap/job/:jobId` - Get roadmap for a job
- `GET /api/roadmap/:jobTitle` - Get roadmap by job title
- `POST /api/roadmap` - Create or update roadmap (Admin)

## Data Models

### User
- Email, Clerk ID
- Location (locality, district, state)
- Academic Details (10th, 12th)
- Graduation Details
- Interests
- Chatbot Data (career path, conversations)

### Chatbot
- Question
- Answer
- Category
- Tags

### Job
- Title, Company, Location
- Salary, Type, Category
- Tags, Skills, Requirements
- Rural details (if applicable)

### Roadmap
- Job Title
- Roadmap Steps
- Skills
- Course Recommendations

## Rural Jobs

The system includes a comprehensive database of rural jobs in `backend/data/ruralJobs.json` with:
- 20+ rural job listings
- Location details (village, district, state)
- Salary ranges
- Requirements and skills
- Accessibility information

## Notes

- Clerk authentication middleware is set up but currently allows requests for development
- In production, implement proper token verification
- All routes are currently public for development
- Add authentication middleware to protected routes in production
