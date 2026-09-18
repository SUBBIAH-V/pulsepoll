import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-[#292929] bg-[#0B0B0B] py-8 mt-auto font-mono text-xs text-[#707070]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-[#C62828] font-bold">●</span>
          <span className="font-extrabold text-[#F5F3EE] uppercase tracking-wider">
            PULSE<span className="text-[#707070] font-normal">POLL</span>
          </span>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-center sm:text-right">
          &copy; {new Date().getFullYear()} PULSEPOLL — ULTRA FAST REALTIME LIVE POLLING
        </p>
      </div>
    </footer>
  );
};

export default Footer;
