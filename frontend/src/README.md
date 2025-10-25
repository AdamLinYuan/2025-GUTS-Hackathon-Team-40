# Frontend Source Structure

This directory contains the organized source code for the React frontend application.

## 📁 Directory Structure

```
src/
├── assets/              # Static assets (images, fonts, etc.)
│   ├── images/         # Image files
│   └── react.svg       # React logo
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper with navigation and theme
│   └── PrivateRoute.tsx # Protected route wrapper for authentication
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication context and provider
├── pages/              # Page components (routes)
│   ├── AboutPage.tsx
│   ├── ChatPage.tsx    # Main chat interface
│   ├── ContactPage.tsx
│   ├── DashboardPage.tsx # User dashboard after login
│   ├── FeaturesPage.tsx
│   ├── HomePage.tsx    # Public landing page
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── vite-env.d.ts       # TypeScript definitions for Vite
```

## 📝 File Organization Guidelines

### `/pages`
Contains all page-level components that correspond to routes in the application. Each page represents a distinct view that users can navigate to.

**Naming Convention:** `[PageName]Page.tsx`

### `/components`
Contains reusable UI components that can be used across multiple pages. These are not standalone pages but building blocks for the UI.

**Examples:**
- Layout wrappers
- Navigation components
- Form components
- Modal dialogs
- Buttons, cards, etc.

### `/context`
Contains React Context providers for global state management.

**Current Contexts:**
- `AuthContext` - Manages user authentication state and methods

### `/assets`
Contains static assets like images, fonts, and other media files.

**Subdirectories:**
- `images/` - Image files used throughout the application

## 🔗 Import Path Examples

```typescript
// Importing from context (from a page)
import { useAuth } from '../context/AuthContext';

// Importing from components (from a page)
import Layout from '../components/Layout';

// Importing from pages (from App.tsx)
import HomePage from './pages/HomePage';

// Importing styles
import '../index.css';
```

## 🚀 Adding New Files

### Adding a New Page
1. Create the file in `/pages` following the naming convention
2. Add the route in `App.tsx`
3. Update imports as needed

### Adding a New Component
1. Create the file in `/components`
2. Export the component
3. Import where needed using relative paths

### Adding a New Context
1. Create the provider in `/context`
2. Wrap the app or specific routes with the provider in `App.tsx`
3. Create a custom hook for easy access (e.g., `useAuth`)

## 📚 Tech Stack

- **React 19** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
