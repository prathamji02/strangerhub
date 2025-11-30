import React from 'react';

function SetupScreen({ handleSetup, fakeName, setFakeName, message }) {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2 text-center">Create Your Alias</h1>
        <p className="text-center text-gray-400 mb-6">This name is permanent and cannot be changed.</p>
        <form onSubmit={handleSetup}>
          <input type="text" value={fakeName} onChange={(e) => setFakeName(e.target.value)} placeholder="Enter your unique alias" required className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
          <button type="submit" className="w-full p-3 rounded bg-blue-600 font-bold hover:bg-blue-700 transition-colors">Save Alias</button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
      </div>
    </div>
  );
}

export default SetupScreen;