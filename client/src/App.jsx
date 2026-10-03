import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';
import { connectSocket, disconnectSocket } from './store/socketStore';
import useAuthStore from './store/authStore';

function App() {
  const user = useAuthStore((s) => s.user);

  // Reconnect socket on page reload if already logged in, or disconnect when logged out
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [user]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BoardListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:boardId"
          element={
            <ProtectedRoute>
              <BoardDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global toast notifications */}
      <Toast />
    </>
  );
}

export default App;
