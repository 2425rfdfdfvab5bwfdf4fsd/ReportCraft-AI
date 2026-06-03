import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function SignUp() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">ReportCraft <span className="text-[#6366F1]">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Start your free trial</h1>
          <p className="text-[#94A3B8] text-sm mt-1">14 days · All Agency features · No credit card</p>
        </div>

        {CLERK_KEY ? (
          <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/onboarding" />
        ) : (
          <DemoSignUp />
        )}
      </div>
    </div>
  );
}

function DemoSignUp() {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8">
      <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-[#6366F1] font-medium">🚀 Demo Mode</p>
        <p className="text-xs text-[#94A3B8] mt-1">Clerk not configured. Go straight to onboarding.</p>
      </div>
      <Link
        to="/onboarding"
        className="w-full block text-center bg-[#6366F1] hover:bg-[#4F46E5] text-white py-3 rounded-lg font-semibold transition-colors"
      >
        Start Onboarding
      </Link>
      <p className="text-center text-xs text-[#64748B] mt-4">
        Already have an account? <Link to="/sign-in" className="text-[#6366F1] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
