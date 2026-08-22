import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged 
} from 'firebase/auth';
import { auth, authPersistenceReady } from '../services/firebase';
import type { UserProfile } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getActiveIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    // Subscribe to Firebase ID token changed events (covers both initial load & refreshes)
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Construct basic user profile client-side (no backend API synchronization in Step 4)
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          preferences: {
            textSize: 'normal',
            contrast: 'normal',
            voiceSpeed: 'normal',
            voiceEnabled: false,
          },
          progress: {
            currentStep: 0,
            status: 'NOT_STARTED',
          },
        });
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (authPersistenceReady) {
      await authPersistenceReady;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    if (authPersistenceReady) {
      await authPersistenceReady;
    }
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Reusable helper to dynamically fetch the current Firebase ID token on request
  const getActiveIdToken = async (forceRefresh = false): Promise<string | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
      // Safe fallback return value on error, preventing raw Firebase details leakage
      return null;
    }
  };

  const refreshUser = async () => {
    // No-op for Step 4 (prevents compilation errors in downstream accessibility modules)
    return Promise.resolve();
  };

  const loading = status === 'loading';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      status, 
      login, 
      register, 
      logout, 
      refreshUser,
      getActiveIdToken 
    }}>
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
