import React from 'react';

export const LiveIndicator = ({ status = 'LIVE', isRealtime = true, className = '' }) => {
  const isLive = status === 'LIVE' || status === 'active';
  const isEnded = status === 'ENDED' || status === 'closed' || status === 'inactive';

  return (
    <div className={`inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase ${className}`}>
      {isLive && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C62828] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C62828]"></span>
          </span>
          <span className="text-[#C62828] font-bold">● LIVE</span>
          {isRealtime && <span className="text-[#707070]">/ REALTIME</span>}
        </>
      )}

      {isEnded && (
        <>
          <span className="text-[#707070] font-bold">— ENDED</span>
        </>
      )}

      {!isLive && !isEnded && (
        <>
          <span className="h-2 w-2 rounded-full bg-[#707070]"></span>
          <span className="text-[#A3A3A3] font-medium">○ DRAFT</span>
        </>
      )}
    </div>
  );
};

export default LiveIndicator;
