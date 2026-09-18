import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

export const QRCodeModal = ({ isOpen, onClose, pollUrl, question }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const pollCode = pollUrl ? pollUrl.split('/poll/')[1] || 'LIVE' : 'LIVE';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopiedLink(true);
    showToast('✓ Link copied');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pollCode);
    setCopiedCode(true);
    showToast('✓ Poll code copied');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0B]/85 backdrop-blur-md animate-fadeIn">
      <div className="panel-card p-6 sm:p-8 max-w-sm w-full space-y-6 relative border border-[#292929]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#707070] hover:text-[#F5F3EE]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 text-center font-mono">
          <span className="text-xs text-[#C62828] uppercase">PULSEPOLL / QR</span>
          <h3 className="text-xl font-extrabold text-[#F5F3EE] uppercase tracking-wider">
            SCAN TO VOTE
          </h3>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center bg-[#FFFFFF] p-4 rounded border border-[#292929]">
          <QRCodeSVG value={pollUrl} size={180} level="H" includeMargin={true} />
        </div>

        {/* Poll Code Metadata */}
        <div className="p-3 bg-[#141414] border border-[#292929] rounded text-center font-mono space-y-1">
          <span className="text-[10px] text-[#707070] uppercase block">POLL CODE</span>
          <span className="text-base font-extrabold text-[#F5F3EE] tracking-widest">{pollCode}</span>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <button
            onClick={handleCopyCode}
            className="btn-secondary py-2.5 uppercase tracking-wider"
          >
            {copiedCode ? '✓ COPIED' : 'COPY CODE'}
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-primary py-2.5 uppercase tracking-wider"
          >
            {copiedLink ? '✓ COPIED' : 'COPY LINK'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-ghost font-mono text-xs uppercase tracking-wider py-2 text-[#707070]"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
