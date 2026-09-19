import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pollService } from '../services/pollService';
import { LiveIndicator } from '../components/LiveIndicator';
import { useToast } from '../components/Toast';
import { soundFx } from '../utils/soundFx';
import { 
  History, 
  BarChart2, 
  Copy, 
  Check, 
  Users, 
  AlertCircle, 
  Plus, 
  Clock, 
  Lock, 
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';

export const PollHistory = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'closed'
  const [copiedId, setCopiedId] = useState(null);
  const [lookupQuery, setLookupQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    let apiPolls = [];
    try {
      const res = await pollService.getMyPolls();
      if (res && res.success && Array.isArray(res.data)) {
        apiPolls = res.data;
      }
    } catch (_) {}

    // Merge with local storage fallback polls
    let localSaved = [];
    try {
      localSaved = JSON.parse(localStorage.getItem('pulsepoll_created_polls') || '[]');
    } catch (_) {}

    const combinedMap = new Map();
    apiPolls.forEach(p => {
      const id = p.pollId || p.id;
      if (id) combinedMap.set(id, p);
    });
    localSaved.forEach(p => {
      const id = p.pollId || p.id;
      if (id && !combinedMap.has(id)) {
        combinedMap.set(id, p);
      }
    });

    const mergedList = Array.from(combinedMap.values());
    setPolls(mergedList);
    setLoading(false);
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    const clean = lookupQuery.trim();
    if (!clean) return;
    soundFx.playClick();
    navigate(`/poll/${clean}/analytics`);
  };

  const copyPollLink = (poll) => {
    soundFx.playClick();
    const pin = poll.pinCode || poll.pollId?.substring(0, 6).toUpperCase();
    const link = `${window.location.origin}/poll/${poll.pollId || poll.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(poll.pollId || poll.id);
    showToast(`✓ Link & PIN (${pin}) copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPolls = polls.filter((p) => {
    const isClosed = p.isExpired || p.status === 'closed';
    if (filter === 'active') return !isClosed;
    if (filter === 'closed') return isClosed;
    return true;
  });

  const totalVotesCount = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);
  const closedCount = polls.filter((p) => p.isExpired || p.status === 'closed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeInUp">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#292929] pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-[#C62828]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EE] uppercase font-mono tracking-tight">
              POLL HISTORY &amp; ANALYTICS ARCHIVE
            </h1>
          </div>
          <p className="text-xs text-[#A3A3A3] font-mono">
            Access past presentation results, live interactive analytics, and 6-digit PIN codes.
          </p>
        </div>

        <Link
          to="/create-poll"
          onClick={() => soundFx.playClick()}
          className="btn-accent font-mono text-xs uppercase tracking-wider py-2.5 px-5 flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>CREATE NEW POLL</span>
        </Link>
      </div>

      {/* Quick Analytics Lookup Bar */}
      <div className="panel-card p-5 space-y-3 font-mono">
        <div className="flex items-center space-x-2 text-xs text-[#F5F3EE] font-bold">
          <Search className="w-4 h-4 text-[#C62828]" />
          <span className="uppercase">INSTANT ANALYTICS LOOKUP BY PIN / ID</span>
        </div>
        <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Enter 6-digit PIN or Poll ID (e.g. 839102)"
            className="input-field flex-1 font-mono text-xs tracking-wider uppercase"
          />
          <button
            type="submit"
            className="btn-primary font-mono text-xs uppercase tracking-wider py-2.5 px-6 flex items-center justify-center space-x-2 shrink-0"
          >
            <span>VIEW ANALYTICS</span>
            <ArrowRight className="w-4 h-4 text-[#0B0B0B]" />
          </button>
        </form>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="panel-card p-5 space-y-1">
          <span className="text-[11px] text-[#707070] uppercase tracking-wider font-bold">TOTAL PRESENTATIONS</span>
          <div className="text-2xl font-black text-[#F5F3EE]">{polls.length}</div>
        </div>
        <div className="panel-card p-5 space-y-1">
          <span className="text-[11px] text-[#707070] uppercase tracking-wider font-bold">TOTAL VOTES RECORDED</span>
          <div className="text-2xl font-black text-[#C62828]">{totalVotesCount}</div>
        </div>
        <div className="panel-card p-5 space-y-1">
          <span className="text-[11px] text-[#707070] uppercase tracking-wider font-bold">COMPLETED ARCHIVES</span>
          <div className="text-2xl font-black text-[#3A8F5B]">{closedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292929] pb-4 gap-4 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#C62828]" />
          <span className="text-[#A3A3A3] uppercase">FILTER BY STATUS:</span>
        </div>

        <div className="flex items-center bg-[#141414] p-1 rounded border border-[#292929] space-x-1">
          <button
            onClick={() => { soundFx.playClick(); setFilter('all'); }}
            className={`px-3 py-1.5 rounded transition-all ${
              filter === 'all' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
            }`}
          >
            ALL ({polls.length})
          </button>
          <button
            onClick={() => { soundFx.playClick(); setFilter('active'); }}
            className={`px-3 py-1.5 rounded transition-all ${
              filter === 'active' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
            }`}
          >
            ACTIVE ({polls.length - closedCount})
          </button>
          <button
            onClick={() => { soundFx.playClick(); setFilter('closed'); }}
            className={`px-3 py-1.5 rounded transition-all ${
              filter === 'closed' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
            }`}
          >
            CLOSED ({closedCount})
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="py-16 text-center space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-[#C62828] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#707070] uppercase tracking-wider">RETRIEVING POLL HISTORY...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded bg-[#191919] border border-[#C62828] text-center space-y-2 font-mono">
          <AlertCircle className="w-6 h-6 text-[#C62828] mx-auto" />
          <p className="text-xs text-[#F5F3EE]">{error}</p>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="panel-card p-12 text-center space-y-4 font-mono">
          <History className="w-12 h-12 text-[#707070] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F5F3EE] uppercase">NO POLL HISTORY FOUND</h3>
            <p className="text-xs text-[#707070] max-w-sm mx-auto">
              Create your first live presentation or enter a PIN code above to view live analytics!
            </p>
          </div>
          <Link
            to="/create-poll"
            className="btn-accent text-xs font-mono uppercase tracking-wider py-2.5 px-6 inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE POLL NOW</span>
          </Link>
        </div>
      ) : (
        /* History Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          {filteredPolls.map((poll) => {
            const pId = poll.pollId || poll.id;
            const pinCode = poll.pinCode || pId?.substring(0, 6).toUpperCase();
            const isClosed = poll.isExpired || poll.status === 'closed';
            const questionsCount = poll.questions ? poll.questions.length : 1;

            return (
              <div key={pId} className="panel-card p-6 space-y-5 flex flex-col justify-between hover:border-[#C62828]/50 transition-all">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {isClosed ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#C62828]/20 border border-[#C62828]/40 text-[#FF5252] text-[10px] font-bold">
                        <Lock className="w-3 h-3" />
                        <span>CLOSED ARCHIVE</span>
                      </span>
                    ) : (
                      <LiveIndicator status="LIVE" isRealtime={true} />
                    )}

                    <div className="flex items-center space-x-2 bg-[#141414] border border-[#292929] px-2.5 py-1 rounded text-xs">
                      <span className="text-[#707070]">PIN:</span>
                      <span className="text-[#F5F3EE] font-bold tracking-wider">{pinCode}</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-[#F5F3EE] leading-snug line-clamp-2">
                    {poll.question || (poll.questions && poll.questions[0]?.title) || 'Untitled Poll'}
                  </h2>

                  <div className="flex items-center space-x-4 text-xs text-[#707070]">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      <span className="text-[#F5F3EE] font-medium">{poll.totalVotes || 0} votes</span>
                    </span>
                    <span>•</span>
                    <span>{questionsCount} {questionsCount === 1 ? 'slide' : 'slides'}</span>
                    {poll.createdAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#292929] grid grid-cols-2 gap-3">
                  <Link
                    to={`/poll/${pId}/analytics`}
                    onClick={() => soundFx.playClick()}
                    className="btn-accent text-xs uppercase tracking-wider py-2.5 px-3 flex items-center justify-center space-x-1.5 text-center"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>ANALYTICS</span>
                  </Link>

                  <button
                    onClick={() => copyPollLink(poll)}
                    className="btn-secondary text-xs uppercase tracking-wider py-2.5 px-3 flex items-center justify-center space-x-1.5"
                  >
                    {copiedId === pId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3A8F5B]" />
                        <span className="text-[#3A8F5B]">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#A3A3A3]" />
                        <span>COPY PIN</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PollHistory;
