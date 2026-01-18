# VidyaPath - Career Guidance Platform 🎓

 VidyaPath is a comprehensive career guidance platform designed to help students, especially from rural backgrounds, navigate their educational and career journeys. It provides personalized recommendations, job listings (including rural opportunities), career roadmaps, and an interactive AI chatbot for guidance.

![VidyaPath Banner](https://via.placeholder.com/800x200?text=VidyaPath+Career+Guidance)

## 🚀 Key Features

*   **Smart Onboarding**: A detailed 4-step survey to understand the student's academic background, interests, and strengths.
*   **AI-Powered Recommendations**: Personalized job and career path suggestions based on user profiles.
*   **Rural Jobs Database**: Specialized focus on connecting students with opportunities in rural areas.
*   **Interactive Chatbot**: An AI assistant to answer career-related queries and guide students.
*   **Career Roadmaps**: Detailed step-by-step guides for various professions.
*   **Multilingual Support**: Accessible in English, Hindi, and Marathi (in progress).
*   **Dashboard**: A central hub for students to track their progress and recommendations.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **Authentication**: [Clerk](https://clerk.com/)
*   **Routing**: React Router DOM
*   **Internationalization**: i18next
*   **HTTP Client**: Axios

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose)
*   **Authentication**: Clerk (Backend validation)

## 📂 Project Structure

The project is divided into two main applications:

*   `/frontend`: The React-based user interface.
*   `/backend`: The Node.js/Express API server.

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB installed locally or a MongoDB Atlas URI
*   Clerk Account (for authentication)

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key
```

Seed the database with initial data:

```bash
npm run seed:all
```

Start the backend server:

```bash
npm run dev
```

The server runs on `http://localhost:5000` by default.

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (or check `src/main.jsx`) with:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Start the development server:

```bash
npm run dev
```

The application will launch in your browser (usually at `http://localhost:5173`).

## 📜 API Documentation

The backend exposes several RESTful endpoints. See `backend/README.md` for full documentation. Some key endpoints include:

*   `POST /api/users/onboarding`: Save user profile data.
*   `GET /api/jobs/recommendations/:email`: Fetch personalized job suggestions.
*   `GET /api/chatbot`: Interact with the career guidance bot.

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
