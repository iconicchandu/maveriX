'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, LogIn, LogOut, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import UserAvatar from './UserAvatar';
import LoadingDots from './LoadingDots';

interface Activity {
  type: 'clockIn' | 'clockOut' | 'leaveRequest';
  id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  timestamp: string;
  details: {
    date?: string;
    leaveType?: string;
    status?: string;
  };
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh activities every 5 seconds
    const interval = setInterval(() => {
      fetchActivities();
    }, 5000);

    // Refetch when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchActivities();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refetch when window gains focus
    const handleFocus = () => {
      fetchActivities();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/recent-activities?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'clockIn':
        return <LogIn className="w-3.5 h-3.5 text-green-600" />;
      case 'clockOut':
        return <LogOut className="w-3.5 h-3.5 text-red-600" />;
      case 'leaveRequest':
        return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'clockIn':
        return 'clocked in';
      case 'clockOut':
        return 'clocked out';
      case 'leaveRequest':
        return `requested ${activity.details.leaveType || 'leave'}`;
      default:
        return 'performed an action';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full h-[500px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0 p-5 border-b border-emerald-200/50 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-primary font-bold text-white">Recent Activity</h2>
            <p className="text-xs text-white/90 font-secondary mt-0.5">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} • Live updates
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingDots size="lg" className="mb-2" />
            <p className="text-sm text-gray-500 font-secondary mt-2">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-primary font-semibold text-gray-600 mb-1">No recent activities</p>
            <p className="text-sm text-gray-500 font-secondary">Activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-200 p-3.5 relative shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-xl shadow-sm ${
                      activity.type === 'clockIn' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' :
                      activity.type === 'clockOut' ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200' :
                      'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <UserAvatar
                        name={activity.userId.name}
                        image={activity.userId.profileImage}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-secondary leading-relaxed">
                          <span className="font-bold">{activity.userId.name}</span>{' '}
                          {getActivityText(activity)}
                          {activity.details.status && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              activity.details.status === 'approved' ? 'bg-green-100 text-green-700' :
                              activity.details.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {activity.details.status}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-secondary">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

