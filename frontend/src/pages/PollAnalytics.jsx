import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pollService } from '../services/pollService';
import { useWebSocket } from '../hooks/useWebSocket';
import { ConfirmModal } from '../components/ConfirmModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { LiveIndicator } from '../components/LiveIndicator';
import { useToast } from '../components/Toast';
import { soundFx } from '../utils/soundFx';
import { ArrowLeft, Copy, QrCode, Square, AlertCircle, Loader2, ThumbsUp, Play } from 'lucide-react';

export const PollAnalytics = () => {
  const { id: pollId } = useParams();
  const { showToast } = useToast();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  const fetchPollData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await pollService.getPollByID(pollId);
      if (res?.success && res.data) {
        setPoll(res.data);
      } else if (showLoader) {
        setError(res?.message || 'Poll not found');
      }
    } catch (err) {
      if (showLoader) setError(err.message || 'Failed to load poll');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleWsUpdate = useCallback((message) => {
    if (!message || message.pollId !== pollId) return;
    fetchPollData(false);
  }, [pollId]);

  const { isConnected } = useWebSocket(pollId, handleWsUpdate);

  useEffect(() => {
    if (!pollId) return;
    fetchPollData(true);
    const intervalId = setInterval(() => fetchPollData(false), 2000);
    return () => clearInterval(intervalId);
  }, [pollId]);

  const handleSetActiveSlide = async (slideIndex) => {
    try {
      soundFx.playClick();
      const res = await pollService.setActiveSlide(pollId, slideIndex);
      if (res?.success && res.data) {
        setPoll(res.data);
        showToast(`✓ Switched to Slide 0${slideIndex + 1}`);
      }
    } catch (_) {}
  };

  const handleClosePoll = async () => {
    setClosing(true);
    try {
      const res = await pollService.closePoll(pollId);
      if (res?.success) {
        setPoll(prev => prev ? { ...prev, status: 'closed' } : prev);
        setConfirmOpen(false);
        showToast('✓ Poll presentation stopped');
      }
    } catch (err) {
      alert(err.message || 'Failed to close poll');
    } finally {
      setClosing(false);
    }
  };

  const pollUrl = `${window.location.origin}/poll/${pollId}`;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 font-mono text-xs text-[#707070] uppercase">
        <Loader2 className="w-8 h-8 text-[#E8E1D3] animate-spin" />
        <span>LOADING ANALYTICS...</span>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4 font-mono">
        <AlertCircle className="w-8 h-8 text-[#C62828] mx-auto" />
        <p className="text-[#F5F3EE] font-bold text-xs">{error}</p>
        <Link to="/dashboard" className="btn-primary inline-block text-xs uppercase tracking-wider py-2.5 px-6">
          BACK TO DASHBOARD
        </Link>
      </div>
    );
  }

  const questionsList = poll?.questions || [
    {
      id: 'q1',
      type: 'multiple_choice',
      title: poll?.question || '',
      options: poll?.options || [],
      responses: []
    }
  ];

  const activeIdx = poll?.activeQuestionIndex || 0;
  const currentQuestion = questionsList[activeIdx] || questionsList[0];
  const isClosed = poll?.status === 'closed' || poll?.isExpired;
  const audienceQA = poll?.audienceQA || [];

  const currentOptions = currentQuestion.options || [];
  const totalVotes = poll?.totalVotes || 0;
  
  const formattedResults = currentOptions.map((opt) => {
    const votes = opt.votes || 0;
    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return { optionId: opt.id, text: opt.text, votes, percentage: pct };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#292929] pb-4 font-mono text-xs gap-4">
        <Link to="/dashboard" className="text-[#A3A3A3] hover:text-[#F5F3EE] uppercase flex items-center space-x-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>DASHBOARD</span>
        </Link>

        <div className="flex items-center space-x-3">
          <span>HOST ANALYTICS</span>
          <span>•</span>
          <LiveIndicator status={isClosed ? 'ENDED' : 'LIVE'} isRealtime={isConnected} />
        </div>
      </div>

      {/* Slide Switcher */}
      {questionsList.length > 1 && (
        <div className="panel-card p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[#707070] uppercase">
            <span>SLIDE CONTROLLER</span>
            <span>SLIDE 0{activeIdx + 1} / 0{questionsList.length}</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {questionsList.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSetActiveSlide(idx)}
                className={`px-3 py-2 rounded border uppercase transition-colors shrink-0 flex items-center space-x-1.5 ${
                  activeIdx === idx
                    ? 'bg-[#191919] border-[#E8E1D3] text-[#F5F3EE] font-bold'
                    : 'bg-[#141414] border-[#292929] text-[#707070] hover:text-[#A3A3A3]'
                }`}
              >
                <span>SLIDE 0{idx + 1}</span>
                {activeIdx === idx && <Play className="w-3 h-3 text-[#C62828] fill-[#C62828]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Results Container */}
      <div className="panel-card p-6 sm:p-8 space-y-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-6">
          <div className="space-y-1">
            <span className="font-mono text-xs text-[#707070] uppercase">
              ANALYTICS / SLIDE 0{activeIdx + 1}
            </span>
            <h1 className="text-2xl font-bold text-[#F5F3EE]">
              {currentQuestion.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => { navigator.clipboard.writeText(pollUrl); setCopied(true); showToast('✓ Link copied'); setTimeout(() => setCopied(false), 2000); }}
              className="btn-secondary py-2 px-3"
            >
              <Copy className="w-3.5 h-3.5 text-[#E8E1D3]" />
              <span>{copied ? 'COPIED' : 'LINK'}</span>
            </button>

            <button
              onClick={() => setQrOpen(true)}
              className="btn-secondary py-2 px-3"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E8E1D3]" />
            </button>

            {!isClosed && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn-danger py-2 px-3"
              >
                <Square className="w-3.5 h-3.5 text-[#E53935]" />
                <span>STOP</span>
              </button>
            )}
          </div>
        </div>

        {/* Total Votes Stat */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
          <div className="panel-card p-4 space-y-1">
            <span className="text-[10px] text-[#707070] uppercase">TOTAL VOTES</span>
            <span className="text-2xl font-bold text-[#F5F3EE] block">{totalVotes}</span>
          </div>

          <div className="panel-card p-4 space-y-1">
            <span className="text-[10px] text-[#707070] uppercase">SLIDES</span>
            <span className="text-2xl font-bold text-[#F5F3EE] block">{questionsList.length}</span>
          </div>

          <div className="panel-card p-4 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#707070] uppercase">Q&A SUBMISSIONS</span>
            <span className="text-2xl font-bold text-[#F5F3EE] block">{audienceQA.length}</span>
          </div>
        </div>

        {/* Results Bar Visualization */}
        {currentQuestion.type === 'multiple_choice' ? (
          <div className="space-y-4 pt-2 font-mono">
            <span className="text-xs text-[#707070] uppercase tracking-wider block">
              VOTE BREAKDOWN
            </span>

            {formattedResults.map((opt, idx) => (
              <div key={opt.optionId || idx} className="space-y-1">
                <div className="flex justify-between text-xs text-[#F5F3EE]">
                  <span>0{idx + 1} / {opt.text}</span>
                  <span className="text-[#A3A3A3]">{opt.percentage}% ({opt.votes})</span>
                </div>
                <div className="w-full bg-[#141414] h-3 rounded border border-[#292929] overflow-hidden">
                  <div
                    className="bg-[#F5F3EE] h-full result-bar-fill"
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Open Responses List */
          <div className="space-y-4 pt-2 font-mono">
            <span className="text-xs text-[#707070] uppercase tracking-wider block">
              RESPONSES WALL ({(currentQuestion.responses || []).length})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(currentQuestion.responses || []).map((r, idx) => (
                <div key={r.id || idx} className="p-4 rounded bg-[#141414] border border-[#292929] space-y-2">
                  <p className="text-xs font-bold text-[#F5F3EE]">"{r.text}"</p>
                  <span className="text-[10px] text-[#707070] block text-right">
                    {new Date(r.createdAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Q&A Thread Moderation */}
      <div className="panel-card p-6 sm:p-8 space-y-6 font-mono">
        <div className="space-y-1">
          <span className="text-xs text-[#707070] uppercase">Q&A MODERATION</span>
          <h2 className="text-lg font-bold text-[#F5F3EE]">AUDIENCE QUESTIONS ({audienceQA.length})</h2>
        </div>

        <div className="space-y-3">
          {audienceQA.length === 0 ? (
            <div className="text-xs text-[#707070] text-center py-6">
              NO QUESTIONS SUBMITTED YET.
            </div>
          ) : (
            [...audienceQA]
              .sort((a, b) => b.upvotes - a.upvotes)
              .map((qa) => (
                <div key={qa.id} className="p-4 rounded bg-[#141414] border border-[#292929] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#F5F3EE]">"{qa.question}"</p>
                    <span className="text-[10px] text-[#707070]">BY {qa.askedBy || 'ANONYMOUS'}</span>
                  </div>
                  <div className="btn-secondary text-xs py-1.5 px-3 flex items-center space-x-1.5 shrink-0">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#E8E1D3]" />
                    <span>{qa.upvotes || 0}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Modals */}
      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        pollUrl={pollUrl}
        question={currentQuestion?.title || poll?.question || ''}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClosePoll}
        loading={closing}
        title="STOP LIVE POLL?"
        message="Are you sure you want to stop this poll? Audience members will no longer be able to submit votes."
      />
    </div>
  );
};

export default PollAnalytics;
