import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, fullName, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@oulad.ac.uk');
      setPassword('admin1234');
    } else {
      setEmail('staff@oulad.ac.uk');
      setPassword('staff1234');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-700 mb-4 shadow-lg shadow-brand-900/50">
            <GraduationCap className="w-7 h-7 text-brand-100" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            OULAD Analytics
          </h1>
          <p className="text-brand-300 text-sm mt-1">
            Student Retention Intelligence Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8">
          <h2 className="text-lg font-semibold text-brand-800 mb-6">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@university.ac.uk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle register / login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-brand-500 hover:text-brand-700 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>

          {/* Demo credentials */}
          {!isRegister && (
            <div className="mt-6 pt-4 border-t border-brand-100">
              <p className="text-xs text-brand-400 text-center mb-2">Demo Accounts</p>
              <div className="flex gap-2">
                <button onClick={() => fillDemo('admin')} className="btn-secondary flex-1 text-xs py-1.5">
                  Admin
                </button>
                <button onClick={() => fillDemo('staff')} className="btn-secondary flex-1 text-xs py-1.5">
                  Staff
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
