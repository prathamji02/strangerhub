import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const formatTime = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TextChat = ({ roomId, partnerInfo, chatMessages, onSendMessage, onSkip, isPersistentChat, onSaveChat }) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const chatEndRef = useRef(null);
    const { socket } = useSocket();
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);

    // Safety State
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        if (!socket) return;

        const handleTyping = () => setIsPartnerTyping(true);
        const handleStopTyping = () => setIsPartnerTyping(false);

        socket.on('partner_started_typing', handleTyping);
        socket.on('partner_stopped_typing', handleStopTyping);

        return () => {
            socket.off('partner_started_typing', handleTyping);
            socket.off('partner_stopped_typing', handleStopTyping);
        };
    }, [socket]);

    const handleMessageChange = (e) => {
        setCurrentMessage(e.target.value);
        if (socket && roomId) {
            socket.emit('start_typing', { roomId });
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!currentMessage.trim()) return;
        onSendMessage(currentMessage);
        setCurrentMessage('');
        if (socket && roomId) {
            socket.emit('stop_typing', { roomId });
        }
    };

    // --- Safety Actions ---

    const handleBlock = async () => {
        if (!partnerInfo?.id) return;
        if (!window.confirm("Are you sure you want to block this user? You will immediately disconnect.")) return;

        try {
            const token = localStorage.getItem('authToken');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/users/block`,
                { blockedId: partnerInfo.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("User blocked.");
            onSkip(); // Disconnect immediately
        } catch (error) {
            console.error(error);
            toast.error("Failed to block user.");
        }
    };

    const handleReportSubmit = async () => {
        if (!partnerInfo?.id || !reportReason.trim()) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            // We send the last 50 messages as context
            const chatHistory = JSON.stringify(chatMessages.slice(-50));

            await axios.post(`${import.meta.env.VITE_API_URL}/api/reports`,
                { reportedId: partnerInfo.id, reason: reportReason, chatHistory },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Report submitted. Thank you for keeping the community safe.");
            setShowReportModal(false);
            setReportReason('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {partnerInfo?.fake_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white leading-tight">
                                {partnerInfo?.fake_name || 'Stranger'}
                            </h2>
                            {partnerInfo && (
                                <span className="text-sm font-normal text-yellow-400 flex items-center gap-0.5 bg-white/10 px-2 py-0.5 rounded-full">
                                    <span>★</span> {partnerInfo.averageRating?.toFixed(1) || 'New'} <span className="text-gray-400 text-xs">({partnerInfo.ratingCount || 0})</span>
                                </span>
                            )}
                        </div>
                        {partnerInfo && (
                            <p className="text-xs text-gray-400">
                                {partnerInfo.gender ? (partnerInfo.gender.charAt(0).toUpperCase() + partnerInfo.gender.slice(1)) : 'Unknown'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPersistentChat && onSaveChat && (
                        <button
                            onClick={onSaveChat}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold rounded-full hover:bg-green-500/30 transition-all"
                        >
                            Connect
                        </button>
                    )}

                    {/* Menu Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                                <button
                                    onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    Report User
                                </button>
                                <button
                                    onClick={() => { handleBlock(); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Block User
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 relative" onClick={() => setShowMenu(false)}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] p-3 px-4 rounded-2xl shadow-md backdrop-blur-sm 
                            ${msg.sender === 'me'
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-none'
                                    : 'bg-white/10 border border-white/5 text-gray-100 rounded-bl-none'}`}
                        >
                            <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                            <span className={`text-[10px] block text-right mt-1 ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-400'}`}>
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Typing Indicator */}
            <div className="px-4 py-2 text-xs text-blue-400 italic bg-white/5 min-h-[32px] flex items-center">
                {isPartnerTyping && (
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                        <span className="ml-2">Typing...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={handleMessageChange}
                        placeholder="Type a message..."
                        className="flex-grow p-3 px-5 rounded-full bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-transform transform hover:scale-105 shadow-lg shadow-blue-500/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
                <button
                    onClick={onSkip}
                    className={`w-full p-3 rounded-xl font-bold transition-all shadow-lg 
                    ${isPersistentChat
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'}`}
                >
                    {isPersistentChat ? 'Leave Chat' : 'Skip / Next'}
                </button>
            </div>

            {/* --- MODALS --- */}

            {/* Report Modal */}
            {showReportModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Report User</h3>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Why are you reporting this user?"
                            className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-red-500 mb-4 h-32 resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReportSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sending...' : 'Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextChat;
