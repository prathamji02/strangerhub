import React from 'react';

function WaitingScreen({ onlineCount, setView }) {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <button onClick={() => setView('home')} className="absolute top-4 left-4 text-blue-400 hover:underline">&larr; Back to Home</button>
      <h1 className="text-3xl font-bold mb-4 animate-pulse">Waiting for another user...</h1>
      <p className="text-gray-400">Online Users: {onlineCount}</p>
    </div>
  );
}

export default WaitingScreen;