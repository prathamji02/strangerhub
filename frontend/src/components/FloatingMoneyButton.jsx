import React from 'react';

const FloatingMoneyButton = ({ onClick, coins = 0, earningEnabled = true }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 p-2 rounded-full transition-all backdrop-blur-md border ${
        earningEnabled
          ? 'bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 hover:bg-green-500/30'
          : 'bg-gray-700/20 backdrop-blur-md border border-gray-700/30 text-gray-500 cursor-not-allowed opacity-60 hover:opacity-60'
      }`}
      title={earningEnabled ? 'View money & earnings' : 'Earning disabled'}
      disabled={!earningEnabled}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
};

export default FloatingMoneyButton;
