import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';

export function Auth({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdminEmail = firebaseUser.email === 'mutanim24@gmail.com';
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            // Auto-elevate to admin if email matches
            if (isAdminEmail && userData.role !== 'admin') {
              const updatedUser = { ...userData, role: 'admin' as const };
              await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
              setUser(updatedUser);
            } else {
              setUser(userData);
            }
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : 'user',
              rentPaid: false,
              billPaid: false,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse text-slate-400 font-medium">Loading HostelHub...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-xl bg-white">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">HostelHub</CardTitle>
            <CardDescription>
              Manage your hostel meals, costs, and profile in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button onClick={login} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11">
              <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-900" />
            <span className="font-bold text-lg tracking-tight">HostelHub</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-slate-500 hover:text-slate-900">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children(user)}
      </main>
    </div>
  );
}
