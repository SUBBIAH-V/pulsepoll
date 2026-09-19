import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { pollService } from '../services/pollService';
import { QRCodeModal } from '../components/QRCodeModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { LiveIndicator } from '../components/LiveIndicator';
import { useToast } from '../components/Toast';
import { Plus, BarChart2, QrCode, Copy, Check, Users, AlertCircle, ArrowUpRight, Share2, Square } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pollToCloseId, setPollToCloseId] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchMyPolls();

    const intervalId = setInterval(async () => {
      try {
        const res = await pollService.getMyPolls();
        if (res.success && res.data) {
          setPolls(res.data);
          setLastUpdated(new Date());
        }
      } catch (_) {}
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchMyPolls = async () => {
    let apiPolls = [];
    try {
      const res = await pollService.getMyPolls();
      if (res && res.success && Array.isArray(res.data)) {
        apiPolls = res.data;
      }
    } catch (_) {}

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

    setPolls(Array.from(combinedMap.values()));
    setLoading(false);
  };

  const openQrModal = (poll) => {
    setActivePoll(poll);
    setModalOpen(true);
  };

  const copyPollLink = (pollId) => {
    const link = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(pollId);
    showToast('✓ Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerClosePoll = (pollId) => {
    setPollToCloseId(pollId);
    setConfirmModalOpen(true);
  };

  const executeClosePoll = async () => {
    if (!pollToCloseId) return;
    setClosing(true);
    try {
      const res = await pollService.closePoll(pollToCloseId);
      if (res.success) {
        setConfirmModalOpen(false);
        setPollToCloseId(null);
        showToast('✓ Poll stopped successfully');
        fetchMyPolls();
      } else {
        setError(res.message || 'Failed to close poll');
      }
    } catch (err) {
      setError(err.message || 'Failed to close poll');
    } finally {
      setClosing(false);
    }
  };

  // Metrics computation
  const totalPolls = polls.length;
  const activePollsCount = polls.filter((p) => !p.isExpired && p.status !== 'closed').length;
  const totalVotesCount = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);

  const primaryActivePoll = polls.find((p) => !p.isExpired && p.status !== 'closed') || polls[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#292929] pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 font-mono text-xs text-[#A3A3A3] uppercase tracking-wider">
            <span>HOST / DASHBOARD</span>
            <span>•</span>
            <LiveIndicator status="LIVE" isRealtime={true} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3EE] uppercase tracking-tight">
            WELCOME, <span className="text-[#E8E1D3]">{user?.name || 'CREATOR'}</span>
          </h1>
        </div>

        <Link
          to="/create-poll"
          className="btn-primary font-mono text-xs uppercase tracking-wider py-3.5 px-6 whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#0B0B0B]" />
          <span>CREATE NEW POLL</span>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded bg-[#191919] border border-[#C62828] text-[#F5F3EE] text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-[#C62828]" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Section (Max 4 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel-card p-5 space-y-1">
          <div className="font-mono text-[10px] text-[#A3A3A3] uppercase tracking-wider">TOTAL POLLS</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">{totalPolls}</div>
        </div>

        <div className="panel-card p-5 space-y-1">
          <div className="font-mono text-[10px] text-[#C62828] uppercase tracking-wider">ACTIVE POLLS</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">{activePollsCount}</div>
        </div>

        <div className="panel-card p-5 space-y-1">
          <div className="font-mono text-[10px] text-[#A3A3A3] uppercase tracking-wider">TOTAL VOTES</div>
          <div className="text-3xl font-extrabold text-[#F5F3EE] font-mono">{totalVotesCount.toLocaleString()}</div>
        </div>

        <div className="panel-card p-5 space-y-1">
          <div className="font-mono text-[10px] text-[#3A8F5B] uppercase tracking-wider">SYSTEM STATUS</div>
          <div className="text-sm font-bold text-[#F5F3EE] font-mono pt-2">ONLINE / 60FPS</div>
        </div>
      </div>

      {/* Active Poll Spotlight Section */}
      {primaryActivePoll && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#707070]">
              FEATURED ACTIVE POLL
            </span>
            <LiveIndicator status={primaryActivePoll.isExpired || primaryActivePoll.status === 'closed' ? 'ENDED' : 'LIVE'} />
          </div>

          <div className="panel-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-xs text-[#A3A3A3]">POLL / {primaryActivePoll.pollId || '001'}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] line-clamp-2">
                  {primaryActivePoll.question}
                </h2>
              </div>
              <div className="font-mono text-right">
                <span className="text-2xl font-black text-[#F5F3EE]">{primaryActivePoll.totalVotes || 0}</span>
                <span className="block text-[10px] text-[#707070] uppercase">TOTAL VOTES</span>
              </div>
            </div>

            {/* Results breakdown */}
            <div className="space-y-3">
              {primaryActivePoll.results?.slice(0, 4).map((opt, idx) => (
                <div key={opt.optionId || idx} className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[#F5F3EE]">
                    <span>0{idx + 1} / {opt.text}</span>
                    <span className="text-[#A3A3A3]">{opt.percentage}% ({opt.votes})</span>
                  </div>
                  <div className="w-full bg-[#141414] h-2 rounded-sm overflow-hidden border border-[#292929]">
                    <div
                      className="bg-[#F5F3EE] h-full result-bar-fill"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-4 border-t border-[#292929] flex flex-wrap items-center gap-3">
              <Link
                to={`/poll/${primaryActivePoll.pollId || primaryActivePoll.id || primaryActivePoll._id}/analytics`}
                className="btn-primary font-mono text-xs uppercase tracking-wider py-2.5 px-4"
              >
                <BarChart2 className="w-4 h-4 text-[#0B0B0B]" />
                <span>VIEW ANALYTICS</span>
              </Link>

              <button
                onClick={() => copyPollLink(primaryActivePoll.pollId || primaryActivePoll.id || primaryActivePoll._id)}
                className="btn-secondary font-mono text-xs uppercase tracking-wider py-2.5 px-4"
              >
                <Copy className="w-4 h-4 text-[#E8E1D3]" />
                <span>COPY LINK</span>
              </button>

              <button
                onClick={() => openQrModal(primaryActivePoll)}
                className="btn-secondary font-mono text-xs uppercase tracking-wider py-2.5 px-4"
              >
                <QrCode className="w-4 h-4 text-[#E8E1D3]" />
                <span>QR CODE</span>
              </button>

              {!primaryActivePoll.isExpired && primaryActivePoll.status !== 'closed' && (
                <button
                  onClick={() => triggerClosePoll(primaryActivePoll.pollId || primaryActivePoll.id || primaryActivePoll._id)}
                  className="btn-danger font-mono text-xs uppercase tracking-wider py-2.5 px-4 ml-auto"
                >
                  <Square className="w-3.5 h-3.5 text-[#E53935]" />
                  <span>STOP POLL</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History & All Polls Section */}
      <div id="history" className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#292929] pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#707070]">
            POLL HISTORY ({polls.length})
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A3A3A3]">
            ALL CREATED POLLS
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-[#707070] uppercase">
            LOADING POLL DATA...
          </div>
        ) : polls.length === 0 ? (
          <div className="panel-card p-12 text-center space-y-4">
            <div className="font-mono text-xs text-[#707070] uppercase">NO POLL HISTORY</div>
            <p className="text-sm text-[#A3A3A3] max-w-sm mx-auto">
              Your completed and active polls will appear here.
            </p>
            <Link
              to="/create-poll"
              className="btn-primary inline-flex font-mono text-xs uppercase tracking-wider py-3 px-6"
            >
              CREATE FIRST POLL
            </Link>
          </div>
        ) : (
          /* Responsive Table on Desktop, Cards on Mobile */
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#292929] text-[#707070] uppercase">
                    <th className="py-3 px-4">POLL</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">VOTES</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292929]">
                  {polls.map((poll) => {
                    const currentId = poll.pollId || poll.id || poll._id || '';
                    const isClosed = poll.isExpired || poll.status === 'closed';

                    return (
                      <tr key={currentId} className="hover:bg-[#141414] transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-[#F5F3EE] max-w-md truncate">
                          {poll.question}
                        </td>
                        <td className="py-4 px-4">
                          <LiveIndicator status={isClosed ? 'ENDED' : 'LIVE'} isRealtime={false} />
                        </td>
                        <td className="py-4 px-4 text-[#A3A3A3]">
                          {poll.totalVotes || 0} votes
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Link
                            to={`/poll/${currentId}/analytics`}
                            className="btn-secondary text-[11px] font-mono py-1.5 px-3"
                          >
                            ANALYTICS
                          </Link>
                          <button
                            onClick={() => copyPollLink(currentId)}
                            className="btn-ghost text-[11px] font-mono py-1.5 px-2"
                            title="Copy link"
                          >
                            LINK
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {polls.map((poll) => {
                const currentId = poll.pollId || poll.id || poll._id || '';
                const isClosed = poll.isExpired || poll.status === 'closed';

                return (
                  <div key={currentId} className="panel-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <LiveIndicator status={isClosed ? 'ENDED' : 'LIVE'} isRealtime={false} />
                      <span className="font-mono text-xs text-[#A3A3A3]">{poll.totalVotes || 0} VOTES</span>
                    </div>

                    <h3 className="font-bold text-[#F5F3EE] text-sm line-clamp-2">
                      {poll.question}
                    </h3>

                    <div className="pt-3 border-t border-[#292929] flex items-center justify-between gap-2">
                      <Link
                        to={`/poll/${currentId}/analytics`}
                        className="btn-secondary text-xs font-mono py-2 px-4 flex-1 text-center"
                      >
                        VIEW ANALYTICS
                      </Link>
                      <button
                        onClick={() => copyPollLink(currentId)}
                        className="btn-ghost text-xs font-mono py-2 px-3"
                      >
                        COPY LINK
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {activePoll && (
        <QRCodeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          pollUrl={`${window.location.origin}/poll/${activePoll.pollId || activePoll.id || activePoll._id}`}
          question={activePoll.question}
        />
      )}

      {/* Stop Poll Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={executeClosePoll}
        title="STOP LIVE POLL?"
        message="Are you sure you want to stop this poll? Audience members will no longer be able to submit votes."
        loading={closing}
      />
    </div>
  );
};

export default Dashboard;
