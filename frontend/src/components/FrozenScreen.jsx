import React from 'react';

function FrozenScreen({ userInfo }) {
    const unfreezeDate = new Date(userInfo.unfreezeAt).toLocaleString();
    return (
        <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4 text-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-4 text-yellow-400">Account Frozen</h1>
                <p className="text-gray-300">Your account is currently frozen due to a violation of community guidelines.</p>
                <p className="text-gray-400 mt-2">You will be able to log in again after:</p>
                <p className="text-2xl font-bold mt-4 text-white">{unfreezeDate}</p>
            </div>
        </div>
    );
}

export default FrozenScreen;