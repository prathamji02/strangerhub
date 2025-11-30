import React from 'react';

function RateChatScreen({ handleRateSubmit, rating, setRating, review, setReview, handleBlock, handleReport }) {
    return (
        <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-4">Chat Over!</h1>
            <p className="text-gray-400 mb-6">How was your conversation?</p>
            <form onSubmit={handleRateSubmit}>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setRating(star)} className={`text-4xl transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Leave an optional review..." className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 h-24 resize-none" />
              <button type="submit" className="w-full p-3 rounded bg-blue-600 font-bold hover:bg-blue-700 transition-colors">
                Submit and Go Home
              </button>
            </form>
            <div className="mt-4 border-t border-gray-700 pt-4 flex flex-col gap-2">
                <button type="button" onClick={handleBlock} className="w-full p-3 rounded bg-orange-700 font-bold hover:bg-orange-800 transition-colors">
                    Block User and Go Home
                </button>
                <button type="button" onClick={handleReport} className="w-full p-3 rounded bg-red-700 font-bold hover:bg-red-800 transition-colors">
                    Report User and Go Home
                </button>
            </div>
          </div>
        </div>
    );
}

export default RateChatScreen;