'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, CheckCircle, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';
import UserAvatar from './UserAvatar';
import LoadingDots from './LoadingDots';

interface PendingEmployee {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  profileImage?: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function PendingEmployees() {
  const [employees, setEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const toast = useToast();

  const fetchPendingEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees/pending');
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      } else {
        toast.error(data.error || 'Failed to fetch pending employees');
      }
    } catch (err: any) {
      console.error('Error fetching pending employees:', err);
      toast.error('Failed to load pending employees');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingEmployees();
    // Refresh every 10 seconds
    const interval = setInterval(fetchPendingEmployees, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingEmployees]);

  const handleApprove = async (employeeId: string) => {
    setApproving(employeeId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Employee ${data.employee.name} approved successfully!`);
        // Remove the approved employee from the list immediately
        setEmployees((prev) => prev.filter((emp) => emp._id !== employeeId));
        // Also refresh the list to ensure consistency
        fetchPendingEmployees();
      } else {
        toast.error(data.error || 'Failed to approve employee');
      }
    } catch (err: any) {
      console.error('Error approving employee:', err);
      toast.error('Failed to approve employee');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-primary font-semibold text-gray-800">Pending Approvals</h2>
            <p className="text-xs text-gray-500 font-secondary">Employees waiting for approval</p>
          </div>
        </div>
        {employees.length > 0 && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold font-secondary">
            {employees.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <LoadingDots size="lg" className="mb-2" />
          <p className="text-sm text-gray-500 font-secondary mt-2">Loading...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-secondary">No pending approvals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {employees.map((employee, index) => (
            <motion.div
              key={employee._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200/50 hover:border-yellow-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={employee.name}
                  image={employee.profileImage}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-primary font-semibold text-gray-800 truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs text-gray-600 font-secondary truncate">
                    {employee.email}
                  </p>
                  <p className="text-xs text-gray-400 font-secondary mt-1">
                    Registered {format(new Date(employee.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleApprove(employee._id)}
                  disabled={approving === employee._id}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow font-secondary font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approving === employee._id ? (
                    <>
                      <LoadingDots size="sm" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Approve</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

