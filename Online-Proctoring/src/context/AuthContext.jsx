import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, loginUser, signupUser } from '../lib/authApi';
import { clearStoredSession, getStoredSession, storeSession } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isInitializing, setIsInitializing] = useState(() => Boolean(getStoredSession()?.token));

  useEffect(() => {
    const storedSession = getStoredSession();

    if (!storedSession?.token) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;

    fetchCurrentUser(storedSession.token)
      .then(({ user }) => {
        if (!isMounted) {
          return;
        }

        const validatedSession = { token: storedSession.token, user };
        setSession(validatedSession);
        storeSession(validatedSession);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        clearStoredSession();
        setSession(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsInitializing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = (nextSession) => {
    setSession(nextSession);
    storeSession(nextSession);
  };

  const login = async ({ email, password }) => {
    const nextSession = await loginUser({ email, password });
    persistSession(nextSession);
    return nextSession;
  };

  const signup = async ({ name, email, password }) => {
    const nextSession = await signupUser({ name, email, password });
    persistSession(nextSession);
    return nextSession;
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session?.token && session?.user),
        isInitializing,
        login,
        logout,
        signup,
        token: session?.token ?? null,
        user: session?.user ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
