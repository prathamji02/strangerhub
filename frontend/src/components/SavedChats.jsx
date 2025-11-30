import React, { useState, useEffect } from 'react';

// NOTE: This component now takes the 'api' object as a prop
function SavedChats({ setView, openPersistentChat, api }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const { data } = await api.get('/chats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formattedChats = data.map((chat) => ({
          id: chat.id,
          partnerName: chat.participants[0]?.fake_name || 'A Stranger',
        }));
        setChats(formattedChats);
      } catch (err) {
        setError('Failed to load your chats.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [api]); // Add api to dependency array

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 pt-8">
      <div className="w-full max-w-lg mx-auto">
        <button onClick={() => setView('home')} className="mb-4 text-blue-400 hover:underline">
          &larr; Back to Home
        </button>
        <h1 className="text-4xl font-bold mb-6">Your Saved Chats</h1>
        <div className="bg-gray-800 rounded-lg shadow-lg">
          {loading && <p className="p-4 text-center text-gray-400">Loading...</p>}
          {error && <p className="p-4 text-center text-red-400">{error}</p>}
          {!loading && !error && chats.length === 0 && (
            <p className="p-4 text-center text-gray-400">You have no saved chats yet.</p>
          )}
          {!loading && !error && (
            <ul className="divide-y divide-gray-700">
              {chats.map((chat) => (
                <li key={chat.id} onClick={() => openPersistentChat(chat.id, chat.partnerName)} className="p-4 hover:bg-gray-700 cursor-pointer transition-colors">
                  Chat with <span className="font-bold text-blue-400">{chat.partnerName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedChats;