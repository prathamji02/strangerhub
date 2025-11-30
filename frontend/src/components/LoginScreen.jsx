import React from 'react';

function LoginScreen({ handleLogin, enrollmentNo, setEnrollmentNo, message }) {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6 text-center">Login to StrangerHub</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="enrollmentNo" className="block mb-2 text-sm font-medium text-gray-300">
              Enrollment Number
            </label>
            <input
              type="text"
              id="enrollmentNo"
              value={enrollmentNo}
              onChange={(e) => setEnrollmentNo(e.target.value)}
              placeholder="Enter your number"
              required
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded bg-blue-600 font-bold hover:bg-blue-700 transition-colors"
          >
            Get OTP
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
      </div>
    </div>
  );
}

export default LoginScreen;