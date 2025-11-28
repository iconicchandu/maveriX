'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function PagePreloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide preloader when page is fully loaded
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      // Small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            {/* Preloader Image */}
            <div className="relative w-32 h-32 mb-6">
              <Image
                src="/assets/preloader.png"
                alt="Loading"
                width={128}
                height={128}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Bouncing Dots */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-3 h-3 bg-primary rounded-full"
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

