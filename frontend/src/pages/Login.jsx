import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { useToast } from '../components/Toast';
import { AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login(email, password);
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        showToast(`✓ Welcome back, ${res.data.user.name}`);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md panel-card p-8 space-y-6">
        
        {/* Header */}
        <div className="space-y-1 font-mono">
          <span className="text-xs text-[#C62828] uppercase">AUTHENTICATION / LOGIN</span>
          <h2 className="text-2xl font-black text-[#F5F3EE] uppercase tracking-tight">
            SIGN IN TO HOST
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded bg-[#191919] border border-[#C62828] text-[#F5F3EE] text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-mono text-xs text-[#A3A3A3] uppercase block">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              placeholder="host@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-industrial font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs text-[#A3A3A3] uppercase block">
              PASSWORD
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-industrial font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary font-mono text-xs uppercase tracking-wider py-3.5 w-full mt-2"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>
        </form>

        {/* Link */}
        <div className="pt-4 border-t border-[#292929] text-center font-mono text-xs text-[#707070]">
          NO ACCOUNT YET?{' '}
          <Link to="/signup" className="text-[#F5F3EE] hover:underline">
            SIGN UP
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
