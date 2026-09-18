import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pollService } from '../services/pollService';
import { useWebSocket } from '../hooks/useWebSocket';
import { ConfirmModal } from '../components/ConfirmModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { LiveIndicator } from '../components/LiveIndicator';
import { useToast } from '../components/Toast';
import { soundFx } from '../utils/soundFx';
import { 
  ArrowLeft, Copy, QrCode, Square, AlertCircle, Loader2, ThumbsUp, 
  Download, Maximize2, Minimize2, Check, Share2
} from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Handle ESC key to exit Fullscreen Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
  const pinCode = pollId ? pollId.substring(0, 6).toUpperCase() : '------';

  const copyPollLink = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    showToast(`✓ Link & PIN (${pinCode}) copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Feature 1: One-Click CSV Analytics Export
  const handleExportCSV = () => {
    if (!poll) return;
    soundFx.playClick();

    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `PulsePoll Analytics Report\n`;
    csvContent += `Poll ID,${poll.id || pollId}\n`;
    csvContent += `Title,${(poll.question || '').replace(/,/g, ' ')}\n`;
    csvContent += `Status,${poll.status || 'active'}\n`;
    csvContent += `Total Votes,${poll.totalVotes || 0}\n\n`;

    const questionsList = poll.questions || [{ title: poll.question, options: poll.options || [] }];

    questionsList.forEach((q, idx) => {
      csvContent += `--- Slide 0${idx + 1}: ${(q.title || '').replace(/,/g, ' ')} ---\n`;
      csvContent += `Option ID,Option Text,Votes,Percentage\n`;
      (q.options || []).forEach((opt, oIdx) => {
        const votes = opt.votes || 0;
        const total = poll.totalVotes || 1;
        const pct = Math.round((votes / (poll.totalVotes || 1)) * 100);
        csvContent += `0${oIdx + 1},${(opt.text || '').replace(/,/g, ' ')},${votes},${pct}%\n`;
      });
      csvContent += `\n`;
    });

    if (poll.audienceQA && poll.audienceQA.length > 0) {
      csvContent += `--- Audience Q&A Submissions ---\n`;
      csvContent += `Question,Asked By,Upvotes\n`;
      poll.audienceQA.forEach((qa) => {
        csvContent += `"${(qa.question || '').replace(/"/g, '""')}",${qa.askedBy || 'Anonymous'},${qa.upvotes || 0}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PulsePoll_Export_${pollId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✓ Analytics Report downloaded (CSV)');
  };

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeInUp">

      {/* Feature 4: One-Click Join Link & Pin Code Toast Bar */}
      <div className="panel-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs border-l-4 border-l-[#C62828]">
        <div className="flex items-center space-x-3">
          <Share2 className="w-4 h-4 text-[#C62828]" />
          <div>
            <span className="text-[#707070] uppercase block">LIVE AUDIENCE JOIN LINK</span>
            <span className="text-[#F5F3EE] font-bold text-sm">{window.location.host}/poll/{pollId}</span>
          </div>
          <div className="hidden sm:block border-r border-[#292929] h-8 mx-2" />
          <div className="hidden sm:block">
            <span className="text-[#707070] uppercase block">PIN CODE</span>
            <span className="text-[#C62828] font-bold text-sm tracking-widest">{pinCode}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={copyPollLink}
            className="btn-secondary py-2 px-4 text-xs flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4CAF50]" /> : <Copy className="w-3.5 h-3.5 text-[#E8E1D3]" />}
            <span>{copied ? 'COPIED!' : 'COPY LINK & PIN'}</span>
          </button>
        </div>
      </div>

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

      {/* Feature 1 & 2 Action Controls (Fullscreen Mode & Export CSV) */}
      <div className="panel-card p-6 space-y-6 font-mono">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-4">
          <div>
            <span className="text-[10px] text-[#707070] uppercase tracking-wider block">LIVE PRESENTATION TITLE</span>
            <h1 className="text-xl font-bold text-[#F5F3EE] tracking-tight">{poll?.question}</h1>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Fullscreen Presentation Mode Button */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="btn-primary py-2 px-3 text-xs flex items-center space-x-1.5"
              title="Fullscreen Presentation Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#0B0B0B]" />
              <span>PRESENT</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="btn-secondary py-2 px-3 text-xs flex items-center space-x-1.5"
              title="Export CSV Analytics Report"
            >
              <Download className="w-3.5 h-3.5 text-[#E8E1D3]" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={() => setQrOpen(true)}
              className="btn-secondary py-2 px-3 text-xs flex items-center space-x-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E8E1D3]" />
            </button>

            {!isClosed && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn-danger py-2 px-3 text-xs flex items-center space-x-1.5"
              >
                <Square className="w-3.5 h-3.5 text-[#E53935]" />
                <span>STOP</span>
              </button>
            )}
          </div>
        </div>

        {/* Slide Switcher */}
        {questionsList.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[#707070] uppercase text-xs">
              <span>SLIDE CONTROLLER</span>
              <span>SLIDE 0{activeIdx + 1} / 0{questionsList.length}</span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {questionsList.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSetActiveSlide(idx)}
                  className={`px-3 py-2 rounded border uppercase transition-colors shrink-0 flex items-center space-x-1.5 text-xs ${
                    activeIdx === idx
                      ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold border-[#F5F3EE]'
                      : 'bg-[#141414] text-[#A3A3A3] border-[#292929] hover:border-[#F5F3EE]'
                  }`}
                >
                  <span>0{idx + 1}.</span>
                  <span className="max-w-[120px] truncate">{q.title || `Slide ${idx + 1}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Total Votes Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
          <div className="panel-card p-4 space-y-1">
            <span className="text-[10px] text-[#707070] uppercase">TOTAL VOTES</span>
            <span className="text-2xl font-bold text-[#F5F3EE] block animate-pulse">{totalVotes}</span>
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

        {/* Feature 3: Results Bar Visualization with Animated Fill */}
        {currentQuestion.type === 'multiple_choice' ? (
          <div className="space-y-4 pt-2 font-mono">
            <span className="text-xs text-[#707070] uppercase tracking-wider block">
              VOTE BREAKDOWN (SLIDE 0{activeIdx + 1})
            </span>

            {formattedResults.map((opt, idx) => (
              <div key={opt.optionId || idx} className="space-y-1">
                <div className="flex justify-between text-xs text-[#F5F3EE]">
                  <span>0{idx + 1} / {opt.text}</span>
                  <span className="text-[#A3A3A3] font-bold">{opt.percentage}% ({opt.votes} votes)</span>
                </div>
                <div className="w-full bg-[#141414] h-4 rounded border border-[#292929] overflow-hidden">
                  <div
                    className="bg-[#F5F3EE] h-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${opt.percentage}%`,
                      boxShadow: opt.percentage > 0 ? '0 0 10px rgba(245, 243, 238, 0.3)' : 'none'
                    }}
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

      {/* Feature 2: Fullscreen Presentation Mode Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0B] text-[#F5F3EE] p-8 sm:p-12 flex flex-col justify-between font-mono animate-fadeInUp">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#292929] pb-6">
            <div className="flex items-center space-x-4">
              <span className="text-xs text-[#C62828] font-bold border border-[#C62828] px-3 py-1 rounded tracking-widest">
                LIVE PRESENTATION MODE
              </span>
              <span className="text-xs text-[#707070]">JOIN AT: {window.location.host}/poll/{pollId}</span>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-secondary py-2 px-4 text-xs flex items-center space-x-2"
            >
              <Minimize2 className="w-4 h-4 text-[#F5F3EE]" />
              <span>EXIT PRESENTATION (ESC)</span>
            </button>
          </div>

          {/* Main Slide Presentation Content */}
          <div className="my-auto max-w-5xl mx-auto w-full space-y-8 py-8">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs text-[#707070] uppercase">SLIDE 0{activeIdx + 1} OF 0{questionsList.length}</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE]">
                {currentQuestion.title || poll?.question}
              </h2>
            </div>

            {/* Animated Large Bar Visualization */}
            <div className="space-y-6 pt-4">
              {formattedResults.map((opt, idx) => (
                <div key={opt.optionId || idx} className="space-y-2">
                  <div className="flex justify-between text-lg text-[#F5F3EE] font-bold">
                    <span>{opt.text}</span>
                    <span className="text-[#C62828]">{opt.percentage}% ({opt.votes} votes)</span>
                  </div>
                  <div className="w-full bg-[#141414] h-8 rounded-lg border border-[#292929] overflow-hidden p-1">
                    <div
                      className="bg-gradient-to-r from-[#C62828] to-[#F5F3EE] h-full rounded transition-all duration-700 ease-out"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="border-t border-[#292929] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#707070]">
            <div>
              TOTAL VOTES: <span className="text-[#F5F3EE] font-bold text-sm">{totalVotes}</span>
            </div>
            <div>
              PRESS <kbd className="px-2 py-1 bg-[#141414] border border-[#292929] rounded text-[#F5F3EE]">ESC</kbd> TO EXIT FULLSCREEN
            </div>
          </div>

        </div>
      )}

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
