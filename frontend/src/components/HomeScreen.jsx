import React from 'react';

function HomeScreen({ onlineCount, findChat, message, setView, isAdmin, handleLogout }) {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="absolute top-4 right-4">
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-600 text-sm font-bold hover:bg-red-700">Logout</button>
      </div>
      <h1 className="text-5xl font-bold mb-4">Welcome to StrangerHub!</h1>
      <p className="text-gray-400 mb-8 text-lg">There are currently {onlineCount} users online.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={findChat} className="px-10 py-4 rounded-lg bg-blue-600 text-xl font-bold hover:bg-blue-700 transition-transform transform hover:scale-105">
          Find a Chat
        </button>
        <button onClick={() => setView('saved_chats')} className="px-10 py-4 rounded-lg bg-gray-600 text-xl font-bold hover:bg-gray-700 transition-transform transform hover:scale-105">
          Saved Chats
        </button>
        {isAdmin && (
          <button onClick={() => setView('admin')} className="px-10 py-4 rounded-lg bg-purple-600 text-xl font-bold hover:bg-purple-700 transition-transform transform hover:scale-105">
            Admin
          </button>
        )}
      </div>
      {message && <p className="mt-6 text-center text-sm text-green-400">{message}</p>}
    </div>
  );
}

export default HomeScreen;