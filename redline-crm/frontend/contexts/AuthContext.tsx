import React from 'react';
import { useAuth, useUser, SignIn, SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * Auth Context Hook - provides easy access to Clerk auth state
 */
export const useAuthContext = () => {
  const { isLoaded, isSignedIn, getToken, signOut, userId } = useAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isSignedIn: !!isSignedIn,
    userId,
    user,
    userName: user?.firstName || user?.username || 'User',
    userEmail: user?.primaryEmailAddress?.emailAddress || '',
    userImage: user?.imageUrl,
    getToken,
    signOut: async () => {
      await signOut();
    },
  };
};

/**
 * Protected Route Component
 * Redirects to sign-in if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    // Loading state
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect
  }

  return <>{children}</>;
};

/**
 * Sign In Page Component
 */
export const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-red-600 font-bold text-2xl">R</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RedLine CRM</h1>
          </div>
          <p className="text-neutral-400">Sign in to access your dashboard</p>
        </div>

        <SignIn 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-neutral-400',
              socialButtonsBlockButton: 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-neutral-700',
              dividerText: 'text-neutral-500',
              formFieldLabel: 'text-neutral-300',
              formFieldInput: 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500',
              formButtonPrimary: 'bg-red-600 hover:bg-red-700 text-white',
              footerActionLink: 'text-red-500 hover:text-red-400',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-red-500',
              formFieldAction: 'text-red-500',
            },
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
};

/**
 * Sign Up Page Component
 */
export const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-red-600 font-bold text-2xl">R</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RedLine CRM</h1>
          </div>
          <p className="text-neutral-400">Create your account to get started</p>
        </div>

        <SignUp 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-neutral-400',
              socialButtonsBlockButton: 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-neutral-700',
              dividerText: 'text-neutral-500',
              formFieldLabel: 'text-neutral-300',
              formFieldInput: 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500',
              formButtonPrimary: 'bg-red-600 hover:bg-red-700 text-white',
              footerActionLink: 'text-red-500 hover:text-red-400',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-red-500',
              formFieldAction: 'text-red-500',
            },
          }}
          redirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
};

export default { useAuthContext, ProtectedRoute, SignInPage, SignUpPage };
