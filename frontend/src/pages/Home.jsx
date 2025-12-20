import React from 'react';
import { useSocket } from '../contexts/SocketContext';

const Home = ({ onFindMatch, onLogout, isAdmin, onNavigate, onShowActivity }) => {
    const { onlineCount } = useSocket();

    return (
        <div className="relative h-dvh w-full overflow-hidden bg-gray-900 text-white font-sans selection:bg-pink-500 selection:text-white">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col p-6">

                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-sm font-medium text-gray-300 tracking-wide">{onlineCount} Online</span>
                    </div>
                    <div className="flex gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => onNavigate('admin')}
                                className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                                title="Admin Panel"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate('saved_chats')}
                            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all text-sm font-medium text-white"
                            title="Saved Chats"
                        >
                            Saved Chats
                        </button>
                        <button
                            onClick={onShowActivity}
                            className="p-2 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all"
                            title="Activity Graph"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col justify-center items-center gap-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">
                            IPU Friendlist
                        </h1>
                        <p className="text-gray-400 text-lg font-light tracking-wide">
                            Connect. Chat. Vibe.
                        </p>
                    </div>

                    {/* Action Cards */}
                    <div className="w-full max-w-md flex flex-col gap-4">
                        {/* Chat Only */}
                        <button
                            onClick={() => onFindMatch('chat')}
                            className="group relative w-full p-4 rounded-2xl bg-gray-800/40 backdrop-blur-xl border border-white/5 hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Chat Only</h3>
                                    <p className="text-sm text-gray-400">Text with strangers anonymously</p>
                                </div>
                                <div className="ml-auto text-gray-500 group-hover:text-blue-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </button>

                        {/* Video Only */}
                        <button
                            onClick={() => onFindMatch('video')}
                            className="group relative w-full p-4 rounded-2xl bg-gray-800/40 backdrop-blur-xl border border-white/5 hover:border-pink-500/50 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">Video Only</h3>
                                    <p className="text-sm text-gray-400">Face-to-face conversations</p>
                                </div>
                                <div className="ml-auto text-gray-500 group-hover:text-pink-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </button>

                        {/* Both */}
                        <button
                            onClick={() => onFindMatch('both')}
                            className="group relative w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden shadow-lg"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Both</h3>
                                    <p className="text-sm text-gray-400">Match with anyone available</p>
                                </div>
                                <div className="ml-auto text-gray-500 group-hover:text-purple-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        &copy; 2025 IPU Friendlist. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Home;
