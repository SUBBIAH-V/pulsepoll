import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { soundFx } from '../utils/soundFx';
import { Plus, LayoutDashboard, History, LogOut, LogIn, User, Menu, X, Volume2, VolumeX, ArrowRight, Mail } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [muted, setMuted] = useState(soundFx.muted);

  const toggleSound = () => {
    const isMuted = soundFx.toggleMute();
    setMuted(isMuted);
    if (!isMuted) {
      soundFx.playClick();
    }
  };

  const handleLogout = () => {
    soundFx.playClick();
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-[#292929] bg-[#0B0B0B]/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <span className="font-mono text-[#C62828] text-xs font-bold tracking-widest">●</span>
            <span className="text-lg font-black tracking-wider text-[#F5F3EE] uppercase font-mono">
              PULSE<span className="text-[#A3A3A3] font-normal">POLL</span>
            </span>
          </Link>

          {/* CENTER: Primary Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/dashboard')
                  ? 'text-[#F5F3EE] bg-[#191919] border border-[#292929]'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE] hover:bg-[#141414]'
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/history"
              className={`px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/history')
                  ? 'text-[#F5F3EE] bg-[#191919] border border-[#292929]'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE] hover:bg-[#141414]'
              }`}
            >
              Poll History
            </Link>

            <Link
              to="/create-poll"
              className={`px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/create-poll')
                  ? 'text-[#F5F3EE] bg-[#191919] border border-[#292929]'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE] hover:bg-[#141414]'
              }`}
            >
              Create Poll
            </Link>

            <Link
              to="/contact"
              className={`px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/contact')
                  ? 'text-[#F5F3EE] bg-[#191919] border border-[#292929]'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE] hover:bg-[#141414]'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* RIGHT: Secondary Actions & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded text-[#A3A3A3] hover:text-[#F5F3EE] hover:bg-[#141414] border border-transparent transition-colors"
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-[#707070]" /> : <Volume2 className="w-4 h-4 text-[#E8E1D3]" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-[#292929]">
                <div className="flex items-center space-x-2 text-xs font-mono text-[#A3A3A3]">
                  <User className="w-3.5 h-3.5 text-[#E8E1D3]" />
                  <span className="text-[#F5F3EE] font-medium">{user?.name || 'HOST'}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-[#A3A3A3] hover:text-[#E53935] hover:bg-[#141414] border border-[#292929] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="btn-ghost text-xs font-mono uppercase tracking-wider"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-xs font-mono uppercase tracking-wider px-3.5 py-1.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleSound}
              className="p-2 text-[#A3A3A3]"
            >
              {muted ? <VolumeX className="w-5 h-5 text-[#707070]" /> : <Volume2 className="w-5 h-5 text-[#E8E1D3]" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#F5F3EE] focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side / Full Screen Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#0B0B0B] border-b border-[#292929] px-6 py-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col space-y-3 font-mono text-xs uppercase tracking-wider">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded bg-[#141414] border border-[#292929] text-[#F5F3EE] flex items-center justify-between"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#707070]" />
            </Link>

            <Link
              to="/history"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded bg-[#141414] border border-[#292929] text-[#F5F3EE] flex items-center justify-between"
            >
              <span>Poll History &amp; Archives</span>
              <History className="w-4 h-4 text-[#C62828]" />
            </Link>

            <Link
              to="/create-poll"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded bg-[#141414] border border-[#292929] text-[#F5F3EE] flex items-center justify-between"
            >
              <span>Create Poll</span>
              <Plus className="w-4 h-4 text-[#C62828]" />
            </Link>

            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded bg-[#141414] border border-[#292929] text-[#A3A3A3] flex items-center justify-between"
            >
              <span>Contact Subbiah</span>
              <Mail className="w-4 h-4 text-[#C62828]" />
            </Link>

            {isAuthenticated ? (
              <div className="pt-4 border-t border-[#292929] space-y-3">
                <div className="text-xs font-mono text-[#A3A3A3] px-1">
                  HOST / <span className="text-[#F5F3EE] font-bold">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded bg-[#191919] border border-[#C62828]/40 text-[#E53935] font-mono text-xs uppercase tracking-wider"
                >
                  Logout Account
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-[#292929] grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-secondary text-center text-xs font-mono"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary text-center text-xs font-mono"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
