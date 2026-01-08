import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network delay for better UX
        setTimeout(() => {
            if (username === 'studiocog' && password === 'Pakistan2026#') {
                setShowSuccess(true);
                setTimeout(() => {
                    onLogin();
                }, 800);
            } else {
                setError('Invalid username or password');
                setIsLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-2xl relative z-10 overflow-hidden">
                {/* Header Image/Pattern */}
                <div className="h-32 bg-gradient-to-br from-red-600 to-red-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] opacity-20 bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
                    
                    <div className="absolute bottom-6 left-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-red-600 font-bold text-xl">R</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">RedLine CRM</h1>
                        </div>
                        <p className="text-red-100/80 text-sm ml-1">Secure Access Portal</p>
                    </div>
                </div>

                <div className="p-8 pt-6">
                    {showSuccess ? (
                         <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
                            <p className="text-neutral-400">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2 ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-neutral-600"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-neutral-800/50 border border-neutral-700 text-white pl-11 pr-12 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-neutral-600"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl font-semibold hover:from-red-500 hover:to-red-600 focus:ring-4 focus:ring-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-red-900/20"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-center">
                    <p className="text-xs text-neutral-500">
                        Protected by RedLine Secure Auth v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
