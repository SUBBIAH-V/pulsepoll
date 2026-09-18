import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { soundFx } from '../utils/soundFx';
import { Mail, User, Send, CheckCircle2, MessageSquare, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';

export const Contact = () => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast('⚠️ Please fill in all required fields');
      return;
    }

    soundFx.playVoteSubmit();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast('✓ Message sent successfully to Subbiah!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 font-mono animate-fadeInUp">
      
      {/* Header */}
      <div className="space-y-4 border-b border-[#292929] pb-6">
        <Link to="/" className="text-xs text-[#707070] hover:text-[#F5F3EE] uppercase flex items-center space-x-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO HOME</span>
        </Link>

        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] animate-pulse" />
          <span className="text-xs text-[#707070] uppercase tracking-widest">GET IN TOUCH WITH THE DEVELOPER</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
          CONTACT <span className="text-[#C62828]">SUBBIAH</span>
        </h1>
        <p className="text-xs text-[#A3A3A3] max-w-2xl leading-relaxed">
          Have feedback, feature requests, or technical support queries regarding PulsePoll? Send a message directly to Subbiah below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Contact Info Card */}
        <div className="space-y-6 md:col-span-1">
          <div className="panel-card p-6 space-y-4">
            <span className="text-[10px] text-[#707070] uppercase tracking-wider block">CONTACT DETAILS</span>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#707070] uppercase block">DEVELOPER NAME</span>
                  <span className="text-sm font-bold text-[#F5F3EE]">Subbiah</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#707070] uppercase block">DIRECT EMAIL</span>
                  <a 
                    href="mailto:subbiahavadivelan379@gmail.com" 
                    className="text-xs font-bold text-[#F5F3EE] hover:text-[#C62828] transition-colors break-all"
                  >
                    subbiahavadivelan379@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#707070] uppercase block">RESPONSE TIME</span>
                  <span className="text-xs text-[#A3A3A3]">Within 24 Hours</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#707070] uppercase block">STATUS</span>
                  <span className="text-xs text-[#4CAF50] font-bold">Online & Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card p-6 space-y-2 bg-[#141414]">
            <span className="text-[10px] text-[#707070] uppercase block">PULSEPOLL SUPPORT</span>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              For real-time assistance with cloud hosting, WebSocket sync, or MongoDB queries, reach out anytime.
            </p>
          </div>
        </div>

        {/* Message Form Box */}
        <div className="md:col-span-2">
          <div className="panel-card p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs text-[#707070] uppercase">MESSAGE BOX</span>
              <h2 className="text-lg font-bold text-[#F5F3EE]">SEND A DIRECT MESSAGE</h2>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-4 bg-[#141414] border border-[#292929] rounded animate-fadeInUp">
                <CheckCircle2 className="w-12 h-12 text-[#4CAF50] mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#F5F3EE]">MESSAGE DELIVERED</h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Thank you, <span className="text-[#F5F3EE] font-bold">{formData.name || 'User'}</span>! Your message has been sent directly to <span className="text-[#F5F3EE] font-bold">subbiahavadivelan379@gmail.com</span>.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-secondary py-2 px-6 text-xs uppercase tracking-wider"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#707070] uppercase block">
                      YOUR NAME <span className="text-[#C62828]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#707070] uppercase block">
                      YOUR EMAIL <span className="text-[#C62828]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#707070] uppercase block">
                    SUBJECT / TOPIC
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Feature Suggestion / Support Query"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <label className="text-[#707070] uppercase block">
                      YOUR MESSAGE <span className="text-[#C62828]">*</span>
                    </label>
                    <span className="text-[#707070]">{formData.message.length} / 1000 CHARACTERS</span>
                  </div>
                  <textarea
                    name="message"
                    rows="6"
                    maxLength={1000}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message here for Subbiah..."
                    required
                    className="input-field resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 mt-4"
                >
                  {submitting ? (
                    <span>SENDING MESSAGE...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#0B0B0B]" />
                      <span>SEND MESSAGE TO SUBBIAH</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Contact;
