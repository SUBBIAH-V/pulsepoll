import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { pollService } from '../services/pollService';
import { soundFx } from '../utils/soundFx';
import { QRCodeModal } from '../components/QRCodeModal';
import { useToast } from '../components/Toast';
import { Plus, Trash2, ArrowLeft, ArrowRight, Copy, Check, QrCode, Layers, ListFilter, MessageSquare } from 'lucide-react';

export const CreatePoll = () => {
  const { showToast } = useToast();
  const [slides, setSlides] = useState([
    { title: '', type: 'multiple_choice', options: ['', ''] }
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [expirationMinutes, setExpirationMinutes] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdPoll, setCreatedPoll] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const navigate = useNavigate();

  const addSlide = () => {
    if (slides.length >= 10) return;
    soundFx.playClick();
    const newSlide = { title: '', type: 'multiple_choice', options: ['', ''] };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);
  };

  const removeSlide = (index) => {
    if (slides.length <= 1) return;
    soundFx.playClick();
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    if (activeSlideIdx >= updated.length) {
      setActiveSlideIdx(updated.length - 1);
    }
  };

  const updateSlideTitle = (title) => {
    const updated = [...slides];
    updated[activeSlideIdx].title = title;
    setSlides(updated);
  };

  const updateSlideType = (type) => {
    soundFx.playClick();
    const updated = [...slides];
    updated[activeSlideIdx].type = type;
    if (type === 'multiple_choice' && updated[activeSlideIdx].options.length < 2) {
      updated[activeSlideIdx].options = ['', ''];
    }
    setSlides(updated);
  };

  const handleOptionChange = (optIdx, val) => {
    const updated = [...slides];
    updated[activeSlideIdx].options[optIdx] = val;
    setSlides(updated);
  };

  const addOption = () => {
    const currentOpts = slides[activeSlideIdx].options;
    if (currentOpts.length < 10) {
      soundFx.playClick();
      const updated = [...slides];
      updated[activeSlideIdx].options.push('');
      setSlides(updated);
    }
  };

  const removeOption = (optIdx) => {
    const currentOpts = slides[activeSlideIdx].options;
    if (currentOpts.length > 2) {
      soundFx.playClick();
      const updated = [...slides];
      updated[activeSlideIdx].options = currentOpts.filter((_, i) => i !== optIdx);
      setSlides(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (!s.title.trim()) {
        setError(`Question is required for Slide #${i + 1}`);
        setActiveSlideIdx(i);
        return;
      }

      if (s.type === 'multiple_choice') {
        const cleanOpts = s.options.map((o) => o.trim()).filter((o) => o !== '');
        if (cleanOpts.length < 2) {
          setError(`Slide #${i + 1} requires at least 2 options.`);
          setActiveSlideIdx(i);
          return;
        }

        const uniqueOpts = new Set(cleanOpts.map((o) => o.toLowerCase()));
        if (uniqueOpts.size !== cleanOpts.length) {
          setError(`Duplicate options found on Slide #${i + 1}.`);
          setActiveSlideIdx(i);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const formattedQuestions = slides.map((s) => ({
        title: s.title.trim(),
        type: s.type,
        options: s.type === 'multiple_choice' ? s.options.map((o) => o.trim()).filter((o) => o !== '') : [],
      }));

      const res = await pollService.createPollWithSlides(formattedQuestions, parseInt(expirationMinutes, 10));
      if (res.success && res.data) {
        soundFx.playSuccess();
        setCreatedPoll(res.data);
        showToast('✓ Poll created successfully');
      } else {
        setError(res.message || 'Failed to create poll presentation');
      }
    } catch (err) {
      setError(err.message || 'Failed to create poll presentation');
    } finally {
      setLoading(false);
    }
  };

  const getPollId = (poll) => {
    if (!poll) return '';
    if (typeof poll.id === 'string') return poll.id;
    if (typeof poll.pollId === 'string') return poll.pollId;
    if (typeof poll._id === 'string') return poll._id;
    return String(poll.id || poll._id || poll.pollId || '');
  };

  const pollIdStr = getPollId(createdPoll);
  const pollUrl = pollIdStr ? `${window.location.origin}/poll/${pollIdStr}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    showToast('✓ Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSlide = slides[activeSlideIdx] || slides[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-4">
        <Link
          to="/dashboard"
          className="font-mono text-xs text-[#A3A3A3] hover:text-[#F5F3EE] uppercase flex items-center space-x-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DASHBOARD</span>
        </Link>
        <span className="font-mono text-xs text-[#C62828]">CREATE / 01</span>
      </div>

      {/* Success View */}
      {createdPoll ? (
        <div className="panel-card p-8 space-y-6 text-center">
          <div className="font-mono text-xs text-[#3A8F5B] uppercase">✓ POLL CREATED</div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#F5F3EE]">POLL IS READY TO LAUNCH</h2>
            <p className="text-xs text-[#A3A3A3]">
              Share the URL or QR code with your audience to begin receiving live responses.
            </p>
          </div>

          {/* Share Link */}
          <div className="flex items-center bg-[#141414] border border-[#292929] rounded p-1.5">
            <input
              type="text"
              readOnly
              value={pollUrl}
              className="flex-1 bg-transparent px-3 font-mono text-xs text-[#F5F3EE] focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="btn-primary font-mono text-xs uppercase tracking-wider py-2 px-4"
            >
              {copied ? '✓ COPIED' : 'COPY LINK'}
            </button>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setQrModalOpen(true)}
              className="btn-secondary font-mono text-xs uppercase tracking-wider py-3 px-6 w-full sm:w-auto"
            >
              <QrCode className="w-4 h-4 text-[#E8E1D3]" />
              <span>QR CODE</span>
            </button>

            <Link
              to={`/poll/${pollIdStr}`}
              className="btn-primary font-mono text-xs uppercase tracking-wider py-3 px-6 w-full sm:w-auto"
            >
              <span>LAUNCH PRESENTATION →</span>
            </Link>
          </div>

          <QRCodeModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            pollUrl={pollUrl}
            question={createdPoll.question || slides[0].title}
          />
        </div>
      ) : (
        /* Slide Creator Form */
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#F5F3EE] uppercase tracking-tight">
              ASK YOUR <span className="text-[#E8E1D3]">QUESTION.</span>
            </h1>
            <p className="text-xs text-[#A3A3A3]">
              Build your interactive poll slide deck. Audience members vote in real-time.
            </p>
          </div>

          {/* Slide Switcher Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 font-mono text-xs">
            {slides.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { soundFx.playClick(); setActiveSlideIdx(idx); }}
                className={`px-3 py-2 rounded border uppercase transition-colors shrink-0 ${
                  activeSlideIdx === idx
                    ? 'bg-[#191919] border-[#E8E1D3] text-[#F5F3EE] font-bold'
                    : 'bg-[#141414] border-[#292929] text-[#707070] hover:text-[#A3A3A3]'
                }`}
              >
                SLIDE 0{idx + 1}
              </button>
            ))}

            {slides.length < 10 && (
              <button
                type="button"
                onClick={addSlide}
                className="px-3 py-2 rounded border border-dashed border-[#292929] text-[#A3A3A3] hover:text-[#F5F3EE] shrink-0"
              >
                + ADD SLIDE
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="panel-card p-6 sm:p-8 space-y-8">
            
            <div className="flex items-center justify-between border-b border-[#292929] pb-4">
              <span className="font-mono text-xs text-[#707070] uppercase">
                QUESTION / 0{activeSlideIdx + 1}
              </span>

              {/* Type selector */}
              <div className="flex items-center space-x-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => updateSlideType('multiple_choice')}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    currentSlide.type === 'multiple_choice'
                      ? 'bg-[#F5F3EE] text-[#0B0B0B] border-[#F5F3EE] font-bold'
                      : 'bg-[#141414] text-[#A3A3A3] border-[#292929]'
                  }`}
                >
                  MULTIPLE CHOICE
                </button>

                <button
                  type="button"
                  onClick={() => updateSlideType('open_ended')}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    currentSlide.type === 'open_ended'
                      ? 'bg-[#F5F3EE] text-[#0B0B0B] border-[#F5F3EE] font-bold'
                      : 'bg-[#141414] text-[#A3A3A3] border-[#292929]'
                  }`}
                >
                  OPEN ANSWER
                </button>
              </div>
            </div>

            {/* Question Textarea/Input */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-[#A3A3A3] uppercase block">
                QUESTION TITLE *
              </label>
              <input
                type="text"
                required
                maxLength={300}
                placeholder="What is your favorite programming language?"
                value={currentSlide.title}
                onChange={(e) => updateSlideTitle(e.target.value)}
                className="input-industrial font-sans text-base sm:text-lg font-bold py-3"
              />
              {error && (
                <p className="text-xs text-[#C62828] font-mono pt-1">
                  {error}
                </p>
              )}
            </div>

            {/* Options Input List */}
            {currentSlide.type === 'multiple_choice' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono text-xs text-[#A3A3A3] uppercase">
                  <span>OPTIONS</span>
                  <span>{currentSlide.options.length}/10 MAX</span>
                </div>

                {currentSlide.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center space-x-3 font-mono">
                    <span className="text-xs text-[#707070] w-6">0{oIdx + 1}</span>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder={`Option 0${oIdx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                      className="input-industrial text-xs"
                    />
                    {currentSlide.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(oIdx)}
                        className="p-2 text-[#707070] hover:text-[#C62828]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {currentSlide.options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="font-mono text-xs text-[#A3A3A3] hover:text-[#F5F3EE] pt-2 flex items-center space-x-1"
                  >
                    <span>+ ADD OPTION</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded bg-[#141414] border border-[#292929] font-mono text-xs text-[#A3A3A3]">
                💬 Open-ended responses will stream live onto your presentation dashboard.
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-[#292929] flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary font-mono text-xs uppercase tracking-wider py-4 px-8 w-full sm:w-auto"
              >
                {loading ? 'LAUNCHING...' : 'LAUNCH POLL →'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};

export default CreatePoll;
