// import React from 'react';

// function ChatScreen({ partnerInfo, isPersistentChat, chatMessages, chatEndRef, currentMessage, setCurrentMessage, handleSendMessage, handleSkip, connectRequestSent, connectRequestReceived, handleConnect, handleAcceptConnect }) {
//   return (
//     <div className="bg-gray-900 text-white h-screen flex flex-col p-0 sm:p-4">
//       <div className="bg-gray-800 rounded-lg shadow-lg w-full h-full flex flex-col">
//         <div className="text-center p-4 border-b border-gray-700">
//           <h2 className="text-xl font-bold">
//             Chatting with <span className="text-blue-400">{partnerInfo?.fake_name || 'a stranger'}</span>
//           </h2>
//           {!isPersistentChat && (
//             <p className="text-sm text-gray-400">
//               {partnerInfo?.gender || 'N/A'} - ★ {partnerInfo?.averageRating.toFixed(1)} ({partnerInfo?.ratingCount} ratings)
//             </p>
//           )}
//         </div>
//         <div className="flex-grow overflow-y-auto p-4 bg-gray-700">
//           {chatMessages.map((msg, index) => (
//             <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`max-w-xs md:max-w-md p-3 rounded-2xl mb-2 ${msg.sender === 'me' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-600 rounded-bl-none'}`}>
//                 {msg.text}
//               </div>
//             </div>
//           ))}
//           <div ref={chatEndRef} />
//         </div>
//         <div className="p-4">
//             <form onSubmit={handleSendMessage} className="flex gap-2">
//                 <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Type a message..." className="flex-grow p-3 rounded-full bg-gray-600 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 px-5" />
//                 <button type="submit" className="p-3 w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 font-bold hover:bg-blue-700 transition-colors">
//                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
//                 </button>
//             </form>
//             <div className="mt-4 flex gap-2">
//                 <button onClick={handleSkip} className="flex-grow p-2 rounded-lg bg-yellow-600 font-bold hover:bg-yellow-700 transition-colors">
//                     {isPersistentChat ? 'Back to Home' : 'End Chat'}
//                 </button>
//                 {!isPersistentChat && !connectRequestSent && !connectRequestReceived && (
//                     <button onClick={handleConnect} className="flex-grow p-2 rounded-lg bg-green-600 font-bold hover:bg-green-700 transition-colors">Connect</button>
//                 )}
//             </div>
//             {!isPersistentChat && connectRequestSent && <p className="mt-2 text-center text-gray-400">Connection request sent...</p>}
//             {!isPersistentChat && connectRequestReceived && (
//                 <div className="mt-4 text-center bg-gray-700 p-3 rounded-lg">
//                     <p className="font-semibold">Stranger wants to connect!</p>
//                     <button onClick={handleAcceptConnect} className="mt-2 w-full p-2 rounded bg-green-600 font-bold hover:bg-green-700 transition-colors">Accept</button>
//                 </div>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ChatScreen;




import React from 'react';

function ChatScreen({ partnerInfo, isPersistentChat, chatMessages, chatEndRef, currentMessage, setCurrentMessage, handleSendMessage, handleSkip, connectRequestSent, connectRequestReceived, handleConnect, handleAcceptConnect }) {
  
  // Helper function to format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col p-0 sm:p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full h-full flex flex-col">
        <div className="text-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            Chatting with <span className="text-blue-400">{partnerInfo?.fake_name || 'a stranger'}</span>
          </h2>
          {!isPersistentChat && (
            <p className="text-sm text-gray-400">
              {partnerInfo?.gender || 'N/A'} - ★ {partnerInfo?.averageRating.toFixed(1)} ({partnerInfo?.ratingCount} ratings)
            </p>
          )}
        </div>

        <div className="flex-grow overflow-y-auto p-4 bg-gray-700">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex flex-col mb-3 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'me' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-600 rounded-bl-none'}`}>
                {msg.text}
              </div>
              <span className="text-xs text-gray-500 mt-1 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Type a message..." className="flex-grow p-3 rounded-full bg-gray-600 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 px-5" />
                <button type="submit" className="p-3 w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 font-bold hover:bg-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                </button>
            </form>
            <div className="mt-4 flex gap-2">
                <button onClick={handleSkip} className="flex-grow p-2 rounded-lg bg-yellow-600 font-bold hover:bg-yellow-700 transition-colors">
                    {isPersistentChat ? 'Back to Home' : 'End Chat'}
                </button>
                {!isPersistentChat && !connectRequestSent && !connectRequestReceived && (
                    <button onClick={handleConnect} className="flex-grow p-2 rounded-lg bg-green-600 font-bold hover:bg-green-700 transition-colors">Connect</button>
                )}
            </div>
            {!isPersistentChat && connectRequestSent && <p className="mt-2 text-center text-gray-400">Connection request sent...</p>}
            {!isPersistentChat && connectRequestReceived && (
                <div className="mt-4 text-center bg-gray-700 p-3 rounded-lg">
                    <p className="font-semibold">Stranger wants to connect!</p>
                    <button onClick={handleAcceptConnect} className="mt-2 w-full p-2 rounded bg-green-600 font-bold hover:bg-green-700 transition-colors">Accept</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default ChatScreen;