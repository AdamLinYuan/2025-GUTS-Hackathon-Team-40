# 2025-GUTS-Hackathon-Team-40
Winner winner chicken dinner! 🎉

## 🚀 Quick Start

This is a full-stack AI chatbot application that uses Google's Gemini API for natural language processing.

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup Instructions

#### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run migrations
python manage.py migrate

# Start the backend server
python manage.py runserver
```

The backend will run at `http://localhost:8000`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173`

## 🔑 Environment Variables

Create a `.env` file in the `backend` directory with the following:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
DJANGO_SECRET_KEY=your_secret_key_here
DEBUG=True
```

**Important:** Never commit your `.env` file! It's already in `.gitignore`.

## 📚 Features

- ✨ Real-time streaming chat responses
- 🔐 User authentication and authorization
- 💬 Conversation history management
- 🌓 Dark mode support
- 📱 Responsive design
- 🎯 Demo mode for testing without login
- ✏️ Message editing with context preservation

## 🏗️ Tech Stack

**Backend:**
- Django 5.2
- Django REST Framework
- Google Gemini API
- SQLite

**Frontend:**
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router

## 📝 API Documentation

See the [Backend README](./backend/README.md) for detailed API documentation.

## 🤝 Contributing

This was built for the 2025 GUTS Hackathon. Feel free to fork and improve!

## ⚠️ Security Notes

- Keep your API keys secure
- Never commit `.env` files
- Change the Django secret key in production
- Disable DEBUG mode in production
