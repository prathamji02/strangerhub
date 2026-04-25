import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const CoinDashboard = ({ initialTab = 'balance', onBack }) => {
  const [coinData, setCoinData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [redemptionRequests, setRedemptionRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Bonus Claim Form States
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI_NUMBER');
  const [upiNumber, setUpiNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchCoinData();
  }, []);

  const fetchCoinData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/coins/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoinData(response.data);

      const historyRes = await axios.get(`${API_URL}/coins/transaction-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(historyRes.data.transactions);

      const requestsRes = await axios.get(`${API_URL}/coins/redemption-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRedemptionRequests(requestsRes.data.requests);
    } catch (err) {
      setError('Failed to fetch coin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedemption = async () => {
    if (coinData?.currentBalance < 1000) {
      setError('You need at least 1000 coins to redeem');
      return;
    }

    try {
      setRedemptionLoading(true);
      await axios.post(
        `${API_URL}/coins/redemption-request`,
        { coinsRequested: 1000 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchCoinData();
      setError('');
      setSuccess('✅ Redemption request submitted! Admin will review and transfer within 24 hours.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit redemption request');
    } finally {
      setRedemptionLoading(false);
    }
  };

  const handleLoginBonusClaim = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (paymentMethod === 'UPI_NUMBER' && !upiNumber) {
      setError('Please enter your UPI number');
      return;
    }

    if (paymentMethod === 'UPI_ID' && !upiId) {
      setError('Please enter your UPI ID');
      return;
    }

    if (paymentMethod === 'BANK_ACCOUNT' && (!accountNumber || !ifscCode)) {
      setError('Please enter both account number and IFSC code');
      return;
    }

    try {
      setClaimLoading(true);
      const response = await axios.post(
        `${API_URL}/coins/claim-login-bonus`,
        {
          paymentMethod,
          upiNumber: paymentMethod === 'UPI_NUMBER' ? upiNumber : null,
          upiId: paymentMethod === 'UPI_ID' ? upiId : null,
          accountNumber: paymentMethod === 'BANK_ACCOUNT' ? accountNumber : null,
          ifscCode: paymentMethod === 'BANK_ACCOUNT' ? ifscCode : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setShowClaimForm(false);
      setUpiNumber('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      await fetchCoinData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit login bonus claim');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading coin data...</div>
      </div>
    );
  }

  const progressPercentage = Math.min((coinData?.currentBalance / 1000) * 100, 100);
  const loginBonusStatus = coinData?.loginBonusStatus;

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">💰 Coin Dashboard</h1>
            <p className="text-gray-400">Manage your earnings and redeem for real money</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-blue-400 hover:text-blue-300 hover:underline font-semibold flex items-center gap-1">
              &larr; Back to Home
            </button>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
          >
            {success}
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 p-8 bg-gradient-to-br from-green-600/20 to-cyan-600/20 border border-green-500/40 rounded-2xl"
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Current Balance</p>
              <p className="text-4xl font-bold text-green-400">{Number(coinData?.currentBalance || 0).toFixed(0)}</p>
            </div>
            <div className="text-center border-l border-r border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Total Earned</p>
              <p className="text-3xl font-bold text-blue-400">{Number(coinData?.totalEarned || 0).toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total Redeemed</p>
              <p className="text-3xl font-bold text-purple-400">{Number(coinData?.totalSpent || 0).toFixed(0)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-300">Redemption Goal: ₹500</span>
              <span className="text-sm font-bold text-green-400">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="relative h-8 bg-gray-800/50 rounded-full border border-green-500/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  progressPercentage >= 100
                    ? 'from-yellow-500 to-green-500'
                    : 'from-green-600 to-green-400'
                } flex items-center justify-end pr-4 font-bold text-white text-sm`}
              >
                {progressPercentage > 15 && <span>{progressPercentage.toFixed(0)}%</span>}
              </motion.div>
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
              {Number(coinData?.currentBalance || 0) < 1000
                ? `${(1000 - Number(coinData?.currentBalance || 0)).toFixed(0)} coins needed`
                : '✅ Ready to redeem!'}
            </p>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6 border-b border-gray-800 overflow-x-auto">
          {['balance', 'rules', 'login-bonus', 'history', 'redemption'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'balance' && '💳 Payment Details'}
              {tab === 'rules' && '📜 Earning Rules'}
              {tab === 'login-bonus' && '🎁 Login Bonus'}
              {tab === 'history' && '📊 Call History'}
              {tab === 'redemption' && '💸 Redemption'}
            </button>
          ))}
        </div>

        {activeTab === 'rules' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">How Earning Works</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Your Earning Rate</h4>
                    <p className="text-gray-400 mt-1">
                      You will earn <span className="text-green-400 font-bold">{coinData?.userEarningRate?.coins} coins</span> for every <span className="text-blue-400 font-bold">{coinData?.userEarningRate?.minutes} minutes</span> you spend on a video call. 
                      The timer runs automatically while you are connected with a stranger.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    🪙
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Coin Value</h4>
                    <p className="text-gray-400 mt-1">
                      <span className="text-yellow-400 font-bold">2 Coins = ₹1</span>. Collect coins automatically at the end of every successful call.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    💸
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Redemption Process</h4>
                    <p className="text-gray-400 mt-1">
                      Once you reach a minimum of <span className="text-purple-400 font-bold">1000 coins</span>, you can submit a redemption request to the admin.
                      Admin will review the request and either approve (transfer money to your provided payment method) or reject it with specific remarks that you can view.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    📊
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Transparency</h4>
                    <p className="text-gray-400 mt-1">
                      Every single coin you earn is recorded. You can view your complete earning history in the "Call History" tab, and track your cashouts in the "Redemption" tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'login-bonus' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {loginBonusStatus?.hasClaim ? (
              <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Your Login Bonus Claim</h3>
                  <span
                    className={`px-4 py-2 rounded-full font-bold text-sm ${
                      loginBonusStatus.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : loginBonusStatus.status === 'APPROVED'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {loginBonusStatus.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-gray-400">Bonus Amount</span>
                    <span className="text-white font-bold">{loginBonusStatus.bonusAmount} coins</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-gray-400">Claimed On</span>
                    <span className="text-gray-300 text-sm">
                      {new Date(loginBonusStatus.claimedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {loginBonusStatus.status === 'APPROVED' && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 font-semibold">✅ Your claim has been approved!</p>
                      <p className="text-green-300 text-sm mt-2">
                        {loginBonusStatus.bonusAmount} coins have been added to your account.
                      </p>
                    </div>
                  )}
                  {loginBonusStatus.status === 'PENDING' && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 font-semibold">⏳ Pending Admin Review</p>
                      <p className="text-yellow-300 text-sm mt-2">
                        Your login bonus claim is being reviewed by the admin. You'll be notified once it's approved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-2xl">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">🎁 Claim Your Login Bonus!</h3>
                  <p className="text-gray-300">New users get 100 coins (₹50) as a login bonus. Add your payment details to claim it.</p>
                </div>

                {!showClaimForm ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowClaimForm(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-bold transition-colors"
                  >
                    Claim Login Bonus
                  </motion.button>
                ) : (
                  <form onSubmit={handleLoginBonusClaim} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Payment Method</label>
                      <div className="space-y-2">
                        {['UPI_NUMBER', 'UPI_ID', 'BANK_ACCOUNT'].map((method) => (
                          <label key={method} className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method}
                              checked={paymentMethod === method}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-gray-300">
                              {method === 'UPI_NUMBER' && '📱 UPI Number (10 digits)'}
                              {method === 'UPI_ID' && '🆔 UPI ID (username@upi)'}
                              {method === 'BANK_ACCOUNT' && '🏦 Bank Account'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === 'UPI_NUMBER' && (
                      <input
                        type="text"
                        placeholder="Enter UPI number (10 digits)"
                        value={upiNumber}
                        onChange={(e) => setUpiNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                      />
                    )}

                    {paymentMethod === 'UPI_ID' && (
                      <input
                        type="text"
                        placeholder="Enter UPI ID (e.g., name@bank)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                      />
                    )}

                    {paymentMethod === 'BANK_ACCOUNT' && (
                      <>
                        <input
                          type="text"
                          placeholder="Account Number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="IFSC Code"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                        />
                      </>
                    )}

                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={claimLoading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                      >
                        {claimLoading ? '⏳ Processing...' : '✅ Apply & Claim'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setShowClaimForm(false)}
                        className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-colors"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'balance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {coinData?.coinOptInEnabled ? (
              <>
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <h3 className="font-bold text-white mb-4">💳 Payment Method on File</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Method</span>
                      <span className="text-white font-semibold">{coinData?.paymentDetail?.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Details</span>
                      <span className="text-gray-300 font-mono text-sm">
                        {coinData?.paymentDetail?.maskedDetails || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                <p className="text-blue-400 mb-4">You haven't set up coin earning yet</p>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold">
                  Set Up Now
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx, idx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex justify-between items-center hover:border-green-500/30 transition-colors"
                  >
                    <div>
                      <p className="text-white font-semibold">{tx.type === 'EARNED_CALL' ? '🎥 Call Earning' : 'Other'}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}
                      </p>
                      {tx.duration && <p className="text-gray-500 text-xs">{Math.floor(tx.duration / 60)}m {tx.duration % 60}s call</p>}
                    </div>
                    <p className={`text-lg font-bold ${Number(tx.coins || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(tx.coins || 0) > 0 ? '+' : ''}{Number(tx.coins || 0).toFixed(0)}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No call history yet. Start making calls to earn coins!</p>
            )}
          </motion.div>
        )}

        {activeTab === 'redemption' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-2">Request Redemption</h3>
              <p className="text-gray-400 mb-4">
                You currently have <span className="text-green-400 font-bold">{Number(coinData?.currentBalance || 0).toFixed(0)} coins</span>.
                You need at least 1000 coins to request a cashout (1000 coins = ₹500).
              </p>
              
              {coinData?.currentBalance >= 1000 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRedemption}
                  disabled={redemptionLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {redemptionLoading ? '⏳ Processing...' : '💰 Submit Redeem Request (1000 Coins -> ₹500)'}
                </motion.button>
              ) : (
                <div className="w-full px-6 py-4 bg-gray-700/50 text-gray-400 rounded-lg text-center font-bold border border-gray-600">
                  🔒 {Math.ceil(1000 - Number(coinData?.currentBalance || 0))} more coins needed to redeem
                </div>
              )}
            </div>

            {redemptionRequests.length > 0 ? (
              <div className="space-y-3">
                {redemptionRequests.map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">{req.coins} coins = ₹{req.rupees}</p>
                        <p className="text-gray-400 text-sm">{new Date(req.requestDate).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : req.status === 'TRANSFERRED'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.transferRef && <p className="text-gray-400 text-xs">Transfer ID: {req.transferRef}</p>}
                    {req.rejectionReason && (
                      <p className="text-red-400 text-xs mt-2">Reason: {req.rejectionReason}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No redemption requests yet.</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CoinDashboard;
