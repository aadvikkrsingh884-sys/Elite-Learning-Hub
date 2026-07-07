import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react';

interface Student {
  id: number;
  name: string;
  email: string;
  classLevel: number;
  points: number;
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthContextType {
  student: Student | null;
  token: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  login: (student: Student, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedStudent = localStorage.getItem('aura-student');
    const savedToken = localStorage.getItem('aura-token');
    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch {
        // ignore
      }
    }
    if (savedToken) {
      setToken(savedToken);
      setAuthTokenGetter(() => localStorage.getItem('aura-token'));
    }
  }, []);

  const login = (newStudent: Student, newToken?: string) => {
    setStudent(newStudent);
    localStorage.setItem('aura-student', JSON.stringify(newStudent));
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('aura-token', newToken);
      setAuthTokenGetter(() => localStorage.getItem('aura-token'));
    }
  };

  const logout = () => {
    const tok = localStorage.getItem('aura-token');
    setStudent(null);
    setToken(null);
    localStorage.removeItem('aura-student');
    localStorage.removeItem('aura-token');
    setAuthTokenGetter(null);
    // Fire and forget API logout
    if (tok) {
      fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${tok}` } }).catch(() => {});
    }
    setLocation('/');
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        isGuest: student?.id === 0,
        isAuthenticated: !!student,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export type { Student };
