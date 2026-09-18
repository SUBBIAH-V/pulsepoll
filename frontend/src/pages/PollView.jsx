import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pollService } from '../services/pollService';
import { useWebSocket } from '../hooks/useWebSocket';
import { getVoterId } from '../utils/voterId';
import { QRCodeModal } from '../components/QRCodeModal';
import { soundFx } from '../utils/soundFx';
import confetti from 'canvas-confetti';
import {
  Radio, Users, QrCode, Copy, Check,
  AlertCircle, Loader2, CheckCircle2, Lock, Wifi, WifiOff,
  MessageSquare, ThumbsUp, Send, HelpCircle, ChevronLeft, ChevronRight, ListFilter, ArrowRight, Sparkles, X
} from 'lucide-react';

const BAR_GRADIENTS = [
  'linear-gradient(90deg, #C62828, #E53935)',
  'linear-gradient(90deg, #B71C1C, #D32F2F)',
  'linear-gradient(90deg, #E53935, #EF5350)',
  'linear-gradient(90deg, #C62828, #FF5252)',
  'linear-gradient(90deg, #B71C1C, #E53935)',
  'linear-gradient(90deg, #D32F2F, #FF5252)',
];

export const PollView = () => {
  const { id: pollId } = useParams();
  const [poll, setPoll] = useState(null);
  
  const [votedMap, setVotedMap] = useState({});
  const [selectedOption, setSelectedOption] = useState('');
  const [openResponseText, setOpenResponseText] = useState('');
  const [submittedResponseMap, setSubmittedResponseMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  
  // Closed Poll Pop-up Modal state
  const [closedModalOpen, setClosedModalOpen] = useState(false);
  const [hasInitializedClosedModal, setHasInitializedClosedModal] = useState(false);

  const [activeTab, setActiveTab] = useState('poll');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [lastHostSlideIdx, setLastHostSlideIdx] = useState(null);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [askedByName, setAskedByName] = useState('');
  const [submittingQA, setSubmittingQA] = useState(false);
  const [upvotedQAIds, setUpvotedQAIds] = useState(new Set());

  const voterId = getVoterId();

  const loadSavedVotes = (questions) => {
    const newVotedMap = {};
    const newSubmittedRespMap = {};
    (questions || []).forEach((q) => {
      const savedOpt = localStorage.getItem(`pulsepoll_voted_${pollId}_${q.id}`) ||
                       localStorage.getItem(`pulsepoll_voted_${pollId}`);
      if (savedOpt) {
        newVotedMap[q.id] = savedOpt;
      }
      const savedResp = localStorage.getItem(`pulsepoll_resp_${pollId}_${q.id}`);
      if (savedResp) {
        newSubmittedRespMap[q.id] = true;
      }
    });
    setVotedMap(newVotedMap);
    setSubmittedResponseMap(newSubmittedRespMap);
  };

  const fetchPollData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await pollService.getPollByID(pollId);
      if (res && res.success && res.data) {
        const data = res.data;
        setPoll(data);

        const qList = data.questions && data.questions.length > 0
          ? data.questions
          : [{ id: 'q1', type: 'multiple_choice', title: data.question || '', options: data.options || [] }];

        loadSavedVotes(qList);

        // Check if poll is closed on initial fetch
        const isPollClosed = data.status === 'closed' || data.isExpired === true;
        if (isPollClosed && !hasInitializedClosedModal) {
          setClosedModalOpen(true);
          setHasInitializedClosedModal(true);
        }

        if (data.activeQuestionIndex !== undefined && data.activeQuestionIndex !== lastHostSlideIdx) {
          setLastHostSlideIdx(data.activeQuestionIndex);
          setActiveSlideIdx(data.activeQuestionIndex);
        }
      } else if (showSpinner) {
        setError(res?.message || 'Poll not found');
      }
    } catch (err) {
      if (showSpinner) setError(err.message || 'Poll not found');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleRealtimeUpdate = useCallback((message) => {
    if (message && message.pollId === pollId) {
      if (message.type === 'poll_update' || message.type === 'slide_update' || message.type === 'qa_update') {
        fetchPollData(false);
      }
      if (message.type === 'poll_closed') {
        setPoll((prev) => prev ? { ...prev, status: 'closed' } : prev);
        setClosedModalOpen(true);
        try { soundFx.playClick(); } catch (_) {}
      }
    }
  }, [pollId, lastHostSlideIdx]);

  const { isConnected } = useWebSocket(pollId, handleRealtimeUpdate);

  useEffect(() => {
    if (pollId) {
      fetchPollData(true);
    }
  }, [pollId]);

  const questionsList = poll?.questions && poll.questions.length > 0
    ? poll.questions
    : (poll ? [{ id: 'q1', type: 'multiple_choice', title: poll.question || '', options: poll.options || [] }] : []);

  const currentQuestion = questionsList[activeSlideIdx] || questionsList[0] || {};
  const qId = currentQuestion.id || 'q1';
  const isClosed = poll?.status === 'closed' || poll?.isExpired === true;
  const hasVotedCurrentQ = !!votedMap[qId];
  const hasSubmittedOpenResp = !!submittedResponseMap[qId];
  const userVotedOptionForCurrentQ = votedMap[qId];

  const handleOptionSelect = (optionId) => {
    if (hasVotedCurrentQ || isClosed) return;
    soundFx.playClick();
    setSelectedOption(optionId);
  };

  const handleVoteSubmit = async () => {
    if (!selectedOption || hasVotedCurrentQ || isClosed || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      soundFx.playVoteSubmit();
      const res = await pollService.submitVote(pollId, selectedOption, qId, voterId);
      if (res && res.success) {
        localStorage.setItem(`pulsepoll_voted_${pollId}_${qId}`, selectedOption);
        localStorage.setItem(`pulsepoll_voted_${pollId}`, selectedOption);
        setVotedMap((prev) => ({ ...prev, [qId]: selectedOption }));
        setSelectedOption('');

        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch (_) {}

        fetchPollData(false);
      } else {
        setError(res?.message || 'Failed to submit vote');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResponseSubmit = async (e) => {
    e.preventDefault();
    if (!openResponseText.trim() || hasSubmittedOpenResp || isClosed || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      soundFx.playVoteSubmit();
      const res = await pollService.submitOpenResponse(pollId, qId, openResponseText.trim(), voterId);
      if (res && res.success) {
        localStorage.setItem(`pulsepoll_resp_${pollId}_${qId}`, 'true');
        setSubmittedResponseMap((prev) => ({ ...prev, [qId]: true }));
        setOpenResponseText('');

        try {
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        } catch (_) {}

        fetchPollData(false);
      } else {
        setError(res?.message || 'Failed to submit answer');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQASubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || submittingQA || isClosed) return;
    setSubmittingQA(true);

    try {
      soundFx.playClick();
      const res = await pollService.submitQAQuestion(pollId, newQuestionText.trim(), askedByName.trim() || 'Anonymous', voterId);
      if (res && res.success) {
        setNewQuestionText('');
        setAskedByName('');
        fetchPollData(false);
      }
    } catch (_) {} finally {
      setSubmittingQA(false);
    }
  };

  const handleQAUpvote = async (qaId) => {
    if (upvotedQAIds.has(qaId) || isClosed) return;
    soundFx.playClick();
    setUpvotedQAIds((prev) => new Set(prev).add(qaId));

    try {
      const res = await pollService.upvoteQAQuestion(pollId, qaId, voterId);
      if (res && res.success) {
        fetchPollData(false);
      }
    } catch (_) {}
  };

  const copyPollLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextSlide = () => {
    if (activeSlideIdx < questionsList.length - 1) {
      soundFx.playClick();
      setActiveSlideIdx(activeSlideIdx + 1);
      setSelectedOption('');
    }
  };

  const prevSlide = () => {
    if (activeSlideIdx > 0) {
      soundFx.playClick();
      setActiveSlideIdx(activeSlideIdx - 1);
      setSelectedOption('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-mono">
        <Loader2 className="w-10 h-10 text-[#C62828] animate-spin" />
        <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">LOADING POLL PRESENTATION...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="panel-card p-8 rounded text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#C62828] mx-auto" />
          <h2 className="text-xl font-extrabold text-[#F5F3EE] uppercase font-mono">Poll Not Found</h2>
          <p className="text-xs text-[#A3A3A3] font-mono">{error}</p>
          <Link to="/" className="btn-accent text-xs font-mono uppercase tracking-wider py-2.5 px-6">
            RETURN HOME
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = poll?.totalVotes || 0;
  const audienceQA = poll?.audienceQA || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeInUp relative">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#292929] pb-4">
        <div className="flex items-center space-x-3 text-xs font-mono">
          {isConnected ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#141414] border border-[#3A8F5B]/40 text-[#3A8F5B] font-bold">
              <Wifi className="w-3 h-3 text-[#3A8F5B] animate-pulse" />
              <span>LIVE SYNCED</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#141414] border border-[#292929] text-[#707070]">
              <WifiOff className="w-3 h-3" />
              <span>CONNECTING...</span>
            </span>
          )}

          <span className="flex items-center space-x-1 text-[#A3A3A3]">
            <Users className="w-3.5 h-3.5" />
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </span>

          {isClosed && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#C62828]/20 border border-[#C62828]/40 text-[#FF5252] text-[11px] font-bold">
              <Lock className="w-3 h-3" />
              <span>CLOSED</span>
            </span>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-[#141414] p-1 rounded border border-[#292929]">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('poll'); }}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded font-mono text-xs uppercase transition-all ${
              activeTab === 'poll' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Questions ({questionsList.length})</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('qa'); }}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded font-mono text-xs uppercase transition-all relative ${
              activeTab === 'qa' ? 'bg-[#F5F3EE] text-[#0B0B0B] font-bold' : 'text-[#A3A3A3] hover:text-[#F5F3EE]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Audience Q&amp;A</span>
            {audienceQA.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-[#C62828] text-white text-[10px] font-bold">
                {audienceQA.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'poll' ? (
        <div className="space-y-6">

          {/* Slide Navigation Header */}
          {questionsList.length > 1 && (
            <div className="flex items-center justify-between bg-[#141414] px-4 py-3 rounded border border-[#292929] text-xs font-mono">
              <span className="text-[#F5F3EE] font-bold flex items-center space-x-2">
                <span>QUESTION {activeSlideIdx + 1} OF {questionsList.length}</span>
                {votedMap[qId] && <span className="text-[#3A8F5B] text-[11px] font-bold">✓ ANSWERED</span>}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={activeSlideIdx === 0}
                  onClick={prevSlide}
                  className="btn-secondary text-xs font-mono py-1 px-3 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV</span>
                </button>

                <button
                  disabled={activeSlideIdx === questionsList.length - 1}
                  onClick={nextSlide}
                  className="btn-accent text-xs font-mono py-1 px-3 disabled:opacity-30"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className="panel-card p-6 sm:p-8 space-y-6">
            
            <div className="space-y-2 border-b border-[#292929] pb-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#C62828] uppercase">
                <div className="flex items-center space-x-2">
                  {currentQuestion.type === 'open_ended' ? (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>OPEN ANSWER QUESTION</span>
                    </>
                  ) : (
                    <>
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>MULTIPLE CHOICE POLL</span>
                    </>
                  )}
                </div>
                {questionsList.length > 1 && (
                  <span className="text-[#A3A3A3]">
                    Q{activeSlideIdx + 1}/{questionsList.length}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] leading-snug">
                {currentQuestion.title}
              </h1>
            </div>

            {error && (
              <div className="p-3.5 rounded bg-[#191919] border border-[#C62828] flex items-center space-x-2 text-[#F5F3EE] text-xs font-mono">
                <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Options OR Open-Ended */}
            {currentQuestion.type === 'multiple_choice' ? (
              <div className="space-y-3">
                {(currentQuestion.options || []).map((opt, idx) => {
                  const optId = String(opt.optionId || opt.optionID || opt.id || opt._id || `opt-${idx}`);
                  const optText = opt.text;
                  const optVotes = opt.votes || 0;
                  const optPct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 1000) / 10 : 0;
                  const isSelected = selectedOption === optId;
                  const isUserChoice = userVotedOptionForCurrentQ === optId;
                  const barGradient = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];

                  return (
                    <div
                      key={optId}
                      role="button"
                      tabIndex={hasVotedCurrentQ || isClosed ? -1 : 0}
                      onClick={() => handleOptionSelect(optId)}
                      className={`
                        relative overflow-hidden p-4 sm:p-5 rounded border
                        transition-all duration-200 select-none
                        ${hasVotedCurrentQ || isClosed ? 'cursor-default' : 'cursor-pointer hover:border-[#C62828] hover:bg-[#1f1f1f]'}
                        ${isSelected && !hasVotedCurrentQ && !isClosed ? 'border-[#C62828] bg-[#1f1f1f] ring-1 ring-[#C62828]' : 'border-[#292929] bg-[#141414]'}
                        ${isUserChoice ? 'border-[#C62828] bg-[#191919]' : ''}
                      `}
                    >
                      {(hasVotedCurrentQ || isClosed) && (
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-30 result-bar-fill"
                          style={{ width: `${optPct}%`, background: barGradient }}
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-between font-mono">
                        <div className="flex items-center space-x-3 pr-4">
                          {!hasVotedCurrentQ && !isClosed && (
                            <div className={`
                              w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0
                              ${isSelected ? 'border-[#C62828] bg-[#C62828]' : 'border-[#707070] bg-transparent'}
                            `}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          )}

                          {isUserChoice && <CheckCircle2 className="w-4 h-4 text-[#C62828] shrink-0" />}

                          <span className="text-sm font-bold text-[#F5F3EE]">{optText}</span>
                        </div>

                        {(hasVotedCurrentQ || isClosed) ? (
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-sm font-black text-[#F5F3EE]">{optPct}%</span>
                            <span className="block text-[10px] text-[#A3A3A3]">
                              {optVotes} {optVotes === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-xs font-bold shrink-0 transition-colors ${isSelected ? 'text-[#C62828]' : 'text-[#707070]'}`}>
                            {isSelected ? '✓ SELECTED' : 'SELECT'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!hasVotedCurrentQ && !isClosed ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleVoteSubmit}
                      disabled={!selectedOption || submitting}
                      className={`
                        w-full btn-accent font-mono text-xs uppercase tracking-wider py-4 px-6
                        ${!selectedOption || submitting ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>SUBMITTING...</span>
                        </>
                      ) : (
                        <span>{selectedOption ? '🗳️ SUBMIT VOTE' : 'SELECT AN OPTION TO VOTE'}</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 font-mono">
                    <div className="p-3.5 rounded border border-[#3A8F5B]/30 bg-[#3A8F5B]/10 text-center text-xs font-bold text-[#3A8F5B] flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#3A8F5B]" />
                      <span>YOUR VOTE HAS BEEN RECORDED!</span>
                    </div>

                    {activeSlideIdx < questionsList.length - 1 && (
                      <button
                        onClick={nextSlide}
                        className="w-full btn-accent font-mono text-xs uppercase tracking-wider py-3.5 px-6"
                      >
                        <span>CONTINUE TO QUESTION {activeSlideIdx + 2}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Open-Ended Answer Form */
              <div className="space-y-6 font-mono">
                {!isClosed && !hasSubmittedOpenResp ? (
                  <form onSubmit={handleOpenResponseSubmit} className="space-y-3">
                    <textarea
                      required
                      maxLength={300}
                      rows={3}
                      placeholder="TYPE YOUR ANSWER HERE..."
                      value={openResponseText}
                      onChange={(e) => setOpenResponseText(e.target.value)}
                      className="input-industrial"
                    />
                    <button
                      type="submit"
                      disabled={!openResponseText.trim() || submitting}
                      className="w-full btn-accent text-xs uppercase tracking-wider py-3.5 px-6 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>SUBMIT ANSWER</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded border border-[#3A8F5B]/30 bg-[#3A8F5B]/10 text-center text-xs font-bold text-[#3A8F5B] flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#3A8F5B]" />
                      <span>RESPONSE SUBMITTED TO THE STREAMING WALL!</span>
                    </div>

                    {activeSlideIdx < questionsList.length - 1 && (
                      <button
                        onClick={nextSlide}
                        className="w-full btn-accent text-xs uppercase tracking-wider py-3.5 px-6"
                      >
                        <span>CONTINUE TO QUESTION {activeSlideIdx + 2}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Live Open Responses Wall */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-[#C62828] font-bold uppercase tracking-wider block">
                    LIVE AUDIENCE RESPONSES ({(currentQuestion.responses || []).length})
                  </span>

                  {(currentQuestion.responses || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#707070] bg-[#141414] rounded border border-[#292929]">
                      NO RESPONSES YET. BE THE FIRST TO ANSWER!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {(currentQuestion.responses || []).map((resp, rIdx) => (
                        <div key={resp.id || rIdx} className="p-4 rounded bg-[#141414] border border-[#292929] space-y-1">
                          <p className="text-xs font-bold text-[#F5F3EE]">"{resp.text}"</p>
                          <span className="text-[10px] text-[#707070] block text-right font-mono">
                            {new Date(resp.createdAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Share Footer */}
            <div className="flex items-center justify-center space-x-3 pt-4 border-t border-[#292929]">
              <button
                onClick={copyPollLink}
                className="btn-secondary text-xs font-mono uppercase tracking-wider py-2 px-4"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#3A8F5B]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
              </button>
              <button
                onClick={() => setQrModalOpen(true)}
                className="btn-secondary text-xs font-mono uppercase tracking-wider py-2 px-4"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR CODE</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* Audience Q&A Tab */
        <div className="panel-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#292929] pb-4 space-y-1">
            <h2 className="text-xl font-bold text-[#F5F3EE] flex items-center space-x-2 font-mono uppercase">
              <HelpCircle className="w-5 h-5 text-[#C62828]" />
              <span>Audience Q&amp;A Thread</span>
            </h2>
            <p className="text-xs text-[#A3A3A3]">Ask questions anytime during the presentation and upvote top questions in real-time.</p>
          </div>

          {!isClosed && (
            <form onSubmit={handleQASubmit} className="bg-[#141414] p-4 rounded border border-[#292929] space-y-3 font-mono">
              <textarea
                required
                maxLength={300}
                rows={2}
                placeholder="ASK A QUESTION FOR THE HOST..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="bg-transparent text-xs text-[#F5F3EE] placeholder-[#707070] focus:outline-none w-full"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#292929]">
                <input
                  type="text"
                  placeholder="YOUR NAME (OPTIONAL)"
                  value={askedByName}
                  onChange={(e) => setAskedByName(e.target.value)}
                  className="w-full sm:w-1/2 bg-[#0B0B0B] border border-[#292929] rounded px-3 py-1.5 text-xs text-[#F5F3EE] placeholder-[#707070] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!newQuestionText.trim() || submittingQA}
                  className="w-full sm:w-auto btn-accent font-mono text-xs uppercase tracking-wider py-2 px-4 disabled:opacity-50"
                >
                  {submittingQA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>ASK QUESTION</span>
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3 font-mono">
            <span className="text-xs font-mono font-bold text-[#C62828] uppercase tracking-wider block">
              TOP QUESTIONS ({audienceQA.length})
            </span>

            {audienceQA.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#707070] bg-[#141414] rounded border border-[#292929]">
                NO AUDIENCE QUESTIONS YET. BE THE FIRST TO ASK!
              </div>
            ) : (
              [...audienceQA]
                .sort((a, b) => b.upvotes - a.upvotes)
                .map((qa) => {
                  const isUpvoted = upvotedQAIds.has(qa.id) || (qa.upvoters || []).includes(voterId);

                  return (
                    <div key={qa.id} className="p-4 rounded bg-[#141414] border border-[#292929] flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-[#F5F3EE]">"{qa.question}"</p>
                        <span className="text-[10px] text-[#A3A3A3] block">
                          Asked by <strong className="text-[#F5F3EE]">{qa.askedBy || 'Anonymous'}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => handleQAUpvote(qa.id)}
                        disabled={isUpvoted || isClosed}
                        className={`btn-secondary text-xs font-mono py-1.5 px-3 shrink-0 ${
                          isUpvoted ? 'bg-[#C62828] text-white border-[#C62828]' : ''
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-white' : ''}`} />
                        <span>{qa.upvotes || 0}</span>
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        pollUrl={window.location.href}
        question={currentQuestion?.title || poll?.question || ''}
      />

      {/* Poll Closed Popup Modal Overlay */}
      {closedModalOpen && isClosed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeInUp">
          <div className="panel-card max-w-md w-full p-6 sm:p-8 rounded border border-[#C62828]/50 text-center space-y-6 relative overflow-hidden font-mono">
            
            <div className="w-14 h-14 mx-auto rounded bg-[#C62828]/20 border border-[#C62828]/40 flex items-center justify-center text-[#FF5252]">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#C62828]/20 border border-[#C62828]/40 text-[#FF5252] text-[10px] font-bold uppercase tracking-wider">
                <span>SESSION CLOSED</span>
              </div>
              <h2 className="text-xl font-bold text-[#F5F3EE] uppercase">POLL SESSION CLOSED</h2>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                The host has closed this live poll presentation. New votes and text submissions are no longer accepted.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setClosedModalOpen(false)}
                className="w-full sm:w-auto btn-secondary text-xs uppercase tracking-wider py-2.5 px-4"
              >
                VIEW RESULTS
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto btn-accent text-xs uppercase tracking-wider py-2.5 px-4 text-center"
              >
                RETURN HOME
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PollView;
