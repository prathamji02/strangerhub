/// frontend/src/AboutPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
// import Logo from './Logo'; // REMOVED: No longer importing the Logo component

// Animation variant for sections to fade in as they're scrolled into view
const sectionVariant = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: "easeOut" }
};

const AboutScreen = ({ setView }) => {
  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white font-sans overflow-hidden">
      {/* Animated Aurora Background (re-used from LandingScreen for consistency) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-[10%] left-[40%] w-[500px] h-[500px] bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-teal-500/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content - sits above the background */}
      <div className="relative z-10 container mx-auto p-6 pb-28">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center my-12 md:my-20"
        >
          {/* CORRECTED: Using direct <img> tag for logo.png */}
          <img
            src="/logo.png" // Path to your logo in the public directory
            alt="IPU Friendlist Logo"
            className="mx-auto mb-6 h-32 w-32 rounded-2xl shadow-lg border-2 border-blue-400"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
            About IPU Friendlist
          </h1>
          <p className="text-lg md:text-xl font-medium text-gray-300 max-w-3xl mx-auto">
            Building trust, fostering connection, and ensuring a vibrant community for GGSIPU students.
          </p>
        </motion.header>

        <main className="space-y-12">
          <motion.section {...sectionVariant} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Core Principles: Trust & Fun</h2>
            <p className="text-gray-300 text-lg mb-4">
              In the vast digital world, finding genuine connections can be challenging. IPU Friendlist is designed to bridge that gap specifically for GGSIPU students, starting with GTBIT. We're committed to providing a platform where you can truly be yourself, without compromising your privacy or safety.
            </p>
            <ul className="space-y-3 text-gray-400 list-disc list-inside">
              <li><strong>Verified Community:</strong> Every user on IPU Friendlist is a verified GGSIPU student. This foundation of authenticity ensures you're always connecting with real peers from your university.</li>
              <li><strong>Anonymity by Design:</strong> Chat anonymously using an alias (your "fake name"). Your real identity remains private until you choose to reveal it.</li>
              <li><strong>Student-Centric:</strong> We understand the unique social dynamics of campus life. IPU Friendlist is tailored to help you expand your social circle, find study partners, or just have a casual chat.</li>
            </ul>
          </motion.section>

          <motion.section {...sectionVariant} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Current Features & How We Keep It Real</h2>
            <div className="space-y-6 text-gray-300">
              <div className="flex items-start">
                <span className="text-blue-400 text-2xl mr-4">&#9999;</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">Anonymous Random Chat:</h3>
                  <p>Jump into spontaneous conversations with fellow students. It's the perfect way to meet new people without pressure.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-yellow-400 text-2xl mr-4">&#9733;</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">Community Rating System:</h3>
                  <p>After every chat, you get to rate your experience. Your average rating is publicly displayed, encouraging respectful and engaging interactions from everyone. Build your reputation as a great chat partner!</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-400 text-2xl mr-4">&#10003;</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">Connect & Private Chat:</h3>
                  <p>Found someone interesting? Send a "Connect" request! If accepted, a private, persistent chatroom is created. This allows you to deepen connections beyond the random chats. You can also delete these private chats anytime.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-red-400 text-2xl mr-4">&#9888;</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">Report & Block:</h3>
                  <p>Your safety is paramount. If any interaction is inappropriate, you have the power to block and report users, helping us maintain a safe and positive environment for everyone.</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section {...sectionVariant} className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl shadow-lg text-center border border-purple-400">
            <h2 className="text-3xl font-bold text-white mb-4">What's Next? Video Calls!</h2>
            <p className="text-lg text-purple-100 mb-6">
              Get ready for a game-changer! In our next phase, we're excited to introduce a **video call feature, similar to Omegle.com**. You'll be able to have anonymous, one-on-one video chats with other verified students, taking your connections to a whole new level.
            </p>
            <p className="text-sm text-purple-200">
              Stay tuned for updates as we work to bring you more innovative ways to connect!
            </p>
          </motion.section>

          <motion.section {...sectionVariant} className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Join the Movement</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              IPU Friendlist is more than just an app; it's a growing community built by GGSIPU students, for GGSIPU students. Your feedback and engagement are what drive us forward. Let's make campus life more connected and fun, together!
            </p>
            <button
            //   onClick={() => setView('login')}
              className="mt-8 p-4 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-xl font-bold hover:opacity-90 transition-opacity transform hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              Start Connecting Now!
            </button>
          </motion.section>
        </main>
      </div>

      {/* Floating Login Button (re-used for consistency)
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/50 backdrop-blur-lg border-t border-white/10"
      >
        <button
          onClick={() => setView('login')}
          className="w-full max-w-md mx-auto p-4 flex justify-center items-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-xl font-bold hover:opacity-90 transition-opacity transform hover:scale-105 shadow-lg shadow-blue-500/20"
        >
          Login / Get Started
        </button>
      </motion.div> */}
    </div>
  );
};

export default AboutScreen;