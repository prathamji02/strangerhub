import React from 'react';

export function Spinner() {
    return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;
}

export function LoginScreen({ handleLogin, enrollmentNo, setEnrollmentNo, message, isLoading }) {
    return (
        <div className="bg-gray-900 text-white h-dvh flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative z-10">
                <h1 className="text-4xl font-bold mb-8 text-center leading-tight">
                    <span className="block text-2xl font-normal text-gray-400">Login to</span>
                    <span className="block text-5xl mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">IPU Friendlist</span>
                </h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-6">
                        <label htmlFor="enrollmentNo" className="block mb-2 text-sm font-medium text-gray-300">Enrollment Number</label>
                        <input
                            type="text"
                            id="enrollmentNo"
                            value={enrollmentNo}
                            onChange={(e) => setEnrollmentNo(e.target.value)}
                            placeholder="Enter your number"
                            required
                            className="w-full p-4 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold hover:opacity-90 transition-all transform hover:scale-[1.02] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? <Spinner /> : 'Get OTP'}
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{message}</p>}
            </div>
        </div>
    );
}

export function OtpScreen({ handleVerify, otp, setOtp, message, loginUserInfo, setView, isLoading }) {
    return (
        <div className="bg-gray-900 text-white h-dvh flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative z-10">
                <button onClick={() => setView('login')} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">&larr; Back</button>
                <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Check your Email</h1>
                {loginUserInfo && (
                    <div className="mb-6">
                        <p className="text-gray-300">Hi, <span className="font-bold text-white">{loginUserInfo.name}</span>!</p>
                        <p className="text-gray-400 text-sm mt-1">We've sent a One-Time Password to <br /> <span className="font-semibold text-blue-300">{loginUserInfo.email}</span></p>
                    </div>
                )}
                <form onSubmit={handleVerify}>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        required
                        className="w-full p-4 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6 text-center tracking-[1em] text-2xl font-mono transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold hover:opacity-90 transition-all transform hover:scale-[1.02] flex justify-center items-center disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? <Spinner /> : 'Verify'}
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{message}</p>}
            </div>
        </div>
    );
}

export function SetupScreen({ handleSetup, fakeName, setFakeName, isLoading }) {
    return (
        <div className="bg-gray-900 text-white h-dvh flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative z-10">
                <h1 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Create Your Alias</h1>
                <p className="text-center text-gray-400 mb-8 text-sm">This name is permanent and cannot be changed.</p>
                <form onSubmit={handleSetup}>
                    <input
                        type="text"
                        value={fakeName}
                        onChange={(e) => setFakeName(e.target.value)}
                        placeholder="Enter your unique alias"
                        required
                        className="w-full p-4 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6 transition-all text-center text-lg"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold hover:opacity-90 transition-all transform hover:scale-[1.02] flex justify-center items-center disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? <Spinner /> : 'Save Alias'}
                    </button>
                </form>
            </div>
        </div>
    );
}
