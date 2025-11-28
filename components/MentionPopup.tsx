'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, User as UserIcon } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface MentionUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  mobileNumber?: string;
  role: string;
  designation?: string;
}

interface MentionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: MentionUser | null;
  position?: { x: number; y: number };
}

export default function MentionPopup({
  isOpen,
  onClose,
  user,
  position,
}: MentionPopupProps) {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative bg-white rounded-xl shadow-2xl border border-gray-200 p-5 w-80 max-w-[90vw] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-primary font-bold text-gray-800">
              User Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Profile Image and Name */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-gray-200">
              <UserAvatar
                name={user.name}
                image={user.profileImage}
                size="xl"
                className="mb-3"
              />
              <h4 className="text-lg font-primary font-semibold text-gray-800 mb-1">
                {user.name}
              </h4>
              <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-secondary">
                {user.designation}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-secondary mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 font-secondary truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.mobileNumber && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-secondary mb-0.5">
                      Mobile Number
                    </p>
                    <p className="text-sm font-medium text-gray-900 font-secondary">
                      {user.mobileNumber}
                    </p>
                  </div>
                </div>
              )}

              {!user.mobileNumber && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-secondary mb-0.5">
                      Mobile Number
                    </p>
                    <p className="text-sm font-medium text-gray-400 font-secondary italic">
                      Not provided
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

