import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { signInWithGoogleAsync } from '@/lib/auth/googleAuth';
import * as authService from '@/services/authService';
import type { LoginPayload, RegisterPayload, User } from '@/types';

/** What a Google sign-in attempt did, for the caller to render. */
export type GoogleSignInOutcome =
  | { status: 'signed-in' }
  | { status: 'cancelled' }
  | { status: 'failed'; code: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signInWithGoogle: (options?: { referralCode?: string }) => Promise<GoogleSignInOutcome>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const restoredUser = await authService.restoreSession();
        if (mounted) {
          setUser(restoredUser);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const credentials = await authService.login(payload);
    const nextUser = await authService.persistSession(credentials);
    setUser(nextUser);
  }, []);

  /**
   * Runs the Google consent flow, then trades the resulting ID token for a
   * session. A cancelled flow is a normal outcome, not an error, so it never
   * throws for it — only a rejected exchange propagates.
   */
  const signInWithGoogle = useCallback(
    async (options?: { referralCode?: string }): Promise<GoogleSignInOutcome> => {
      const result = await signInWithGoogleAsync();

      if (result.type === 'cancelled') {
        return { status: 'cancelled' };
      }

      if (result.type === 'error') {
        return { status: 'failed', code: result.code };
      }

      const credentials = await authService.loginWithGoogle({
        idToken: result.idToken,
        referralCode: options?.referralCode,
      });
      const nextUser = await authService.persistSession(credentials);
      setUser(nextUser);

      return { status: 'signed-in' };
    },
    [],
  );

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const credentials = await authService.register(payload);
    const nextUser = await authService.persistSession(credentials);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const nextUser = await authService.fetchCurrentUser();
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, isLoading, signIn, signInWithGoogle, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
