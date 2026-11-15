import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { PageTransition } from './components/PageTransition';
import { WakingNotice } from './components/WakingNotice';
import { AdminHome } from './pages/AdminHome';
import { Home } from './pages/Home';
import { InstructorHome } from './pages/InstructorHome';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { StudentHome } from './pages/StudentHome';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route
            path="/aluno"
            element={
              <RequireRole roles={['STUDENT']}>
                <StudentHome />
              </RequireRole>
            }
          />
          <Route
            path="/instrutor"
            element={
              <RequireRole roles={['INSTRUCTOR']}>
                <InstructorHome />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminHome />
              </RequireRole>
            }
          />
          {/* Endereço desconhecido volta para a página inicial. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </PageTransition>
      </BrowserRouter>
      <WakingNotice />
    </AuthProvider>
  );
}
