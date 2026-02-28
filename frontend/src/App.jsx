import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import KanbanBoard from './pages/KanbanBoard';
import IssueDetailPage from './pages/IssueDetailPage';
import ProfilePage from './pages/ProfilePage';

function AppLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        } />
        <Route path="/" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/projects" element={
          <PrivateRoute><ProjectsPage /></PrivateRoute>
        } />
        <Route path="/board" element={
          <PrivateRoute><KanbanBoard /></PrivateRoute>
        } />
        <Route path="/issues/:id" element={
          <PrivateRoute><IssueDetailPage /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
