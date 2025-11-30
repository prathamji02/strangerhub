import React from 'react';

function OtpScreen({ handleVerify, otp, setOtp, message, loginUserInfo, setView }) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm text-center">
            <button onClick={() => setView('login')} className="absolute top-4 left-4 text-blue-400 hover:underline">&larr; Back</button>
            <h1 className="text-2xl font-bold mb-2">Check your Email</h1>
            {loginUserInfo && (
                <>
                    <p className="text-gray-300">Hi, <span className="font-bold">{loginUserInfo.name}</span>!</p>
                    <p className="text-gray-400 mb-6 text-sm">We've sent a One-Time Password to <br/> <span className="font-semibold">{loginUserInfo.email}</span></p>
                </>
            )}
          <form onSubmit={handleVerify}>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" required className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center tracking-[1em]" />
            <button type="submit" className="w-full p-3 rounded bg-blue-600 font-bold hover:bg-blue-700">Verify</button>
          </form>
          {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
        </div>
      </div>
    );
}

export default OtpScreen;