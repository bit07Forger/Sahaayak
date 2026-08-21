import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';
import type { UserProfile } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state updates
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('sahaayak_token', idToken);
          
          // Fetch additional profile data from API
          const data = await api.getMe();
          setUser(data.user);
        } catch (err) {
          console.error('Failed to sync profile from API on auth change:', err);
          setUser(null);
        }
      } else {
        localStorage.removeItem('sahaayak_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Authenticate with Firebase Client SDK
    await signInWithEmailAndPassword(auth, email, password);
    // Profile sync occurs automatically in onAuthStateChanged
  };

  const register = async (email: string, password: string) => {
    // Create credential in Firebase Auth
    await createUserWithEmailAndPassword(auth, email, password);
    // Profile sync occurs automatically in onAuthStateChanged
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('sahaayak_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
