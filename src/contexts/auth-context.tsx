
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  type User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useLanguageContext } from './language-context'; // For error messages

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  registerWithEmail: (name: string | undefined, email: string, pass: string) => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguageContext();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (err: any, defaultMessageKey: string) => {
    let message = t(defaultMessageKey); // Default localized message
    if (err.code) {
      switch (err.code) {
        case 'auth/invalid-email':
          message = t('auth.errors.invalidEmail');
          break;
        case 'auth/user-disabled':
          message = t('auth.errors.userDisabled');
          break;
        case 'auth/user-not-found':
          message = t('auth.errors.userNotFound');
          break;
        case 'auth/wrong-password':
          message = t('auth.errors.wrongPassword');
          break;
        case 'auth/email-already-in-use':
          message = t('auth.errors.emailAlreadyInUse');
          break;
        case 'auth/weak-password':
          message = t('auth.errors.weakPassword');
          break;
        // Add more specific Firebase error codes as needed
        default:
          // Use the default message or a generic Firebase error message
          message = err.message || message; 
      }
    }
    setError(message);
    toast({ title: t('auth.errors.title'), description: message, variant: 'destructive' });
    return null;
  };

  const registerWithEmail = async (name: string | undefined, email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user && name) {
        await updateProfile(userCredential.user, { displayName: name });
        // Re-fetch user to get updated profile
        setCurrentUser(auth.currentUser); 
      }
      setLoading(false);
      toast({ title: t('auth.registerSuccessTitle'), description: t('auth.registerSuccessDescription', {appName: "RS Timer"}) });
      return userCredential.user;
    } catch (err: any) {
      setLoading(false);
      return handleAuthError(err, 'auth.errors.registrationFailed');
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setLoading(false);
      toast({ title: t('auth.loginSuccessTitle'), description: t('auth.loginSuccessDescription') });
      return userCredential.user;
    } catch (err: any) {
      setLoading(false);
      return handleAuthError(err, 'auth.errors.loginFailed');
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setLoading(false);
      toast({ title: t('auth.logoutSuccessTitle') });
    } catch (err: any) {
      setLoading(false);
      return handleAuthError(err, 'auth.errors.logoutFailed');
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      toast({ title: t('auth.passwordResetSentTitle'), description: t('auth.passwordResetSentDescription') });
    } catch (err: any) {
      setLoading(false);
      return handleAuthError(err, 'auth.errors.passwordResetFailed');
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    setError,
    registerWithEmail,
    loginWithEmail,
    logoutUser,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
