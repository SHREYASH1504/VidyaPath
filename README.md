# VidyaPath - Career Guidance Platform 🎓

VidyaPath is a comprehensive career guidance platform designed to help students, especially from rural backgrounds, navigate their educational and career journeys. It provides personalized recommendations, job listings (including rural opportunities), career roadmaps, and an interactive AI chatbot for guidance.

![VidyaPath Banner](https://via.placeholder.com/800x200?text=VidyaPath+Career+Guidance)

## 🚀 Key Features

*   **Smart Onboarding**: A detailed 4-step survey to understand the student's academic background, interests, and strengths.
*   **AI-Powered Recommendations**: Personalized job and career path suggestions using RAG (Retrieval-Augmented Generation).
*   **Rural Jobs Database**: Specialized focus on connecting students with opportunities in rural areas.
*   **Interactive Chatbot**: An AI assistant powered by Google Gemini to answer career-related queries.
*   **Career Roadmaps**: Detailed step-by-step guides for various professions.
*   **Multilingual Support**: Accessible in English, Hindi, and Marathi (in progress).

## 🛠️ Technology Stack

The project uses a modern microservices architecture:

### Frontend (`/frontend`)
*   **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **Auth**: [Clerk](https://clerk.com/)
*   **State**: Context API

### Backend (`/backend`)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
*   **Role**: Handles user data, auth validation, and static job data.

### AI Engine (`/FastApi-RAG`)
*   **Language**: Python
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
*   **AI Model**: Google Gemini (via `google-generativeai`)
*   **Pattern**: RAG (Retrieval Augmented Generation)
*   **Role**: Handles intelligent chatbot queries, semantic search, and dynamic recommendations.

## 📂 Project Structure

*   `/frontend`: React user interface.
*   `/backend`: Node.js Express API (User data, standard CRUD).
*   `/FastApi-RAG`: Python FastAPI service (AI & Chatbot capability).

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   MongoDB Instance
*   Clerk Account
*   Google Gemini API Key

---

### 1. Backend Setup (Node.js)

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key
```

Run:
```bash
npm run seed:all  # Seed initial data
npm run dev       # Start server on port 5000
```

---

### 2. AI Engine Setup (Python)

```bash
cd FastApi-RAG
# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirement.txt
```

Create `FastApi-RAG/.env`:
```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=8000
DEBUG=True
```

Run:
```bash
uvicorn app.main:app --reload
```
Server runs on `http://localhost:8000`.

---

### 3. Frontend Setup (React)

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

Run:
```bash
npm run dev
```
App runs at `http://localhost:5173`.

## 📜 API Documentation

*   **Node Backend**: See `backend/README.md`.
*   **FastAPI Docs**: Visit `http://localhost:8000/docs` when the Python server is running to see Swagger UI for the AI endpoints.

## 🤝 Contributing

1.  Fork the repo
2.  Create feature branch
3.  Commit changes
4.  Push & PR

## 📄 License

MIT License.
