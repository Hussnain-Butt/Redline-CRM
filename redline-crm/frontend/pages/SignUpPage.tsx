import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const SignUpPage: React.FC = () => {
    const { isLoaded, signUp, setActive } = useSignUp();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Submit Details
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setIsLoading(true);
        setError('');

        try {
            await signUp.create({
                firstName,
                lastName,
                emailAddress: email,
                password,
            });

            // Prepare for email verification
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify Email Code
    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setIsLoading(true);
        setError('');

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                navigate('/');
            } else {
                setError('Verification incomplete. Please check the code.');
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError('Invalid Verification Code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row">
            {/* Left Side - Hero / Branding (Same as SignIn for consistency) */}
            <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-neutral-900 relative overflow-hidden">
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
                        Powering the Next <br />
                        Generation of <span className="text-red-500">Sales.</span>
                    </h1>
                    <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                        Join thousands of sales professionals automating their workflow, closing more deals, and scaling faster with RedLine.
                    </p>
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

                    {!pendingVerification ? (
                        <>
                            <div>
                                <h2 className="text-3xl font-bold text-white">Get Started</h2>
                                <p className="mt-2 text-neutral-400">
                                    Already have an account?{' '}
                                    <Link to="/sign-in" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                                        Sign In
                                    </Link>
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="block w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="block w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email Address</label>
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
                                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
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
                                            placeholder="At least 8 characters"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !isLoaded}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                                </button>
                            </form>
                        </>
                    ) : (
                        // VERIFICATION STEP
                        <div className="animate-in fade-in slide-in-from-right-10 duration-500">
                             <div className="mb-8">
                                <h2 className="text-3xl font-bold text-white">Verify Email</h2>
                                <p className="mt-2 text-neutral-400">
                                    We sent a code to <span className="text-white font-medium">{email}</span>.
                                    <br />Enter it below to confirm your account.
                                </p>
                            </div>

                            <form onSubmit={handleVerification} className="space-y-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-center text-lg tracking-widest"
                                        placeholder="123456"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !isLoaded}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <div className="flex items-center gap-2">
                                            <span>Verify & Enter Dashboard</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
