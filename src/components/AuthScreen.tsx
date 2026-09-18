import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInAsGuest } from '../lib/auth';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters long.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let msg = err.message || 'Failed to sign in with Google';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in popup was closed before completing.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain not authorized for Google Sign-In in Firebase Console.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (err: any) {
      console.error("Guest Auth error:", err);
      setError(err.message || 'Failed to sign in as guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Doodles */}
      <div className="absolute top-[10%] left-[12%] opacity-15 pointer-events-none w-36 h-36 hidden md:block">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 0L105 85L190 90L105 95L100 180L95 95L10 90L95 85L100 0Z" fill="black"/></svg>
      </div>
      <div className="absolute bottom-[15%] right-[10%] opacity-15 pointer-events-none w-28 h-28 hidden md:block">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 100 Q 50 0, 100 100 T 200 100" stroke="black" strokeWidth="10" fill="none"/></svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 sm:p-10 rounded-[32px] border-2 border-black max-w-md w-full relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-black tracking-tight mb-2 uppercase">Invoicer</h1>
          <p className="text-gray-600 text-sm">
            {isSignUp ? 'Create your business account to generate invoices' : 'Sign in to access your shop & invoices'}
          </p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${!isSignUp ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${isSignUp ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name / Shop Owner</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Raj Kumar"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white text-gray-900 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white text-gray-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-black focus:bg-white text-gray-900 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-md mt-2"
          >
            <span>{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <span className="relative bg-white px-3 text-xs text-gray-400 uppercase font-semibold">Or continue with</span>
        </div>

        <div className="space-y-3">
          <button 
            type="button"
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="w-full bg-white text-black border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <button 
            type="button"
            onClick={handleGuestSignIn} 
            disabled={loading}
            className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
          >
            <UserCircle size={18} />
            <span>Continue as Guest</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
