import React, { useState, useEffect, useMemo } from 'react';
import { Analytics } from "@vercel/analytics/react";
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { VideoProvider, useVideo } from './contexts/VideoContext';
import Home from './pages/Home';
import VideoCall from './components/VideoCall';
import TextChat from './components/TextChat';
import { LoginScreen, OtpScreen, SetupScreen, Spinner } from './components/AuthScreens';
import AdminDashboard from './components/AdminDashboard';
import LandingScreen from './components/LandingScreen';
import ResizableLayout from './components/ResizableLayout';
import SavedChatsScreen from './components/SavedChatsScreen';
import ActivityGraphModal from './components/ActivityGraphModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL });

const ResponsiveLayout = ({ left, center, right }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <ResizableLayout
            left={left}
            center={center}
            right={right}
            orientation={isMobile ? 'vertical' : 'horizontal'}
        />
    );
};

function AppContent() {
    const [view, setView] = useState('landing');
    const [enrollmentNo, setEnrollmentNo] = useState('');
    const [otp, setOtp] = useState('');
    const [fakeName, setFakeName] = useState('');
    const [college, setCollege] = useState('');
    const [loginUserInfo, setLoginUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Chat State
    const [roomId, setRoomId] = useState(null);
    const [matchMode, setMatchMode] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [shouldInitiate, setShouldInitiate] = useState(false);

    // Saved Chats State
    const [viewingChatId, setViewingChatId] = useState(null);

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingReview, setRatingReview] = useState('');
    const [ratingPartnerId, setRatingPartnerId] = useState(null);
    const [ratingPartnerName, setRatingPartnerName] = useState('');
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
    const [showActivityGraph, setShowActivityGraph] = useState(false);

    const { socket } = useSocket();
    const videoContext = useVideo();
    const { stream, remoteStream, callAccepted, callEnded, startVideo, stopVideo, initiateCall } = videoContext || {};

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const { data } = await api.get('/auth/me');
                    if (data.status === 'FROZEN') {
                        setView('frozen');
                        return;
                    }
                    setIsAdmin(data.isAdmin);
                    setLoginUserInfo(data);
                    if (data.fake_name) {
                        setView('home');
                    } else {
                        setView('setup');
                    }
                } catch (error) {
                    localStorage.removeItem('authToken');
                    setView('landing');
                }
            } else {
                setView('landing');
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Join all saved chats for real-time updates
        socket.emit('join_all_chats');

        socket.on('chat_started', ({ roomId, matchMode, partner, shouldInitiate }) => {
            setRoomId(roomId);
            setMatchMode(matchMode);
            setPartnerInfo(partner);
            setShouldInitiate(shouldInitiate);
            setChatMessages([]);
            setView('in_chat');
            toast.success(`Connected with a stranger! Mode: ${matchMode}`, { duration: 5000 });
        });

        socket.on('chat_ended', ({ partnerId }) => {
            if (roomId) {
                // Trigger rating modal for the user who didn't disconnect
                if (partnerInfo) {
                    setRatingPartnerId(partnerInfo.id);
                    setRatingPartnerName(partnerInfo.fake_name);
                    setShowRatingModal(true);
                }

                setRoomId(null);
                setPartnerInfo(null);
                stopVideo();
                setView('home');
                toast('Chat ended.', { duration: 5000 });
            }
        });

        socket.on('new_message', ({ text, roomId: msgRoomId, senderId }) => {
            const currentActiveId = roomId || viewingChatId;
            if (currentActiveId === msgRoomId) {
                setChatMessages((prev) => [...prev, { text, sender: 'partner', timestamp: new Date() }]);
            } else {
                toast(`New message from a saved chat!`, { icon: '📩', duration: 5000 });
            }
        });

        socket.on('save_chat_request', () => {
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-bold">Stranger wants to connect!</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                socket.emit('respond_save_chat', { roomId, accept: true });
                                toast.dismiss(t.id);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => {
                                socket.emit('respond_save_chat', { roomId, accept: false });
                                toast.dismiss(t.id);
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ), { duration: 10000, icon: '🔗' });
        });

        socket.on('chat_saved', ({ chatroomId }) => {
            toast.success("Connected! Chat saved in 'Saved Chats'.", { duration: 5000 });
        });

        socket.on('save_chat_declined', () => {
            toast.error("Stranger declined to connect.", { duration: 5000 });
        });

        return () => {
            socket.off('chat_started');
            socket.off('chat_ended');
            socket.off('new_message');
            socket.off('save_chat_request');
            socket.off('chat_saved');
            socket.off('save_chat_declined');
        };
    }, [socket, roomId, viewingChatId]);

    // Handle Video Initiation
    useEffect(() => {
        if (view === 'in_chat' && (matchMode === 'video' || matchMode === 'both')) {
            console.log('AppNew: Attempting to start video...', { shouldInitiate, roomId });
            startVideo().then(() => {
                console.log('AppNew: Video started. Checking initiation...', { shouldInitiate, roomId });
                if (shouldInitiate && roomId) {
                    initiateCall(roomId);
                }
            });
        }
    }, [view, matchMode, shouldInitiate, roomId]);

    const handleGetStarted = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setView('home');
        } else {
            setView('login');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const { data } = await api.post('/auth/login', { enrollment_no: enrollmentNo });
            setLoginUserInfo(data.user);
            setView('otp');
            toast.success('OTP sent!');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error');
            toast.error('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/verify', { enrollment_no: enrollmentNo, otp });
            const token = data.token;
            localStorage.setItem('authToken', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAdmin(data.user.isAdmin);
            setLoginUserInfo(data.user);

            if (data.user.fake_name) {
                setView('home');
            } else {
                setView('setup');
            }
        } catch (error) {
            setMessage('Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/setup', { fake_name: fakeName, college });
            setView('home');
        } catch (error) {
            toast.error('Failed to save alias');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChat = async () => {
        if (!socket || !roomId) return;
        socket.emit('request_save_chat', { roomId });
        toast.loading("Request sent to stranger...", { duration: 2000 });
    };

    const openPersistentChat = async (chatId, partnerInfo) => {
        try {
            const { data } = await api.get(`/chats/${chatId}/messages`);
            const formattedMessages = data.map(msg => ({
                text: msg.content,
                sender: msg.sender_id === loginUserInfo?.id ? 'me' : 'partner',
                timestamp: new Date(msg.created_at)
            }));

            setChatMessages(formattedMessages);
            setPartnerInfo(partnerInfo);
            setViewingChatId(chatId);

            if (socket) {
                socket.emit('join_chat', { roomId: chatId });
            }

            setView('view_chat');
        } catch (error) {
            toast.error("Failed to load chat.");
        }
    };

    const handleSendPersistentMessage = (text) => {
        if (socket && viewingChatId) {
            socket.emit('send_message', { roomId: viewingChatId, message: text, persistent: true });
            setChatMessages((prev) => [...prev, { text, sender: 'me', timestamp: new Date() }]);
        }
    };

    const handleFindMatch = (mode) => {
        if (socket) {
            socket.emit('find_match', { mode });
            setView('waiting');
        }
    };

    const handleSendMessage = (text) => {
        if (socket && roomId) {
            socket.emit('send_message', { roomId, message: text, persistent: false });
            setChatMessages((prev) => [...prev, { text, sender: 'me', timestamp: new Date() }]);
        }
    };

    const handleRatingSubmit = async () => {
        if (!ratingPartnerId || (ratingScore === 0 && !ratingReview.trim())) {
            setShowRatingModal(false);
            return;
        }
        setIsRatingSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            await api.post('/ratings', { rateeId: ratingPartnerId, score: ratingScore, review: ratingReview });
            toast.success("Rating submitted!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit rating.");
        } finally {
            setIsRatingSubmitting(false);
            setShowRatingModal(false);
            setRatingScore(0);
            setRatingReview('');
            setRatingPartnerId(null);
        }
    };

    const handleBlockFromRating = async () => {
        if (!ratingPartnerId) return;
        if (!window.confirm("Are you sure you want to block this user?")) return;
        try {
            const token = localStorage.getItem('authToken');
            await api.post('/users/block', { blockedId: ratingPartnerId }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("User blocked.");
            setShowRatingModal(false);
        } catch (error) {
            toast.error("Failed to block user.");
        }
    };

    const handleReportFromRating = async () => {
        if (!ratingPartnerId) return;
        const reason = prompt("Please enter a reason for reporting:");
        if (!reason) return;
        try {
            const token = localStorage.getItem('authToken');
            await api.post('/reports', { reportedId: ratingPartnerId, reason, chatHistory: [] }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Report submitted.");
        } catch (error) {
            toast.error("Failed to submit report.");
        }
    };

    const handleSkip = () => {
        // If we have a partner and it's not a saved chat view (implied by roomId existence), prepare rating
        if (roomId && partnerInfo) {
            setRatingPartnerId(partnerInfo.id);
            setRatingPartnerName(partnerInfo.fake_name);
            setShowRatingModal(true);
        }

        if (socket && roomId) {
            socket.emit('leave_chat', roomId);
        } else if (socket) {
            socket.emit('leave_chat');
            setView('home');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setView('landing');
        setIsAdmin(false);
    };

    // Memoize the video and chat sections to prevent re-renders
    const LocalVideoSection = useMemo(() => (
        <div className="w-full h-full bg-gray-900 border-r border-gray-800 relative">
            <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-white text-xs">You</div>
            <VideoCall stream={stream} isLocal={true} />
        </div>
    ), [stream]);

    const RemoteVideoSection = useMemo(() => (
        <div className="w-full h-full bg-black relative group">
            <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-white text-xs pointer-events-none">Stranger</div>
            {callAccepted && !callEnded ? (
                <VideoCall stream={remoteStream} isLocal={false} />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Waiting for video... {callAccepted ? 'Connected' : 'Not Connected'}
                </div>
            )}
        </div>
    ), [callAccepted, callEnded, remoteStream]);

    const ChatSection = useMemo(() => (
        <div className="w-full h-full bg-gray-900 border-l border-gray-800 flex flex-col">
            <TextChat
                roomId={roomId}
                partnerInfo={partnerInfo}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                onSkip={handleSkip}
                onSaveChat={handleSaveChat}
            />
        </div>
    ), [roomId, partnerInfo, chatMessages]);

    const renderView = () => {
        if (view === 'landing') return <LandingScreen onGetStarted={handleGetStarted} />;
        if (view === 'loading') return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Spinner /></div>;
        if (view === 'login') return <LoginScreen handleLogin={handleLogin} enrollmentNo={enrollmentNo} setEnrollmentNo={setEnrollmentNo} message={message} isLoading={isLoading} onNavigate={setView} />;
        if (view === 'otp') return <OtpScreen handleVerify={handleVerify} otp={otp} setOtp={setOtp} message={message} loginUserInfo={loginUserInfo} setView={setView} isLoading={isLoading} />;
        if (view === 'setup') return <SetupScreen handleSetup={handleSetup} fakeName={fakeName} setFakeName={setFakeName} college={college} setCollege={setCollege} isLoading={isLoading} />;

        if (view === 'waiting') {
            return (
                <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-4 text-xl animate-pulse">Looking for a stranger...</p>
                    <button onClick={handleSkip} className="mt-8 px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition">
                        Cancel
                    </button>
                </div>
            );
        }

        if (view === 'saved_chats') {
            return <SavedChatsScreen setView={setView} openPersistentChat={openPersistentChat} api={api} socket={socket} />;
        }

        if (view === 'view_chat') {
            return (
                <div className="h-dvh w-full bg-gray-900 flex flex-col">
                    <div className="flex-1 overflow-hidden relative">
                        <TextChat
                            roomId={viewingChatId}
                            partnerInfo={partnerInfo}
                            chatMessages={chatMessages}
                            onSendMessage={handleSendPersistentMessage}
                            onSkip={() => setView('saved_chats')}
                            isPersistentChat={true}
                            onBack={() => setView('saved_chats')}
                        />
                    </div>
                </div>
            );
        }

        if (view === 'in_chat') {
            // Chat Only Mode
            if (matchMode === 'chat') {
                return (
                    <div className="h-dvh w-full bg-gray-900 flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <TextChat
                                roomId={roomId}
                                partnerInfo={partnerInfo}
                                chatMessages={chatMessages}
                                onSendMessage={handleSendMessage}
                                onSkip={handleSkip}
                                onSaveChat={handleSaveChat}
                            />
                        </div>
                    </div>
                );
            }

            // Video / Both Mode (3-Part Layout)
            return (
                <div className="h-dvh w-full bg-black overflow-hidden">
                    <ResponsiveLayout
                        left={LocalVideoSection}
                        center={RemoteVideoSection}
                        right={ChatSection}
                    />
                </div>
            );
        }

        if (view === 'admin') {
            return <AdminDashboard onBack={() => setView('home')} />;
        }

        return <Home onFindMatch={handleFindMatch} onLogout={handleLogout} isAdmin={isAdmin} onNavigate={setView} onShowActivity={() => setShowActivityGraph(true)} />;
    };

    return (
        <>
            {renderView()}

            <ActivityGraphModal isOpen={showActivityGraph} onClose={() => setShowActivityGraph(false)} />

            {/* Global Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-white mb-2">How was your chat?</h3>
                        <p className="text-gray-400 text-sm mb-6">Rate your experience with {ratingPartnerName || 'Stranger'}</p>

                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRatingScore(star)}
                                    className={`text-3xl transition-transform hover:scale-110 ${ratingScore >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={ratingReview}
                            onChange={(e) => setRatingReview(e.target.value)}
                            placeholder="Leave a comment (optional)..."
                            className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-blue-500 mb-6 h-24 resize-none text-sm"
                        />

                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setShowRatingModal(false)}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleRatingSubmit}
                                disabled={isRatingSubmitting || (ratingScore === 0 && !ratingReview.trim())}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRatingSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>

                        <div className="flex justify-center gap-4 text-xs text-gray-500">
                            <button onClick={handleReportFromRating} className="hover:text-red-400 transition-colors flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 4.4A1 1 0 0116 14H6a3 3 0 01-3-3V6zm5.25 2.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm4.5 0a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
                                </svg>
                                Report
                            </button>
                            <button onClick={handleBlockFromRating} className="hover:text-red-400 transition-colors flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function AppNew() {
    return (
        <SocketProvider>
            <VideoProvider>
                <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
                <AppContent />
                <Analytics />
            </VideoProvider>
        </SocketProvider>
    );
}
