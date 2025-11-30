import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://192.168.0.197:3000/api';
const SOCKET_URL = 'http://192.168.0.197:3000';

export const api = axios.create({ baseURL: API_URL });

export function useAppState() {
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [otp, setOtp] = useState('');
  const [fakeName, setFakeName] = useState('');
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('loading'); // Start in a loading state
  const [message, setMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isPersistentChat, setIsPersistentChat] = useState(false);
  const [connectRequestSent, setConnectRequestSent] = useState(false);
  const [connectRequestReceived, setConnectRequestReceived] = useState(false);
  const [lastPartnerId, setLastPartnerId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [lastChatHistory, setLastChatHistory] = useState([]);
  const [loginUserInfo, setLoginUserInfo] = useState(null); // To store user name and email for OTP screen
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- NEW LOGIC FOR SESSION PERSISTENCE ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserId(data.id);
          setIsAdmin(data.isAdmin);
          connectSocket(token);
          if (data.fake_name) {
            setView('home');
          } else {
            setView('setup');
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          setView('login');
        }
      } else {
        setView('login');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const resetChatState = () => {
    setChatMessages([]);
    setCurrentMessage('');
    setPartnerInfo(null);
    setRoomId(null);
    setIsPersistentChat(false);
    setConnectRequestSent(false);
    setConnectRequestReceived(false);
    setLastChatHistory([]);
  };

  const setupSocketListeners = (socket) => {
    socket.on('update_online_count', setOnlineCount);
    socket.on('chat_started', ({ roomId, partner }) => {
      setRoomId(roomId);
      setPartnerInfo(partner);
      setIsPersistentChat(false);
      setView('in_chat');
    });
    socket.on('new_message', (message) => {
      const messageData = { text: message, sender: 'partner' };
      setChatMessages((prev) => [...prev, messageData]);
      if(!isPersistentChat) {
        setLastChatHistory((prev) => [...prev, messageData]);
      }
    });
    socket.on('chat_ended', ({ partnerId }) => {
      const historyToSave = [...lastChatHistory];
      setMessage('Your chat has ended.');
      resetChatState();
      if (partnerId) {
        setLastPartnerId(partnerId);
        setLastChatHistory(historyToSave);
        setView('rate_chat');
      } else {
        setView('home');
      }
    });
    socket.on('receive_connect_request', () => setConnectRequestReceived(true));
    socket.on('connect_success', (successMessage) => {
      alert(successMessage);
      setConnectRequestSent(false);
      setConnectRequestReceived(false);
    });
  };

  const connectSocket = (token) => {
      if (socketRef.current) socketRef.current.disconnect();
      const newSocket = io(SOCKET_URL, { auth: { token } });
      setupSocketListeners(newSocket);
      socketRef.current = newSocket;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Sending OTP...');
    try {
      const { data } = await api.post('/auth/login', { enrollment_no: enrollmentNo });
      setLoginUserInfo(data.user);
      setMessage(data.message);
      setView('otp');
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('Verifying...');
    try {
      const { data } = await api.post('/auth/verify', { enrollment_no: enrollmentNo, otp });
      const token = data.token;
      localStorage.setItem('authToken', token);
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserId(decodedToken.userId);
      setIsAdmin(data.user.isAdmin);
      connectSocket(token);
      
      if (data.user.fake_name) {
        setView('home');
      } else {
        setView('setup');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred.');
    }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('authToken');
      if(socketRef.current) socketRef.current.disconnect();
      setUserId(null);
      setIsAdmin(false);
      setView('login');
      setMessage('');
      setEnrollmentNo('');
      setOtp('');
  };

  const openPersistentChat = async (chatId, partnerName) => {
    const token = localStorage.getItem('authToken');
    try {
        const { data } = await api.get(`/chats/${chatId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const formattedMessages = data.map(msg => ({
            text: msg.content,
            sender: msg.sender_id === userId ? 'me' : 'partner'
        }));
        setChatMessages(formattedMessages);
        setRoomId(chatId);
        setPartnerInfo({ fake_name: partnerName });
        setIsPersistentChat(true);
        socketRef.current.emit('join_persistent_room', chatId);
        setView('in_chat');
    } catch (error) {
        alert('Could not open chat.');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setMessage('Saving...');
    try {
      const token = localStorage.getItem('authToken');
      await api.post('/auth/setup-profile', { fake_name: fakeName }, { headers: { Authorization: `Bearer ${token}` } });
      setView('home');
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred.');
    }
  };

  const findChat = () => {
    setLastChatHistory([]);
    socketRef.current.emit('find_chat', userId);
    setView('waiting');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      const messageData = { text: currentMessage, sender: 'me' };
      socketRef.current.emit('send_message', { 
        roomId, 
        message: currentMessage,
        persistent: isPersistentChat 
      });
      setChatMessages((prev) => [...prev, messageData]);
      if(!isPersistentChat) {
        setLastChatHistory((prev) => [...prev, messageData]);
      }
      setCurrentMessage('');
    }
  };

  const handleSkip = () => {
    if (isPersistentChat) {
      resetChatState();
      setView('home');
    } else {
      socketRef.current.emit('leave_chat', roomId);
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (lastPartnerId && (rating > 0 || review.trim() !== '')) {
        try {
            const token = localStorage.getItem('authToken');
            await api.post('/ratings', 
                { score: rating > 0 ? rating : null, rateeId: lastPartnerId, review: review },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Failed to submit rating", error);
        }
    }
    setRating(0);
    setReview('');
    setLastPartnerId(null);
    setLastChatHistory([]);
    setView('home');
  };
  
  const handleBlock = async () => {
    if (!lastPartnerId) {
        setView('home');
        return;
    }
    try {
        const token = localStorage.getItem('authToken');
        await api.post('/users/block', 
            { blockedId: lastPartnerId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage('User has been blocked.');
    } catch (error) {
        setMessage('Failed to block user.');
    } finally {
        setRating(0);
        setReview('');
        setLastPartnerId(null);
        setLastChatHistory([]);
        setView('home');
    }
  };
  
  const handleReport = async () => {
    if (!lastPartnerId) {
      setView('home');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      const formattedHistory = lastChatHistory.map(msg => ({ sender: msg.sender, text: msg.text }));
      await api.post('/reports', 
        { reportedId: lastPartnerId, chatHistory: formattedHistory, reason: review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Report has been submitted for review.');
    } catch (error) {
      setMessage('Failed to submit report.');
    } finally {
      setRating(0);
      setReview('');
      setLastPartnerId(null);
      setLastChatHistory([]);
      setView('home');
    }
  };

  const handleConnect = () => {
    socketRef.current.emit('send_connect_request', roomId);
    setConnectRequestSent(true);
  };

  const handleAcceptConnect = () => {
    socketRef.current.emit('accept_connect_request', roomId);
  };

  return {
    enrollmentNo, setEnrollmentNo,
    otp, setOtp,
    fakeName, setFakeName,
    userId,
    isAdmin,
    view, setView,
    message, setMessage,
    onlineCount,
    chatMessages,
    currentMessage, setCurrentMessage,
    partnerInfo,
    roomId,
    isPersistentChat,
    connectRequestSent,
    connectRequestReceived,
    lastPartnerId,
    rating, setRating,
    review, setReview,
    lastChatHistory,
    loginUserInfo,
    chatEndRef,
    handleLogin,
    handleVerify,
    handleLogout,
    openPersistentChat,
    handleSetup,
    findChat,
    handleSendMessage,
    handleSkip,
    handleRateSubmit,
    handleBlock,
    handleReport,
    handleConnect,
    handleAcceptConnect
  };
}

