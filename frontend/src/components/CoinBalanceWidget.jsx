import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useState as useState2 } from 'react';

const CoinBalanceWidget = ({ userCoins, onOptInClick, earningEnabled }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [coins, setCoins] = useState(userCoins || 0);

  useEffect(() => {
    setCoins(userCoins || 0);
  }, [userCoins]);

  // Calculate progress to 1000 coins (redemption goal)
  const progressPercentage = Math.min((coins / 1000) * 100, 100);
  const coinsNeeded = Math.max(0, 1000 - coins);
  const isGoalReached = coins >= 1000;

  // Coin earning rate: 1 coin per 2 minutes = 30 coins per hour
  const estimatedHoursToGoal = coinsNeeded / 30;

  return (
    <div className="relative inline-block">
      {/* Money Icon Button - Discrete, subtle */}
      <motion.button
        onClick={() => setShowPopover(!showPopover)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          earningEnabled
            ? 'hover:bg-green-500/20 text-green-400 hover:text-green-300'
            : 'opacity-50 cursor-not-allowed text-gray-400 hover:bg-gray-800/20'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={!earningEnabled}
        title={earningEnabled ? 'View coin balance' : 'Earning disabled'}
      >
        <span className="text-lg">💰</span>
        <span className="text-sm font-semibold min-w-[60px]">{coins.toFixed(0)}</span>
      </motion.button>

      {/* Popover - Detailed coin info and action */}
      {showPopover && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md border border-green-500/30 rounded-xl p-4 shadow-2xl z-50"
        >
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span>💰</span> Coin Balance
            </h3>
          </div>

          {/* Status Alert */}
          {!earningEnabled && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              ⚠️ Earning is temporarily disabled
            </div>
          )}

          {/* Big Balance Display */}
          <motion.div
            className="mb-4 p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20 text-center"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-5xl font-bold text-green-400 mb-1">{coins.toFixed(0)}</div>
            <div className="text-xs text-gray-400">coins in account</div>
          </motion.div>

          {/* Progress Bar - THE PSYCHOLOGICAL HOOK */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 font-semibold">GOAL: ₹500</span>
              <span className={`text-xs font-bold ${progressPercentage >= 100 ? 'text-green-400' : 'text-blue-400'}`}>
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            
            {/* Progress Bar Background */}
            <div className="relative h-6 bg-gray-800/50 rounded-full border border-green-500/20 overflow-hidden">
              {/* Progress Bar Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full flex items-center justify-end pr-2 font-bold text-xs text-white ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-cyan-500'
                    : 'bg-gradient-to-r from-green-600 to-green-400'
                }`}
              >
                {progressPercentage > 15 && <span>{progressPercentage.toFixed(0)}%</span>}
              </motion.div>

              {/* Goal Icon at 100% */}
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs">
                🎯
              </div>
            </div>

            {/* Progress Text */}
            <div className="mt-2 text-center text-xs text-gray-400">
              {isGoalReached ? (
                <span className="text-green-400 font-bold">✅ Ready to redeem!</span>
              ) : (
                <span>
                  {coinsNeeded > 0 ? `${coinsNeeded.toFixed(0)} coins to go` : 'Goal reached!'}
                  {coinsNeeded > 0 && ` (~${estimatedHoursToGoal.toFixed(1)}h)`}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs border-t border-green-500/10 pt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">📊</div>
              <div className="text-gray-400 text-xs mt-1">Daily Cap: 400</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-400">⏱️</div>
              <div className="text-gray-300 text-xs mt-1">
                <div>👩 1/min, 👨 2/min</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 border-t border-green-500/10 pt-4">
            <button className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg text-sm font-semibold transition-colors">
              📈 View History
            </button>
            {isGoalReached && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>💳</span> Redeem ₹500
              </motion.button>
            )}
            <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm font-semibold transition-colors">
              ⚙️ Settings
            </button>
          </div>

          {/* Celebration Animation - When goal reached */}
          {isGoalReached && (
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mt-4 text-center text-2xl"
            >
              🎉
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tooltip on hover */}
      {!showPopover && earningEnabled && (
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          {progressPercentage.toFixed(0)}% to ₹500 goal
        </div>
      )}
    </div>
  );
};

export default CoinBalanceWidget;
