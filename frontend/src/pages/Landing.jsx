import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, MessageSquare, HelpCircle, Plus, BarChart2, Radio, Check, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';
import { LiveIndicator } from '../components/LiveIndicator';
import { pollService } from '../services/pollService';
import { useToast } from '../components/Toast';
import { soundFx } from '../utils/soundFx';

export const Landing = () => {
  const [joinPollId, setJoinPollId] = useState('');
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('slides');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleJoinPoll = async (e) => {
    e.preventDefault();
    if (!joinPollId.trim() || joining) return;

    let raw = joinPollId.trim();
    if (raw.includes('/poll/')) {
      raw = raw.split('/poll/')[1];
    }
    const cleanInput = raw.split('/')[0].split('?')[0].trim();
    if (!cleanInput) return;

    setJoining(true);
    try {
      soundFx.playClick();
      const res = await pollService.getPollByID(cleanInput);
      if (res?.success && res.data) {
        const targetPollId = res.data.pollId || cleanInput;
        navigate(`/poll/${targetPollId}`);
      } else {
        showToast(`⚠️ ${res?.message || 'Poll not found. Please check PIN code.'}`);
      }
    } catch (err) {
      // Fallback navigate directly
      navigate(`/poll/${cleanInput}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fadeInUp">
      
      {/* Hero Header Section */}
      <div className="space-y-8 pt-2 border-b border-[#292929] pb-10">
        <div className="flex items-center justify-between border-b border-[#292929] pb-4">
          <div className="flex items-center space-x-3">
            <LiveIndicator status="LIVE" isRealtime={true} />
          </div>
          <div className="font-mono text-xs text-[#707070] uppercase tracking-wider hidden sm:block animate-pulse">
            SYSTEM / ONLINE • 60FPS
          </div>
        </div>

        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F3EE] uppercase leading-[0.95]">
            MAKE EVERY <br />
            <span className="text-[#C62828]">VOTE</span> COUNT.
          </h1>
          <p className="text-base sm:text-lg text-[#A3A3A3] max-w-2xl font-normal leading-relaxed pt-2">
            Instant Mentimeter-style live polling, open response walls, and audience Q&amp;A. Built for ultra-fast realtime participation.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
          <Link
            to="/create-poll"
            className="btn-accent font-mono text-xs uppercase tracking-wider py-3.5 px-6 whitespace-nowrap animate-pulseGlowRed flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>CREATE PRESENTATION</span>
          </Link>

          {/* Quick Join Poll Form */}
          <form onSubmit={handleJoinPoll} className="flex items-center bg-[#141414] border border-[#292929] rounded p-1 flex-1 focus-within:border-[#C62828] transition-all">
            <input
              type="text"
              placeholder="ENTER 6-DIGIT PIN CODE..."
              value={joinPollId}
              onChange={(e) => setJoinPollId(e.target.value)}
              className="bg-transparent px-3 py-2 text-xs font-mono text-[#F5F3EE] placeholder-[#707070] focus:outline-none w-full uppercase"
            />
            <button
              type="submit"
              disabled={joining}
              className="btn-secondary font-mono text-xs uppercase tracking-wider py-2 px-4 whitespace-nowrap flex items-center space-x-1"
            >
              {joining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5F3EE]" />
              ) : (
                <span>JOIN</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Feature Showcase Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292929] pb-4 font-mono text-xs gap-4">
          <span className="text-[#707070] uppercase">MODULES / PRESENTATION SUITE</span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'slides'
                  ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              01. SLIDE POLLS
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'open'
                  ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              02. OPEN RESPONSES
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'qa'
                  ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              03. AUDIENCE Q&amp;A
            </button>
          </div>
        </div>

        {/* Feature Tab Contents */}
        {activeTab === 'slides' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="panel-card p-6 space-y-3">
              <BarChart2 className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">MULTIPLE CHOICE SLIDES</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Create structured slides with single or multiple options. Live audience voting results stream instantly over WebSockets.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <Radio className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">HOST SLIDE CONTROLLER</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Control the flow of your presentation. When you switch slides in your host dashboard, all audience devices synchronize in real-time.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <Sparkles className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">AUDITORIUM PRESENTATION MODE</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Project full-screen charts with automated glowing percentage fill bars and high-contrast dark themes on large venue screens.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'open' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="panel-card p-6 space-y-3">
              <MessageSquare className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">FREE-TEXT RESPONSE WALL</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Allow participants to submit detailed, unconstrained answers. Submissions automatically pin to a live visual response grid.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <Check className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">SUBMISSION DUPLICATE PROTECTION</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Automatic voter session hashing prevents spam submissions while keeping the audience experience smooth and anonymous.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <Layers className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">ANALYTICS EXPORT</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Download comprehensive CSV reports summarizing every text answer and vote count for post-session archival.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="panel-card p-6 space-y-3">
              <HelpCircle className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">AUDIENCE QUESTION SUBMISSION</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Audience members can ask questions anonymously or with their name directly from their phones during your talk.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <ArrowUpRight className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">UPVOTING & POPULARITY SORTING</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Participants upvote top questions in real-time. The host dashboard automatically sorts the most critical questions to the top.
              </p>
            </div>
            <div className="panel-card p-6 space-y-3">
              <Radio className="w-6 h-6 text-[#C62828]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase">LIVE THREAD MODERATION</h3>
              <p className="text-xs text-[#707070] leading-relaxed">
                Monitor Q&amp;A threads alongside main slide analytics with instant zero-latency status indicators.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Landing;
