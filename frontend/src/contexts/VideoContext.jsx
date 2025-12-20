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

    useEffect(() => {
        if (!socket) return;

        const handleChatStarted = ({ roomId }) => {
            console.log('VideoContext: chat_started', roomId);
            roomIdRef.current = roomId;
            setCallEnded(false);
            setCallAccepted(false);
            setRemoteStream(null);
        };

        const handleChatEnded = () => {
            console.log('VideoContext: chat_ended');
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
            console.log('VideoContext: Received offer', { roomId });
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
                console.log('VideoContext: Waiting for local stream...');
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

            console.log('VideoContext: Sending answer');
            socket.emit('answer', { roomId: currentRoomId, answer });
            setCallAccepted(true);
        };

        const handleAnswer = async ({ answer, roomId }) => {
            console.log('VideoContext: Received answer');
            if (connectionRef.current) {
                await connectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallAccepted(true);
            }
        };

        const handleIceCandidate = async ({ candidate, roomId }) => {
            console.log('VideoContext: Received ICE candidate');
            if (connectionRef.current) {
                try {
                    await connectionRef.current.addIceCandidate(candidate);
                } catch (e) {
                    console.error("Error adding received ice candidate", e);
                }
            }
        };

        socket.on('chat_started', handleChatStarted);
        socket.on('chat_ended', handleChatEnded);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        return () => {
            socket.off('chat_started', handleChatStarted);
            socket.off('chat_ended', handleChatEnded);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
        };
    }, [socket]);

    const createPeerConnection = (currentSocket, roomId) => {
        console.log('VideoContext: Creating PeerConnection');
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('VideoContext: Sending ICE candidate');
                currentSocket.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            console.log('VideoContext: Track received', event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('VideoContext: ICE State Change:', peerConnection.iceConnectionState);
        };

        return peerConnection;
    };

    const startVideo = async () => {
        console.log('VideoContext: startVideo called. Requesting permissions...');
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('VideoContext: Media access granted. Stream ID:', currentStream.id);
            setStream(currentStream);
            streamRef.current = currentStream;
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            toast.error("Could not access camera/microphone");
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setStream(null);
            streamRef.current = null;
        }
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

        console.log('VideoContext: Sending offer');
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
        initiateCall,
        connectionRef
    }), [stream, remoteStream, callAccepted, callEnded, socket]);

    console.log('VideoProvider: Providing value', value);

    return (
        <VideoContext.Provider value={value}>
            {children}
        </VideoContext.Provider>
    );
};
