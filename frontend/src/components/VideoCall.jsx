import React, { useEffect, useRef } from 'react';

const VideoCall = ({ stream, isLocal }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (videoRef.current && stream) {
            // Prevent re-setting the same stream to avoid AbortError
            if (videoRef.current.srcObject && videoRef.current.srcObject.id === stream.id) {
                console.log('VideoCall: Stream already set, skipping');
                return;
            }

            console.log('VideoCall: Setting srcObject', stream.id);
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error('VideoCall: Play failed', e));
        } else {
            console.log('VideoCall: No stream or ref');
        }
    }, [stream]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
            {stream ? (
                <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted={isLocal} // Mute local video to prevent feedback
                    className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} // Mirror local video
                />
            ) : (
                <div className="text-gray-500 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" />
                    </svg>
                    <span>No Video</span>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
