import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CoinOptInModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI_NUMBER');
  const [upiNumber, setUpiNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (paymentMethod === 'UPI_NUMBER' && !upiNumber) {
      setError('Please enter UPI number');
      return;
    }
    if (paymentMethod === 'UPI_ID' && !upiId) {
      setError('Please enter UPI ID');
      return;
    }
    if (paymentMethod === 'BANK_ACCOUNT' && (!accountNumber || !ifscCode)) {
      setError('Please enter account number and IFSC code');
      return;
    }

    await onSubmit({
      paymentMethod,
      upiNumber,
      upiId,
      accountNumber,
      ifscCode,
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-green-500/30 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">💰 Start Earning Coins</h2>
          <p className="text-gray-400 text-sm">Set up your payment details to enable coin earning</p>
        </div>

        {/* Earning Rules */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-gray-300">
          <h3 className="font-bold text-blue-400 mb-2">📋 How it works:</h3>
          <ul className="space-y-1 text-xs">
            <li>👩 <span className="text-pink-400 font-semibold">Female users:</span> Earn based on their conversion rate</li>
            <li>👨 <span className="text-blue-400 font-semibold">Other users:</span> Earn based on their conversion rate</li>
            <li>✅ Minimum 2 minutes per call to earn</li>
            <li>✅ Maximum 10 minutes per call allowed</li>
            <li>✅ Redeem 1000 coins for ₹500</li>
            <li>✅ 100 coin bonus on first login</li>
            <li>✅ Both users earn from the same call</li>
            <li>💡 Check the Money page to see your exact earning rate</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Payment Method <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'UPI_NUMBER', label: '📱 UPI Number' },
                { value: 'UPI_ID', label: '👤 UPI ID' },
                { value: 'BANK_ACCOUNT', label: '🏦 Bank Account' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border border-gray-700 rounded-lg cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Fields */}
          {paymentMethod === 'UPI_NUMBER' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                UPI Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                placeholder="e.g., 9876543210"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">10-digit mobile number registered with UPI</p>
            </div>
          )}

          {paymentMethod === 'UPI_ID' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                UPI ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g., yourname@upi"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Google Pay, PhonePe, or BHIM UPI ID</p>
            </div>
          )}

          {paymentMethod === 'BANK_ACCOUNT' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Account Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g., 123456789012"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  IFSC Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SBIN0001234"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none uppercase"
                />
                <p className="mt-1 text-xs text-gray-400">11-character IFSC code</p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-400">
            <span className="font-semibold">🔒 Secure:</span> Your payment details are encrypted and only used for coin
            redemption transfers.
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enabling...' : 'Enable Earning'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CoinOptInModal;
