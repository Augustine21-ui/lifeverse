import { Link } from 'react-router-dom';
import { Zap, AlertTriangle } from 'lucide-react';

export default function SubscriptionRequired() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap size={40} className="text-brand-400" />
        <span className="text-4xl font-bold">StudyArena</span>
      </div>
      <div className="max-w-md text-center">
        <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
        <p className="text-white/60 mb-4">
          Your institution does not have an active StudyArena subscription.
          Please contact your school administrator to activate access.
        </p>
        <Link to="/logout" className="btn-secondary">Logout</Link>
      </div>
    </div>
  );
}