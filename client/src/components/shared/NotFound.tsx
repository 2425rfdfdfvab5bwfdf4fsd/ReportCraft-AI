import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-[#6366F1]">404</p>
        <h1 className="text-2xl font-bold text-white mt-4">Page not found</h1>
        <p className="text-[#94A3B8] mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Home size={16} /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
