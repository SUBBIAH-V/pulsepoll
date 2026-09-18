import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, MessageSquare, HelpCircle, Plus, BarChart2, Radio, Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { LiveIndicator } from '../components/LiveIndicator';

export const Landing = () => {
  const [joinPollId, setJoinPollId] = useState('');
  const [activeTab, setActiveTab] = useState('slides');
  const navigate = useNavigate();

  const handleJoinPoll = (e) => {
    e.preventDefault();
    if (joinPollId.trim()) {
      let raw = joinPollId.trim();
      if (raw.includes('/poll/')) {
        raw = raw.split('/poll/')[1];
      }
      const cleanId = raw.split('/')[0].split('?')[0].trim();
      if (cleanId) {
        navigate(`/poll/${cleanId}`);
      }
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
            className="btn-accent font-mono text-xs uppercase tracking-wider py-3.5 px-6 whitespace-nowrap animate-pulseGlowRed"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>CREATE PRESENTATION</span>
          </Link>

          {/* Quick Join Poll Form */}
          <form onSubmit={handleJoinPoll} className="flex items-center bg-[#141414] border border-[#292929] rounded p-1 flex-1 focus-within:border-[#C62828] transition-all">
            <input
              type="text"
              placeholder="ENTER POLL ID / CODE..."
              value={joinPollId}
              onChange={(e) => setJoinPollId(e.target.value)}
              className="bg-transparent px-3 py-2 text-xs font-mono text-[#F5F3EE] placeholder-[#707070] focus:outline-none w-full"
            />
            <button
              type="submit"
              className="btn-secondary font-mono text-xs uppercase tracking-wider py-2 px-4 whitespace-nowrap"
            >
              JOIN
            </button>
          </form>
        </div>
      </div>

      {/* Dashboard-Style Statistics Section (4 Metric Cards with Staggered Entrance) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel-card-hover p-5 space-y-1 animate-fadeInUp stagger-1">
          <div className="font-mono text-[10px] text-[#A3A3A3] uppercase tracking-wider">LATENCY</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">&lt; 0.5s</div>
          <div className="font-mono text-[10px] text-[#C62828] uppercase font-bold">SUB-SECOND SYNC</div>
        </div>

        <div className="panel-card-hover p-5 space-y-1 animate-fadeInUp stagger-2">
          <div className="font-mono text-[10px] text-[#C62828] uppercase tracking-wider">QUESTION TYPES</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">MULTI</div>
          <div className="font-mono text-[10px] text-[#A3A3A3] uppercase">CHOICE &amp; OPEN TEXT</div>
        </div>

        <div className="panel-card-hover p-5 space-y-1 animate-fadeInUp stagger-3">
          <div className="font-mono text-[10px] text-[#A3A3A3] uppercase tracking-wider">Q&amp;A THREAD</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">LIVE</div>
          <div className="font-mono text-[10px] text-[#3A8F5B] uppercase font-bold">UPVOTE RANKING</div>
        </div>

        <div className="panel-card-hover p-5 space-y-1 animate-fadeInUp stagger-4">
          <div className="font-mono text-[10px] text-[#3A8F5B] uppercase tracking-wider">SYSTEM STATUS</div>
          <div className="text-sm font-bold text-[#F5F3EE] font-mono pt-2">ONLINE / 60FPS</div>
          <div className="font-mono text-[10px] text-[#707070] uppercase">REDIS PUB/SUB</div>
        </div>
      </div>

      {/* Spotlight Feature Deck (Dashboard Style Card with Smooth Tab Transitions) */}
      <div className="space-y-4 animate-fadeInUp stagger-2">
        <div className="flex items-center justify-between border-b border-[#292929] pb-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#707070]">
            FEATURE SPOTLIGHT &amp; CAPABILITIES
          </span>
          <div className="flex items-center space-x-2 bg-[#141414] p-1 rounded border border-[#292929]">
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-3 py-1 font-mono text-xs uppercase transition-all ${
                activeTab === 'slides' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold shadow-md' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              Slides
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1 font-mono text-xs uppercase transition-all ${
                activeTab === 'open' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold shadow-md' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              Open Text
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 py-1 font-mono text-xs uppercase transition-all ${
                activeTab === 'qa' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold shadow-md' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
              }`}
            >
              Q&amp;A
            </button>
          </div>
        </div>

        <div className="panel-card p-6 sm:p-8 space-y-6">
          {activeTab === 'slides' && (
            <div className="space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-[#C62828] font-bold">01 / MULTI-QUESTION SLIDES</span>
                  <h3 className="text-lg font-bold text-[#F5F3EE]">Sequential Presentation Deck</h3>
                </div>
                <Link to="/create-poll" className="btn-secondary font-mono text-xs py-1 px-3 flex items-center space-x-1 hover:border-[#C62828] transition-all">
                  <span>TRY NOW</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
                Build presentations with multiple questions (Q1, Q2, Q3...). Hosts can switch slides in real-time, instantly moving all audience devices to the active slide.
              </p>
              <div className="p-4 rounded bg-[#141414] border border-[#292929] space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[#F5F3EE]">
                  <span>Q1: Which framework do you prefer?</span>
                  <span className="text-[#C62828] font-bold">142 VOTES</span>
                </div>
                <div className="w-full bg-[#0B0B0B] h-2.5 rounded-sm overflow-hidden border border-[#292929]">
                  <div className="bg-[#F5F3EE] h-full w-3/4 result-bar-fill" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'open' && (
            <div className="space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-[#C62828] font-bold">02 / OPEN-ENDED ANSWERS</span>
                  <h3 className="text-lg font-bold text-[#F5F3EE]">Live Streaming Answer Wall</h3>
                </div>
                <Link to="/create-poll" className="btn-secondary font-mono text-xs py-1 px-3 flex items-center space-x-1 hover:border-[#C62828] transition-all">
                  <span>TRY NOW</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
                Audience members type short answers which instantly stream onto the creator’s answer wall card grid.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded bg-[#141414] border border-[#292929] text-xs font-bold text-[#F5F3EE] hover:border-[#C62828] transition-all">
                  "Ultra fast WebSocket response speeds!"
                </div>
                <div className="p-3.5 rounded bg-[#141414] border border-[#292929] text-xs font-bold text-[#F5F3EE] hover:border-[#C62828] transition-all">
                  "Mentimeter style presentation flow is awesome!"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between border-b border-[#292929] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-[#C62828] font-bold">03 / AUDIENCE Q&amp;A THREAD</span>
                  <h3 className="text-lg font-bold text-[#F5F3EE]">Upvoting &amp; Realtime Moderation</h3>
                </div>
                <Link to="/create-poll" className="btn-secondary font-mono text-xs py-1 px-3 flex items-center space-x-1 hover:border-[#C62828] transition-all">
                  <span>TRY NOW</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono">
                Audience members submit questions for the presenter and upvote each other’s top questions in real-time.
              </p>
              <div className="p-4 rounded bg-[#141414] border border-[#292929] flex items-center justify-between gap-4 font-mono text-xs hover:border-[#C62828] transition-all">
                <div className="text-[#F5F3EE] font-bold">
                  "Will the slides be exported to PDF after the live stream?"
                </div>
                <span className="btn-accent text-xs font-mono py-1 px-3 shrink-0">
                  👍 28 UPVOTES
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Grid with Numbered Industrial Layout (3 Clickable Columns with Hover Lift) */}
      <div className="space-y-4 animate-fadeInUp stagger-3">
        <div className="flex items-center justify-between border-b border-[#292929] pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#707070]">
            FEATURES / 01–03
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A3A3A3]">
            CLICK TO CREATE &amp; TRY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 01 */}
          <Link
            to="/create-poll"
            className="panel-card-hover p-6 rounded flex flex-col justify-between space-y-6 group cursor-pointer border border-[#292929] hover:border-[#C62828] transition-all animate-fadeInUp stagger-1"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#C62828] font-bold">01</span>
                <div className="flex items-center space-x-1">
                  <Layers className="w-4 h-4 text-[#A3A3A3] group-hover:text-white transition-colors" />
                  <ArrowUpRight className="w-4 h-4 text-[#707070] group-hover:text-[#C62828] transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EE] group-hover:text-white transition-colors">
                Multi-Question Slides
              </h3>
              <p className="text-[#A3A3A3] text-xs leading-relaxed">
                Host live presentation slide decks with host slide switching and audience synchronization.
              </p>
            </div>
            <div className="pt-2 border-t border-[#292929] font-mono text-[10px] text-[#707070] group-hover:text-[#C62828] uppercase flex items-center justify-between transition-colors">
              <span>FEATURE / PRESENTATION</span>
              <span>START &rarr;</span>
            </div>
          </Link>

          {/* Card 02 */}
          <Link
            to="/create-poll"
            className="panel-card-hover p-6 rounded flex flex-col justify-between space-y-6 group cursor-pointer border border-[#292929] hover:border-[#C62828] transition-all animate-fadeInUp stagger-2"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#C62828] font-bold">02</span>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4 text-[#A3A3A3] group-hover:text-white transition-colors" />
                  <ArrowUpRight className="w-4 h-4 text-[#707070] group-hover:text-[#C62828] transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EE] group-hover:text-white transition-colors">
                Open-Ended Answers
              </h3>
              <p className="text-[#A3A3A3] text-xs leading-relaxed">
                Collect free-form text responses from audience members and present them on a live streaming answer wall.
              </p>
            </div>
            <div className="pt-2 border-t border-[#292929] font-mono text-[10px] text-[#707070] group-hover:text-[#C62828] uppercase flex items-center justify-between transition-colors">
              <span>FEATURE / RESPONSES</span>
              <span>START &rarr;</span>
            </div>
          </Link>

          {/* Card 03 */}
          <Link
            to="/create-poll"
            className="panel-card-hover p-6 rounded flex flex-col justify-between space-y-6 group cursor-pointer border border-[#292929] hover:border-[#C62828] transition-all animate-fadeInUp stagger-3"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#C62828] font-bold">03</span>
                <div className="flex items-center space-x-1">
                  <HelpCircle className="w-4 h-4 text-[#A3A3A3] group-hover:text-white transition-colors" />
                  <ArrowUpRight className="w-4 h-4 text-[#707070] group-hover:text-[#C62828] transition-colors" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EE] group-hover:text-white transition-colors">
                Q&amp;A Threads &amp; Upvoting
              </h3>
              <p className="text-[#A3A3A3] text-xs leading-relaxed">
                Dedicated Q&amp;A thread allowing audience members to submit questions and upvote top questions in real-time.
              </p>
            </div>
            <div className="pt-2 border-t border-[#292929] font-mono text-[10px] text-[#707070] group-hover:text-[#C62828] uppercase flex items-center justify-between transition-colors">
              <span>FEATURE / INTERACTION</span>
              <span>START &rarr;</span>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
};

export default Landing;
