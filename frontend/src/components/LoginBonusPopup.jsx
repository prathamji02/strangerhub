import React from 'react';
import { motion } from 'framer-motion';

const LoginBonusPopup = ({ isOpen, onClose, onClaimClick }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-gray-900/95 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 max-w-xs w-full shadow-2xl shadow-pink-500/20 text-center"
      >
        <div className="mb-6">
          <div className="inline-block p-4 rounded-full bg-pink-500/20 mb-4 animate-bounce">
            <span className="text-5xl">🎁</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            ₹50 Login Bonus!
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Welcome to IPU Friendlist! You've unlocked a special ₹50 signup bonus. Head over to your Earning Dashboard to claim it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onClaimClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-black text-lg shadow-lg shadow-pink-500/25 transition-all"
          >
            Claim Now
          </motion.button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-300 text-sm font-semibold transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginBonusPopup;
