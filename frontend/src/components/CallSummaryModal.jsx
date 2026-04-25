import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CallSummaryModal = ({ isOpen, onClose, callData, onRedeemClick }) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen && callData?.coinsEarned > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, callData?.coinsEarned]);

  if (!isOpen || !callData) return null;

  const { callDurationSeconds, coinsEarned, newBalance, earningEnabled, coinOptInEnabled } = callData;

  // Format duration as MM:SS
  const minutes = Math.floor(callDurationSeconds / 60);
  const seconds = callDurationSeconds % 60;
  const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
        transition={{ type: 'spring', damping: 15 }}
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Confetti */}
        {showCelebration && (
          <>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ y: 0, opacity: 1, x: 0 }}
                animate={{
                  y: -100,
                  opacity: 0,
                  x: (Math.random() - 0.5) * 100,
                }}
                transition={{ duration: 1, delay: 0.1 * i }}
              >
                {'🎉'[i % 1]}
              </motion.div>
            ))}
          </>
        )}

        {/* Header */}
        <motion.h2
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1 }}
          className="text-3xl font-bold text-white mb-4"
        >
          ✅ Call Ended
        </motion.h2>

        {/* Call Duration */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Call Duration</p>
          <p className="text-4xl font-bold text-cyan-400">{formattedDuration}</p>
          <p className="text-gray-400 text-xs mt-1">{callDurationSeconds} seconds</p>
        </div>

        {/* Coins Earned Section */}
        {coinOptInEnabled && earningEnabled ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-500/40"
          >
            <p className="text-gray-300 text-sm mb-2">💰 Coins Earned</p>
            <motion.p
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-5xl font-bold text-green-400 mb-2"
            >
              +{coinsEarned.toFixed(0)}
            </motion.p>
            <p className="text-green-300 text-xs">Added to your balance</p>
          </motion.div>
        ) : coinOptInEnabled && !earningEnabled ? (
          <div className="mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <p className="text-yellow-400 text-sm">⏸️ Earning is temporarily disabled</p>
            <p className="text-yellow-300 text-xs mt-1">Coins earned today will not count</p>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30"
          >
            <p className="text-blue-400 text-sm mb-2">💡 Enable Coin Earning</p>
            <p className="text-blue-300 text-xs">Opt-in to earn coins from your calls</p>
            <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold transition-colors">
              Set Up Now
            </button>
          </motion.div>
        )}

        {/* New Balance */}
        {coinOptInEnabled && (
          <div className="mb-6 p-4 bg-gray-800/30 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-white">{newBalance.toFixed(0)} coins</p>
            {newBalance >= 1000 && (
              <p className="text-green-400 text-xs mt-2 font-semibold">🎯 Ready to redeem for ₹500!</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {coinOptInEnabled && newBalance >= 1000 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRedeemClick}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>💳</span> Redeem ₹500 Now
            </motion.button>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Footer Info */}
        <p className="mt-4 text-gray-500 text-xs">
          💡 Tip: Longer calls earn more coins (1 coin per 2 minutes, max 10 min)
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CallSummaryModal;
