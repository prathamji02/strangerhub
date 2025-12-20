import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SavedChatsScreen({ setView, openPersistentChat, api, socket }) {
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
          partnerInfo: chat.participants[0] || { fake_name: 'A Stranger' },
        }));
        setChats(formattedChats);
      } catch (err) {
        setError('Failed to load your chats.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();

    if (socket) {
      socket.on('chat_deleted', ({ chatId }) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        toast.success('Chat deleted.');
      });
    }

    return () => {
      if (socket) socket.off('chat_deleted');
    };
  }, [api, socket]);

  const handleDelete = (e, chatId) => {
    e.stopPropagation(); // Prevent opening the chat
    if (confirm('Are you sure? This will delete the chat for BOTH users.')) {
      socket.emit('delete_chat', { chatId });
    }
  };

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
                <li key={chat.id} onClick={() => openPersistentChat(chat.id, chat.partnerInfo)} className="p-4 hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center">
                  <span>Chat with <span className="font-bold text-blue-400">{chat.partnerInfo.fake_name}</span></span>
                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="text-red-500 hover:text-red-400 p-2"
                    title="Delete for everyone"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
