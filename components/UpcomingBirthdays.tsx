'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import UserAvatar from './UserAvatar';
import LoadingDots from './LoadingDots';
import { format } from 'date-fns';

interface BirthdayEmployee {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  dateOfBirth: string;
  daysUntil: number;
}

export default function UpcomingBirthdays() {
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchUpcomingBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/upcoming-birthdays?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();

      if (res.ok) {
        setBirthdays(data.birthdays || []);
      } else {
        toast.error(data.error || 'Failed to fetch upcoming birthdays');
      }
    } catch (err: any) {
      toast.error('An error occurred while fetching upcoming birthdays');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUpcomingBirthdays();

    // Refetch when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUpcomingBirthdays();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refetch when window gains focus
    const handleFocus = () => {
      fetchUpcomingBirthdays();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUpcomingBirthdays]);

  const getBirthdayText = (daysUntil: number) => {
    if (daysUntil === 0) {
      return 'Today! 🎉';
    } else if (daysUntil === 1) {
      return 'Tomorrow';
    } else {
      return `${daysUntil} days`;
    }
  };

  const formatBirthdayDate = (dateOfBirth: string) => {
    try {
      const [year, month, day] = dateOfBirth.split('-').map(Number);
      return format(new Date(2000, month - 1, day), 'MMM dd');
    } catch (e) {
      return dateOfBirth;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full h-[500px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0 p-5 border-b border-pink-200/50 bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-primary font-bold text-white">Upcoming Birthdays</h2>
            <p className="text-xs text-white/90 font-secondary mt-0.5">
              {birthdays.length} {birthdays.length === 1 ? 'birthday' : 'birthdays'} • Celebrations
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingDots size="lg" className="mb-2" />
            <p className="text-sm text-gray-500 font-secondary mt-2">Loading birthdays...</p>
          </div>
        ) : birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-primary font-semibold text-gray-600 mb-1">No upcoming birthdays</p>
            <p className="text-sm text-gray-500 font-secondary">Birthdays will appear here</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {birthdays.map((employee, index) => {
              const birthdayText = getBirthdayText(employee.daysUntil);
              const isTodayBirthday = employee.daysUntil === 0;

              return (
                <motion.div
                  key={employee._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group bg-white rounded-xl border transition-all duration-200 p-3.5 relative shadow-sm ${
                    isTodayBirthday
                      ? 'border-pink-400 hover:border-pink-500 hover:shadow-xl bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 ring-2 ring-pink-200/50'
                      : 'border-gray-200 hover:border-pink-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className={`p-1 rounded-xl ${
                        isTodayBirthday ? 'bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-300' : 'bg-pink-50 border border-pink-100'
                      }`}>
                        <UserAvatar
                          name={employee.name}
                          image={employee.profileImage}
                          size="sm"
                        />
                      </div>
                      {isTodayBirthday && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 border-2 border-white rounded-full animate-pulse shadow-lg"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className={`text-sm font-primary font-bold truncate ${
                          isTodayBirthday ? 'text-pink-700' : 'text-gray-800'
                        }`}>
                          {employee.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-secondary whitespace-nowrap ${
                          isTodayBirthday
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                            : 'bg-pink-100 text-pink-700 border border-pink-200'
                        }`}>
                          {birthdayText}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[10px] text-gray-500 font-secondary">
                          {formatBirthdayDate(employee.dateOfBirth)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

