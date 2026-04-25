import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL });

export default function MoneyPage({ onClose, userGender = 'M', userBalance = 0 }) {
  // Earning Config & User Data
  const [earningConfig, setEarningConfig] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [coinOptInEnabled, setCoinOptInEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('UPI_ID');
  const [paymentData, setPaymentData] = useState({
    upiNumber: '',
    upiId: '',
    accountNumber: '',
    ifscCode: ''
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Referral State
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Init: Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        // Fetch user info
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(userRes.data);
        setCoinOptInEnabled(userRes.data.coinOptInEnabled);

        // Fetch earning config
        const configRes = await api.get('/coins/earning-config');
        setEarningConfig(configRes.data);

        // Fetch referral code
        try {
          const refRes = await api.get('/coins/referral-code', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReferralCode(refRes.data.referralCode);
        } catch (err) {
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load earning information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ===== SECTION 2: START EARNING =====
  const handleEnableEarning = async (e) => {
    e.preventDefault();

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (paymentMethod === 'UPI_NUMBER' && !paymentData.upiNumber) {
      toast.error('Please enter UPI number');
      return;
    }
    if (paymentMethod === 'UPI_ID' && !paymentData.upiId) {
      toast.error('Please enter UPI ID');
      return;
    }
    if (paymentMethod === 'BANK_ACCOUNT' && (!paymentData.accountNumber || !paymentData.ifscCode)) {
      toast.error('Please enter account number and IFSC code');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const token = localStorage.getItem('authToken');
      await api.post('/coins/opt-in', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Earning enabled! You can now earn coins from calls.');
      setCoinOptInEnabled(true);
      
      // Fetch referral code after enabling
      const refRes = await api.get('/coins/referral-code', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralCode(refRes.data.referralCode);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to enable earning');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // ===== SECTION 3: REFER TO FRIEND =====
  const getReferralMessage = () => {
    return `Hey! 👋 I'm using IPU Friendlist to connect with people anonymously.

It's awesome! 🔥

Join me using my referral code: ${referralCode}

🎁 You'll get instant signup bonus!
💰 We both earn coins from video calls!
🎥 Video calls or text chat - your choice!
🔒 Completely anonymous & safe!

Download now and enter the code while registering!`;
  };

  const handleShareReferral = async () => {
    const message = getReferralMessage();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join IPU Friendlist',
          text: message
        });
      } catch (err) {
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard!');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get earning rate based on gender
  const getEarningRate = () => {
    if (!earningConfig) return null;
    
    const isFemale = userGender && userGender.toLowerCase() === 'f';
    if (isFemale) {
      const coins = earningConfig.femaleCoinsAmount || 1;
      const seconds = earningConfig.femaleConversionTimeSeconds || 60;
      return { coins, seconds };
    } else {
      const coins = earningConfig.maleCoinsAmount || 1;
      const seconds = earningConfig.maleConversionTimeSeconds || 120;
      return { coins, seconds };
    }
  };

  const rate = getEarningRate();
  const rateMinutes = rate ? Math.floor(rate.seconds / 60) : 0;
  const rateSeconds = rate ? rate.seconds % 60 : 0;
  const rateLabel = rate ? `${rate.coins} coin${rate.coins !== 1 ? 's' : ''} per ${rateMinutes}:${String(rateSeconds).padStart(2, '0')} min` : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 z-40 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-gray-900 via-gray-900 to-transparent border-b border-green-500/20 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-green-400">💰 My Earnings</h1>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>
      </div>

      {/* Current Balance Display */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-green-500/20 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Balance</p>
              <h2 className="text-4xl font-bold text-green-400">{Math.floor(userBalance)}</h2>
              <p className="text-gray-500 text-xs mt-1">₹{(Math.floor(userBalance) / 2).toFixed(2)} (2 coins = ₹1)</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 max-w-4xl mx-auto space-y-6 pb-20">
        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : (
          <>
            {/* ===== SECTION 1: CLAIM LOGIN BONUS ===== */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-6 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <span>🎁</span> Claim Your Login Bonus
                </h3>
                <p className="text-gray-300 mb-4">Get instant 50 rupees (100 coins) - redeem directly to your UPI or bank account!</p>

                {userInfo?.isNewUserBonusApplied ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                    <p className="text-green-300 font-bold">✅ Bonus Already Claimed!</p>
                    <p className="text-green-400 text-sm mt-1">+100 coins received</p>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!paymentMethod) {
                      toast.error('Please select a payment method');
                      return;
                    }
                    if (paymentMethod === 'UPI_NUMBER' && !paymentData.upiNumber) {
                      toast.error('Please enter UPI number');
                      return;
                    }
                    if (paymentMethod === 'UPI_ID' && !paymentData.upiId) {
                      toast.error('Please enter UPI ID');
                      return;
                    }
                    if (paymentMethod === 'BANK_ACCOUNT' && (!paymentData.accountNumber || !paymentData.ifscCode)) {
                      toast.error('Please enter account number and IFSC code');
                      return;
                    }
                    
                    setIsSubmittingPayment(true);
                    try {
                      const token = localStorage.getItem('authToken');
                      // First, save payment details
                      await api.post('/coins/opt-in', paymentData, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      // Then claim bonus
                      const response = await api.post(
                        '/coins/redeem-login-bonus',
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      toast.success('🎉 ' + response.data.message);
                      setUserInfo(prev => ({
                        ...prev,
                        currentCoinsBalance: response.data.newBalance,
                        isNewUserBonusApplied: true,
                        coinOptInEnabled: true
                      }));
                      setCoinOptInEnabled(true);
                      
                      // Fetch referral code after claiming
                      const refRes = await api.get('/coins/referral-code', {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setReferralCode(refRes.data.referralCode);
                    } catch (error) {
                      toast.error(error.response?.data?.error || 'Failed to claim bonus');
                    } finally {
                      setIsSubmittingPayment(false);
                    }
                  }} className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-amber-500/20 mb-4">
                      <p className="text-gray-300 text-sm mb-2">You'll receive:</p>
                      <p className="text-2xl font-bold text-green-400">100 coins = ₹50</p>
                      <p className="text-gray-500 text-xs mt-2">Transferred instantly to your payment method</p>
                    </div>

                    <div>
                      <p className="text-gray-300 font-bold mb-3">📌 Select Payment Method:</p>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-3 mb-4">
                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'UPI_ID' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="UPI_ID"
                            checked={paymentMethod === 'UPI_ID'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">UPI ID (e.g., yourname@upi)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'UPI_NUMBER' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="UPI_NUMBER"
                            checked={paymentMethod === 'UPI_NUMBER'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">UPI Number (e.g., 9876543210)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'BANK_ACCOUNT' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="BANK_ACCOUNT"
                            checked={paymentMethod === 'BANK_ACCOUNT'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">Bank Account</span>
                        </label>
                      </div>

                      {/* Dynamic Input Fields */}
                      <div className="space-y-3">
                        {paymentMethod === 'UPI_ID' && (
                          <input
                            type="email"
                            placeholder="yourname@upi"
                            value={paymentData.upiId}
                            onChange={(e) => setPaymentData({...paymentData, upiId: e.target.value})}
                            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 outline-none transition"
                            required
                          />
                        )}

                        {paymentMethod === 'UPI_NUMBER' && (
                          <input
                            type="text"
                            placeholder="10-digit mobile number"
                            value={paymentData.upiNumber}
                            onChange={(e) => setPaymentData({...paymentData, upiNumber: e.target.value})}
                            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 outline-none transition"
                            required
                          />
                        )}

                        {paymentMethod === 'BANK_ACCOUNT' && (
                          <>
                            <input
                              type="text"
                              placeholder="Account Number"
                              value={paymentData.accountNumber}
                              onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
                              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 outline-none transition"
                              required
                            />
                            <input
                              type="text"
                              placeholder="IFSC Code"
                              value={paymentData.ifscCode}
                              onChange={(e) => setPaymentData({...paymentData, ifscCode: e.target.value})}
                              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 outline-none transition"
                              required
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      {isSubmittingPayment ? '⏳ Processing...' : '🎉 Claim & Redeem ₹50'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* ===== SECTION 2: START EARNING ===== */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-2xl p-6 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <span>💻</span> Start Earning from Video Calls
                </h3>

                {/* Earning Rules - FORMAL VERSION */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-blue-500/20">
                  <p className="text-gray-300 font-bold mb-4 text-lg">📋 Earning Guidelines & Rules</p>
                  
                  <div className="space-y-4">
                    {/* How Earning Works */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">How You Earn:</p>
                      <p className="text-gray-300 text-sm">You will earn virtual coins for every video call you have with other users on our platform. The number of coins earned is determined by the duration of the call and your profile gender.</p>
                    </div>

                    {/* Conversion Rate */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">💱 Coin Conversion Rate:</p>
                      <p className="text-gray-300 text-sm"><strong>{rateLabel}</strong> (This rate may vary by gender and is set by administrators)</p>
                    </div>

                    {/* Call Duration Rules */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">⏱️ Call Duration Requirements:</p>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• <strong>Minimum Duration:</strong> You must call for at least 2 minutes to earn coins</li>
                        <li>• <strong>Maximum Duration:</strong> Calls are limited to 10 minutes maximum. The call will automatically disconnect after 10 minutes</li>
                        <li>• <strong>Whole Numbers Only:</strong> Coins are awarded in whole numbers (no decimal values). For example, a 2.5-minute call will be rounded down</li>
                      </ul>
                    </div>

                    {/* Daily Cap */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">📅 Daily Earnings Limit:</p>
                      <p className="text-gray-300 text-sm">You can earn a <strong>maximum of 400 coins per day</strong>. Once you reach this limit, you cannot earn additional coins until the next day (reset at midnight)</p>
                    </div>

                    {/* Mutual Earning */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">👥 Both Users Benefit:</p>
                      <p className="text-gray-300 text-sm">Both participants in a video call will earn coins independently. Your earnings do not affect the other user's earnings</p>
                    </div>

                    {/* Redemption */}
                    <div>
                      <p className="text-blue-300 font-bold text-sm mb-2">💳 Redemption Process:</p>
                      <p className="text-gray-300 text-sm">Once you have accumulated 1,000 coins, you can redeem them for ₹500. Redemptions will be processed to your registered payment method (UPI or Bank Account)</p>
                    </div>

                    {/* Opt-in Requirement */}
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded p-3">
                      <p className="text-purple-300 font-bold text-sm mb-1">⚠️ Important:</p>
                      <p className="text-purple-200 text-sm">You must <strong>enable earning and provide valid payment details</strong> before you can start earning coins</p>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="bg-gray-800/30 rounded-lg p-4 mb-6 border border-blue-500/10">
                  <p className="text-gray-300 font-bold mb-3">📊 Earning Examples:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 rounded p-3">
                      <p className="text-gray-400 text-sm">2 min call</p>
                      <p className="text-green-400 font-bold text-lg">1 coin</p>
                    </div>
                    <div className="bg-gray-900/50 rounded p-3">
                      <p className="text-gray-400 text-sm">5 min call</p>
                      <p className="text-green-400 font-bold text-lg">2 coins</p>
                    </div>
                    <div className="bg-gray-900/50 rounded p-3">
                      <p className="text-gray-400 text-sm">10 min call</p>
                      <p className="text-green-400 font-bold text-lg">5 coins</p>
                    </div>
                    <div className="bg-gray-900/50 rounded p-3">
                      <p className="text-gray-400 text-sm">Daily max</p>
                      <p className="text-green-400 font-bold text-lg">400 coins</p>
                    </div>
                  </div>
                </div>

                {coinOptInEnabled ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                    <p className="text-green-300 font-bold">✅ Earning Enabled!</p>
                    <p className="text-green-400 text-sm mt-1">Coins will be awarded automatically after each call</p>
                  </div>
                ) : (
                  <form onSubmit={handleEnableEarning} className="space-y-4">
                    <div>
                      <p className="text-gray-300 font-bold mb-3">📌 Select Payment Method for Redemptions:</p>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-3 mb-4">
                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'UPI_ID' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="UPI_ID"
                            checked={paymentMethod === 'UPI_ID'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">UPI ID (e.g., yourname@upi)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'UPI_NUMBER' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="UPI_NUMBER"
                            checked={paymentMethod === 'UPI_NUMBER'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">UPI Number (e.g., 9876543210)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition"
                               style={{borderColor: paymentMethod === 'BANK_ACCOUNT' ? '#3b82f6' : '#374151'}}>
                          <input
                            type="radio"
                            value="BANK_ACCOUNT"
                            checked={paymentMethod === 'BANK_ACCOUNT'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300">Bank Account</span>
                        </label>
                      </div>

                      {/* Dynamic Input Fields */}
                      <div className="space-y-3">
                        {paymentMethod === 'UPI_ID' && (
                          <input
                            type="email"
                            placeholder="yourname@upi"
                            value={paymentData.upiId}
                            onChange={(e) => setPaymentData({...paymentData, upiId: e.target.value})}
                            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                            required
                          />
                        )}

                        {paymentMethod === 'UPI_NUMBER' && (
                          <input
                            type="text"
                            placeholder="10-digit mobile number"
                            value={paymentData.upiNumber}
                            onChange={(e) => setPaymentData({...paymentData, upiNumber: e.target.value})}
                            className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                            required
                          />
                        )}

                        {paymentMethod === 'BANK_ACCOUNT' && (
                          <>
                            <input
                              type="text"
                              placeholder="Account Number"
                              value={paymentData.accountNumber}
                              onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
                              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                              required
                            />
                            <input
                              type="text"
                              placeholder="IFSC Code"
                              value={paymentData.ifscCode}
                              onChange={(e) => setPaymentData({...paymentData, ifscCode: e.target.value})}
                              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                              required
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      {isSubmittingPayment ? '⏳ Processing...' : '🚀 Enable Earning'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* ===== SECTION 3: REFER TO FRIEND ===== */}
            {coinOptInEnabled && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-pink-500/20 via-rose-500/10 to-red-500/10 border border-pink-500/30 rounded-2xl p-6 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-pink-400 mb-2 flex items-center gap-2">
                    <span>👥</span> Refer & Earn 60 Coins
                  </h3>
                  <p className="text-gray-300 mb-4">Share your unique code and get 60 coins every time a friend signs up!</p>

                  {/* Referral Code Display */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-pink-500/20 mb-4">
                    <p className="text-gray-400 text-sm mb-2">Your Unique Referral Code:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-900/50 rounded p-3">
                        <p className="text-2xl font-bold text-pink-400 font-mono tracking-widest text-center">{referralCode || 'GENERATING...'}</p>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className={`px-4 py-3 rounded-lg font-bold transition-all ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-pink-600 hover:bg-pink-700 text-white'
                        }`}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* How Referral Works */}
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-pink-500/10 mb-4">
                    <p className="text-gray-300 font-bold mb-3">📢 How It Works:</p>
                    <ol className="space-y-2 text-sm text-gray-300">
                      <li className="flex gap-2">
                        <span className="text-pink-400 font-bold">1.</span>
                        <span>Share your referral code with friends</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-pink-400 font-bold">2.</span>
                        <span>They enter your code during signup</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-pink-400 font-bold">3.</span>
                        <span>They log in for the first time</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-pink-400 font-bold">4.</span>
                        <span className="text-green-400 font-bold">You get 60 coins instantly! 🎉</span>
                      </li>
                    </ol>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={handleShareReferral}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <span>📤</span> Share Referral Link
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== REFER TO FRIEND BUTTON (Greyed out if earning not enabled) ===== */}
            {!coinOptInEnabled && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                disabled
                title="Enable earning first to unlock referral"
                className="w-full bg-gray-600/30 border border-gray-600/50 text-gray-500 font-bold py-3 rounded-lg transition-all cursor-not-allowed flex items-center justify-center gap-2 opacity-60"
              >
                <span>👥</span> Refer to Friend
                <span className="text-xs ml-2">(Enable earning first)</span>
              </motion.button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
