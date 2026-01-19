import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const SignInPage: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      } else {
        setError('Login incomplete. Please verify your account.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Simplify error message for user
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row">
      {/* Left Side - Hero / Branding */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-neutral-900 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xl">R</span>
                </div>
                <span className="text-xl font-bold text-white">RedLine CRM</span>
            </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Welcome Back to <br />
            <span className="text-red-500">Intelligent Sales.</span>
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed mb-8">
            Access your dashboard to manage leads, automate follow-ups, and track your team's performance with AI-driven insights.
          </p>
          
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-300">
             <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Secure AES-256 Encryption</span>
             </div>
             <div className="w-1 h-1 bg-neutral-700 rounded-full" />
             <div>99.9% Uptime SLA</div>
          </div>
        </div>

        <div className="text-neutral-500 text-sm relative z-10">
          © 2024 RedLine CRM. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg">R</span>
             </div>
             <span className="text-lg font-bold text-white">RedLine CRM</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white">Sign In</h2>
            <p className="mt-2 text-neutral-400">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                Create one now
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                 <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-neutral-300">
                        Password
                    </label>
                    <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">
                        Forgot password?
                    </a>
                 </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-neutral-950 text-neutral-500">Protected by Clerk Auth</span>
                </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
