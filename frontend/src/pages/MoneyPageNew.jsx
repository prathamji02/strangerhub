import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL });

export default function MoneyPageNew({ onClose, userGender = 'M', userBalance = 0, coinOptInEnabled = false, userInfo = {} }) {
  const [activeTab, setActiveTab] = useState(0); // 0: Login Bonus, 1: Start Earning, 2: Refer Friend
  const [earningConfig, setEarningConfig] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showReferralMessage, setShowReferralMessage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch earning config
      const configRes = await api.get('/coins/earning-config');
      setEarningConfig(configRes.data);

      // Fetch user referral code
      try {
        const refRes = await api.get('/coins/referral-code', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReferralCode(refRes.data.referralCode);
      } catch (err) {
      }

      // Fetch transaction history
      try {
        const historyRes = await api.get('/coins/transaction-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(historyRes.data.transactions || []);
      } catch (err) {
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatConversionRate = (coins, timeSeconds) => {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    
    let timeStr = '';
    if (minutes > 0) {
      timeStr += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (seconds > 0) {
      if (timeStr) timeStr += ' ';
      timeStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    return `${coins} coin${coins !== 1 ? 's' : ''} per ${timeStr}`;
  };

  const getUserEarningRate = () => {
    if (!earningConfig) return null;
    
    const isFemale = userGender && userGender.toLowerCase() === 'f';
    if (isFemale) {
      const coins = earningConfig.femaleCoinsAmount || 1;
      const timeSeconds = earningConfig.femaleConversionTimeSeconds || 60;
      return {
        coins,
        timeSeconds,
        label: formatConversionRate(coins, timeSeconds),
      };
    } else {
      const coins = earningConfig.maleCoinsAmount || 1;
      const timeSeconds = earningConfig.maleConversionTimeSeconds || 120;
      return {
        coins,
        timeSeconds,
        label: formatConversionRate(coins, timeSeconds),
      };
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Promo code copied!');
  };

  const userRate = getUserEarningRate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 z-40 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/80 border-b border-green-500/20 z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <span>💰</span> My Money
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {[
            { label: '🎁 Login Bonus', index: 0 },
            { label: '📈 Start Earning', index: 1 },
            { label: '👥 Refer Friend', index: 2, disabled: !coinOptInEnabled }
          ].map((tab) => (
            <button
              key={tab.index}
              onClick={() => !tab.disabled && setActiveTab(tab.index)}
              disabled={tab.disabled}
              className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
                activeTab === tab.index
                  ? 'border-b-2 border-green-400 text-green-400 bg-gray-800/50'
                  : tab.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto pb-20">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Tab 0: Login Bonus */}
            {activeTab === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-8 text-center">
                  <p className="text-6xl mb-4">🎉</p>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">Login Bonus!</h2>
                  <p className="text-5xl font-bold text-white mb-2">50 ₹</p>
                  <p className="text-gray-300 mb-6">Claim your instant welcome bonus</p>
                  <p className="text-sm text-gray-400 mb-6">You can redeem this immediately via UPI or Bank Transfer</p>
                  
                  <button
                    onClick={() => toast.success('Bonus claimed! Proceed to redemption.')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition-colors"
                  >
                    Claim 50 ₹ Now
                  </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Redemption Methods</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <span className="text-blue-400">✓</span>
                      <span className="text-gray-300"><span className="font-semibold">UPI Number:</span> Direct transfer to your phone number</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400">✓</span>
                      <span className="text-gray-300"><span className="font-semibold">UPI ID:</span> Transfer using your UPI handle</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400">✓</span>
                      <span className="text-gray-300"><span className="font-semibold">Bank Account:</span> Traditional bank transfer with details</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 1: Start Earning */}
            {activeTab === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-green-400 mb-4">🎯 How Earning Works</h2>
                  
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-300 font-semibold mb-2">📞 Video Call Earnings</p>
                      <p className="text-gray-400">You earn coins by having video calls with strangers on our platform.</p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-300 font-semibold mb-2">💰 Your Earning Rate</p>
                      {userRate ? (
                        <>
                          <p className="text-green-400 font-bold text-lg mb-2">{userRate.label}</p>
                          <p className="text-gray-400 text-xs">Based on your gender: {userGender?.toUpperCase() === 'F' ? 'Female ♀️' : 'Male/Other ♂️'}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Loading...</p>
                      )}
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-300 font-semibold mb-2">📊 Earning Examples</p>
                      {userRate && (
                        <div className="text-gray-400 text-xs space-y-1">
                          <p>• 2 min call = {Math.floor((2 * 60 / userRate.timeSeconds) * userRate.coins)} coins</p>
                          <p>• 5 min call = {Math.floor((5 * 60 / userRate.timeSeconds) * userRate.coins)} coins</p>
                          <p>• 10 min call = {Math.floor((10 * 60 / userRate.timeSeconds) * userRate.coins)} coins</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">✅ Important Rules</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Integral coins only:</span> Coins are awarded as whole numbers, no decimals</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Minimum 2 minutes:</span> Call must be at least 2 minutes to earn</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Maximum 10 minutes:</span> Calls longer than 10 minutes auto-disconnect</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Flexible rates:</span> Rates changed by admin, check your Money page regularly</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">See earnings immediately:</span> Coins credited at end of every call</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Both earn together:</span> Both users in a call earn coins</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span><span className="text-purple-300">Conversion rate:</span> 2 coins = ₹1 rupee</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4">💳 Payment Details</h3>
                  <p className="text-gray-300 text-sm mb-4">Set up your payment method to withdraw earned coins. You can update these anytime.</p>
                  <button
                    onClick={() => toast.success('Open payment details form')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition-colors"
                  >
                    Set Up Payment Method
                  </button>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Refer Friend */}
            {activeTab === 2 && !coinOptInEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <p className="text-2xl mb-4">🔒</p>
                <h2 className="text-xl font-bold text-gray-300 mb-2">Enable Earning First</h2>
                <p className="text-gray-400">Complete the "Start Earning" setup to unlock the referral program</p>
              </motion.div>
            )}

            {/* Tab 2: Refer Friend (Enabled) */}
            {activeTab === 2 && coinOptInEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-8 text-center">
                  <p className="text-6xl mb-4">👥</p>
                  <h2 className="text-2xl font-bold text-pink-400 mb-2">Refer & Earn</h2>
                  <p className="text-gray-300 mb-6">Invite friends and earn 60 coins for every successful referral!</p>
                  
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                    <p className="text-gray-400 text-sm mb-3">Your Promo Code</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={referralCode || 'GENERATING...'}
                        readOnly
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white font-mono text-center font-bold"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-4 py-3 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowReferralMessage(true)}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors mb-4"
                  >
                    📤 Refer to Friend
                  </button>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-green-400 mb-4">💰 How It Works</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="text-green-400 text-2xl">1️⃣</span>
                      <div>
                        <p className="text-white font-semibold">Share Your Code</p>
                        <p className="text-gray-400">Send your unique promo code to friends</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-400 text-2xl">2️⃣</span>
                      <div>
                        <p className="text-white font-semibold">They Register</p>
                        <p className="text-gray-400">Friend enters code during signup and first login</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-400 text-2xl">3️⃣</span>
                      <div>
                        <p className="text-white font-semibold">You Get 60 Coins</p>
                        <p className="text-gray-400">Instant bonus to your account when they join</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">📊 Your Referrals</h3>
                  {transactions.filter(t => t.type === 'REFERRAL_BONUS').length > 0 ? (
                    <div className="space-y-2">
                      {transactions.filter(t => t.type === 'REFERRAL_BONUS').map((tx) => (
                        <div key={tx.id} className="flex justify-between text-sm p-3 bg-gray-800/40 rounded">
                          <div>
                            <p className="text-gray-300 font-semibold">{tx.referredUserName || 'Friend'} joined</p>
                            <p className="text-gray-500 text-xs">{new Date(tx.date).toLocaleDateString()}</p>
                          </div>
                          <p className="text-green-400 font-bold">+{tx.coins}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No referrals yet. Start sharing!</p>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Referral Message Modal */}
      {showReferralMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReferralMessage(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-pink-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <p className="text-4xl">👋</p>
              <h2 className="text-2xl font-bold text-white">Your Friend Sent You This!</h2>
              
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Join <span className="text-pink-400 font-bold">{userInfo?.fake_name || 'Your Friend'}</span> on IPU Friendlist and connect with amazing people from your college!
                </p>
                
                <p className="text-gray-400 text-xs">
                  📱 Chat with strangers • 🎥 Video calls • 💰 Earn coins • 👥 Make new friends
                </p>

                <div className="bg-gray-800 rounded p-3 border border-pink-500/20">
                  <p className="text-gray-400 text-xs mb-2">Enter this promo code while registering:</p>
                  <p className="text-pink-400 font-mono font-bold text-lg">{referralCode}</p>
                </div>

                <p className="text-yellow-400 text-sm font-semibold">
                  🎁 Get 100 coins on your first login!
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Join me on IPU Friendlist! Use promo code: ${referralCode} to get 100 coins on first login. Download now! 🎉`
                  );
                  toast.success('Message copied! Share with friends');
                  setShowReferralMessage(false);
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Copy & Share
              </button>

              <button
                onClick={() => setShowReferralMessage(false)}
                className="w-full text-gray-400 hover:text-white font-semibold py-2"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
