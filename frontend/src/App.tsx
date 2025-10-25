import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import SubcategoriesPage from './pages/SubcategoriesPage';
import GamePage from './pages/GamePage';
import UploadWordListPage from './pages/UploadWordListPage';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
            <Route path="/subcategories" element={<Layout><SubcategoriesPage /></Layout>} />
            <Route path="/upload-word-list" element={<Layout><UploadWordListPage /></Layout>} />
            <Route path="/game" element={<Layout hideHeader={true}><GamePage /></Layout>} />
            <Route path="/chat" element={<Layout hideHeader={true}><ChatPage /></Layout>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;