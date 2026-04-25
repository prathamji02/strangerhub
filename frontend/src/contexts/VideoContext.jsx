/**
 * CRITICAL: THIS FILE CONTAINS THE STABLE, WORKING VIDEO CALL LOGIC.
 * DO NOT MODIFY THIS FILE UNLESS ABSOLUTELY NECESSARY.
 * ANY CHANGES HERE RISK BREAKING THE CORE VIDEO FEATURE.
 * 
 * Last Verified Stable: [Current Date]
 * Key Logic: 
 * - Immediate PeerConnection creation on offer
 * - Explicit track addition
 * - Race condition handling for local stream
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSocket } from './SocketContext';

const VideoContext = createContext();

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const { socket } = useSocket();
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    const myVideo = useRef();
    const connectionRef = useRef();
    const roomIdRef = useRef(null);
    const streamRef = useRef(null);
    const callStartTimeRef = useRef(null);
    const durationIntervalRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleChatStarted = ({ roomId }) => {
            roomIdRef.current = roomId;
            setCallEnded(false);
            setCallAccepted(false);
            setRemoteStream(null);
        };

        const handleChatEnded = () => {
            // Clean up duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
            callStartTimeRef.current = null;
            roomIdRef.current = null;
            setCallAccepted(false);
            setCallEnded(true);
            setStream(null);
            streamRef.current = null;
            setRemoteStream(null);
            if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
            }
        };

        const handleOffer = async ({ offer, roomId }) => {
            // Use received roomId if available, fallback to ref
            const currentRoomId = roomId || roomIdRef.current;

            if (!currentRoomId) {
                console.error('VideoContext: No roomId for offer');
                return;
            }

            // Ensure ref is set
            if (!roomIdRef.current) {
                roomIdRef.current = currentRoomId;
            }

            // 1. Create PeerConnection immediately to handle incoming ICE candidates
            const peerConnection = createPeerConnection(socket, currentRoomId);
            connectionRef.current = peerConnection;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // 2. Wait for local stream to be ready (max 5 seconds)
            let attempts = 0;
            while (!streamRef.current && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!streamRef.current) {
                console.error('VideoContext: Stream not ready after waiting. Proceeding without video.');
            } else {
                // 3. Add tracks to the already created PeerConnection
                streamRef.current.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, streamRef.current);
                });
            }

            // 4. Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit('answer', { roomId: currentRoomId, answer });
            setCallAccepted(true);
        };

        const handleAnswer = async ({ answer, roomId }) => {
            if (connectionRef.current) {
                await connectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallAccepted(true);
            }
        };

        const handleIceCandidate = async ({ candidate, roomId }) => {
            if (connectionRef.current) {
                try {
                    await connectionRef.current.addIceCandidate(candidate);
                } catch (e) {
                    console.error("Error adding received ice candidate", e);
                }
            }
        };

        const handleCallDuration = ({ callDurationSeconds }) => {
            // This event is sent when call naturally ends
            // The parent component will handle showing the summary modal
        };

        const handleCallWarningFinalMinute = () => {
            toast.warning('⏱️ You have 1 minute left in this call!', { duration: 5000 });
        };

        const handleForcedDisconnect = () => {
            toast.error('⏰ Call time limit reached! Disconnecting...', { duration: 3000 });
        };

        socket.on('chat_started', handleChatStarted);
        socket.on('chat_ended', handleChatEnded);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('call_duration', handleCallDuration);
        socket.on('call_warning_final_minute', handleCallWarningFinalMinute);
        socket.on('forced_disconnect', handleForcedDisconnect);

        return () => {
            socket.off('chat_started', handleChatStarted);
            socket.off('chat_ended', handleChatEnded);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('call_duration', handleCallDuration);
            socket.off('call_warning_final_minute', handleCallWarningFinalMinute);
            socket.off('forced_disconnect', handleForcedDisconnect);
        };
    }, [socket]);

    // Call duration tracking useEffect
    useEffect(() => {
        if (!callAccepted || !socket || !roomIdRef.current) return;

        // Set call start time if not already set
        if (!callStartTimeRef.current) {
            callStartTimeRef.current = Date.now();
        }

        // Emit call duration every 30 seconds
        const interval = setInterval(() => {
            const currentDurationSeconds = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
            socket.emit('call_duration_update', {
                roomId: roomIdRef.current,
                currentDurationSeconds
            });
        }, 30000); // Every 30 seconds

        durationIntervalRef.current = interval;

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [callAccepted, socket]);

    const createPeerConnection = (currentSocket, roomId) => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                currentSocket.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.oniceconnectionstatechange = () => {
        };

        return peerConnection;
    };

    const startVideo = async () => {
        try {
            
            // Simple approach - just ask for video and audio without constraints
            // This works better on mobile and HTTP connections
            const currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            
            setStream(currentStream);
            streamRef.current = currentStream;
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            toast.success('✅ Camera and microphone access granted!');
        } catch (err) {
            console.error("Error accessing media devices:", err);
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                toast.error('❌ Permission Denied - Check Android Settings > Apps > Chrome > Permissions');
            } else if (err.name === 'NotFoundError') {
                toast.error('❌ No camera or microphone found on this device.');
            } else if (err.name === 'NotReadableError') {
                toast.error('❌ Camera or microphone is already in use by another app.');
            } else if (err.name === 'SecurityError') {
                toast.error('❌ Security error - Try using HTTPS or check site permissions');
            } else {
                toast.error('❌ Could not access camera/microphone: ' + err.name + ' - ' + err.message);
            }
            
            throw err;
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setStream(null);
            streamRef.current = null;
        }
    };

    const requestPermissions = async () => {
        // Clear error state first
        // Small delay to ensure browser is ready for permission prompt
        await new Promise(resolve => setTimeout(resolve, 500));
        return startVideo();
    };

    const initiateCall = async (roomId) => {
        if (!socket) return;
        const peerConnection = createPeerConnection(socket, roomId);
        connectionRef.current = peerConnection;

        // Add tracks explicitly
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, streamRef.current);
            });
        }

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', { roomId, offer });
    };

    const value = React.useMemo(() => ({
        stream,
        remoteStream,
        myVideo,
        callAccepted,
        callEnded,
        startVideo,
        stopVideo,
        requestPermissions,
        initiateCall,
        connectionRef
    }), [stream, remoteStream, callAccepted, callEnded, socket]);


    return (
        <VideoContext.Provider value={value}>
            {children}
        </VideoContext.Provider>
    );
};
