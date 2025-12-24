'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import LoadingDots from '@/components/LoadingDots';
import UserAvatar from '@/components/UserAvatar';
import DashboardLayout from '@/components/DashboardLayout';
import {
  IconGift,
  IconSearch,
  IconSend,
  IconCheck,
  IconClock,
  IconTrash,
  IconCalendar,
  IconUsers,
  IconMail,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconEye,
} from '@tabler/icons-react';

interface Employee {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  profileImage?: string;
}

interface ScheduledEmail {
  _id: string;
  subject: string;
  scheduledFor?: string;
  userIds: Array<{ _id: string; name: string; email: string; profileImage?: string }>;
  createdAt: string;
  sentAt?: string;
  sent: boolean;
}

export default function HrWishingPage() {
  const { data: session } = useSession();
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [htmlTab, setHtmlTab] = useState<'html' | 'preview'>('html');
  const [schedule, setSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [emailHistory, setEmailHistory] = useState<ScheduledEmail[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [expandedScheduled, setExpandedScheduled] = useState(true);
  const [processingScheduled, setProcessingScheduled] = useState(false);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'history'>('scheduled');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          // HR should be able to message employees (not admin)
          const filtered = (data.users || []).filter(
            (u: Employee & { role?: string }) => u && u.email && u.role !== 'admin'
          );
          setEmployees(filtered);
        } else {
          toast.error(data.error || 'Failed to load employees');
        }
      } catch (err) {
        console.error('Fetch employees error', err);
        toast.error('Could not load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
    fetchScheduledEmails();
  }, [toast]);

  // Auto-process scheduled emails every minute
  useEffect(() => {
    const processScheduledEmails = async () => {
      try {
        const res = await fetch('/api/hr/wishing/scheduled', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok && data.processed > 0) {
          // Refresh scheduled emails list
          fetchScheduledEmails();
        }
      } catch (err) {
        console.error('Error processing scheduled emails:', err);
      }
    };

    // Process immediately on mount
    processScheduledEmails();

    // Then process every minute
    const interval = setInterval(processScheduledEmails, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchScheduledEmails = async () => {
    try {
      setLoadingScheduled(true);
      const res = await fetch('/api/hr/wishing', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setScheduledEmails(data.scheduledEmails || []);
        setEmailHistory(data.emailHistory || []);
      }
    } catch (err) {
      console.error('Fetch scheduled emails error', err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const handleProcessScheduled = async () => {
    try {
      setProcessingScheduled(true);
      const res = await fetch('/api/hr/wishing/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.processed > 0) {
          toast.success(`✅ Processed ${data.processed} scheduled email(s). ${data.sent} email(s) sent successfully.`);
        } else {
          toast.info('No scheduled emails ready to send.');
        }
        fetchScheduledEmails();
      } else {
        toast.error(data.error || 'Failed to process scheduled emails.');
      }
    } catch (err) {
      console.error('Process scheduled emails error', err);
      toast.error('Could not process scheduled emails.');
    } finally {
      setProcessingScheduled(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        (emp.designation || '').toLowerCase().includes(term)
    );
  }, [employees, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(employees.map((e) => e._id)));
  };

  const clearAll = () => setSelectedIds(new Set());

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedIds.has(emp._id));

  const toggleSelectFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredEmployees.forEach((emp) => next.delete(emp._id));
      } else {
        filteredEmployees.forEach((emp) => next.add(emp._id));
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one employee.');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required.');
      return;
    }
    if (!htmlBody.trim()) {
      toast.error('HTML body is required.');
      return;
    }
    if (schedule && !scheduledFor) {
      toast.error('Please select a date and time for scheduling.');
      return;
    }
    if (schedule && new Date(scheduledFor) < new Date()) {
      toast.error('Scheduled date must be in the future.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/hr/wishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedIds),
          subject,
          html: htmlBody,
          schedule,
          scheduledFor: schedule ? scheduledFor : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (schedule) {
          toast.success(`Email scheduled for ${new Date(scheduledFor).toLocaleString()}.`);
          setSchedule(false);
          setScheduledFor('');
        } else {
          toast.success(`Email sent to ${selectedIds.size} recipient(s).`);
        }
        setSelectedIds(new Set());
        setSubject('');
        setHtmlBody('');
        fetchScheduledEmails();
      } else {
        toast.error(data.error || 'Failed to send/schedule emails.');
      }
    } catch (err) {
      console.error('Send wishing email error', err);
      toast.error('Could not send/schedule emails.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteScheduled = async (id: string, isHistory: boolean = false) => {
    if (!confirm(`Are you sure you want to delete this ${isHistory ? 'sent' : 'scheduled'} email?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hr/wishing/scheduled/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${isHistory ? 'Email history' : 'Scheduled email'} deleted.`);
        fetchScheduledEmails();
      } else {
        toast.error(data.error || 'Failed to delete email.');
      }
    } catch (err) {
      console.error('Delete email error', err);
      toast.error('Could not delete email.');
    }
  };

  const userName = session?.user?.name || 'HR';

  const formatTimeUntil = (date: string) => {
    const now = new Date();
    const scheduled = new Date(date);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <DashboardLayout role="hr">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <IconGift className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Send Wishes</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Main Content - Email Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Email Composition Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-2.5 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <IconMail className="w-4 h-4 text-primary" />
                  Compose Email
                </h2>
              </div>

              <div className="p-4 space-y-3">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <span>Subject</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Happy Diwali from HR!"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white hover:border-gray-300"
                  />
                </div>

                {/* HTML Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <span>HTML Body</span>
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setHtmlTab('html')}
                      className={`px-3 py-1.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${htmlTab === 'html'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <IconCode className="w-3.5 h-3.5" />
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlTab('preview')}
                      disabled={!htmlBody.trim()}
                      className={`px-3 py-1.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${htmlTab === 'preview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <IconEye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </div>

                  {/* Tab Content */}
                  {htmlTab === 'html' ? (
                    <>
                      <div className="h-[400px] border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition">
                        <textarea
                          value={htmlBody}
                          onChange={(e) => setHtmlBody(e.target.value)}
                          placeholder='Paste your HTML content here...'
                          className="w-full h-full px-3 py-2 text-sm font-mono outline-none bg-white resize-none overflow-y-auto border-0"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <IconCheck className="w-2.5 h-2.5" />
                        Supports HTML. Use <code className="bg-gray-100 px-1 rounded">${'{'}data.employeeName{'}'}</code> for personalized names
                      </p>
                    </>
                  ) : (
                    <div className="border border-gray-200 rounded-lg bg-white h-[400px] overflow-y-auto">
                      {htmlBody.trim() ? (
                        <div
                          className="prose max-w-none text-sm text-gray-800 p-4"
                          dangerouslySetInnerHTML={{ __html: htmlBody }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          <div className="text-center">
                            <IconSend className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No HTML content to preview</p>
                            <p className="text-[10px] mt-1">Switch to HTML tab to add content</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Schedule Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={schedule}
                        onChange={(e) => {
                          setSchedule(e.target.checked);
                          if (e.target.checked && !scheduledFor) {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(9, 0, 0, 0);
                            setScheduledFor(tomorrow.toISOString().slice(0, 16));
                          }
                        }}
                        className="w-4 h-4 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-blue-100 rounded group-hover:bg-blue-200 transition">
                          <IconClock className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-800">Schedule Email</span>
                      </div>
                    </label>
                  </div>

                  {schedule && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <IconCalendar className="w-3 h-3" />
                              Date
                            </label>
                            <input
                              type="date"
                              value={scheduledFor ? scheduledFor.split('T')[0] : ''}
                              onChange={(e) => {
                                const date = e.target.value;
                                const time = scheduledFor ? scheduledFor.split('T')[1] : '09:00';
                                setScheduledFor(date ? `${date}T${time}` : '');
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <IconClock className="w-3 h-3" />
                              Time
                            </label>
                            <input
                              type="time"
                              value={scheduledFor ? scheduledFor.split('T')[1] : ''}
                              onChange={(e) => {
                                const time = e.target.value;
                                const date = scheduledFor ? scheduledFor.split('T')[0] : new Date().toISOString().split('T')[0];
                                setScheduledFor(time ? `${date}T${time}` : '');
                              }}
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            />
                          </div>
                        </div>
                        {scheduledFor && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-[10px] text-gray-500 mb-0.5">Scheduled:</div>
                            <div className="text-xs font-semibold text-gray-900">
                              {new Date(scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              <span className="mx-1 text-gray-400">•</span>
                              {new Date(scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recipients Summary */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconUsers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {selectedIds.size} {selectedIds.size === 1 ? 'recipient' : 'recipients'} selected
                      </div>
                      <div className="text-xs text-gray-600">Choose employees from the right panel</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-white transition text-gray-700"
                      disabled={employees.length === 0}
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAll}
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-white transition text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold transition shadow-sm ${schedule
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-primary text-white hover:bg-primary/90'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {sending ? (
                    <>
                      <LoadingDots size="sm" />
                      {schedule ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : schedule ? (
                    <>
                      <IconCalendar className="w-5 h-5" />
                      Schedule Email
                    </>
                  ) : (
                    <>
                      <IconSend className="w-5 h-5" />
                      Send Email Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Employee Selection Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <IconUsers className="w-4 h-4 text-primary" />
                Recipients
              </h2>
            </div>

            <div className="flex flex-col flex-1 min-h-0 p-3">
              {/* Search */}
              <div className="relative flex-shrink-0 mb-2">
                <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-xs bg-white"
                />
              </div>

              {/* Select All Toggle */}
              <label className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-50 cursor-pointer transition flex-shrink-0 mb-2">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectFiltered}
                  className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs font-medium text-gray-700">Select all</span>
              </label>

              {/* Employee List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 max-h-[700px]">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <LoadingDots size="md" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-10">
                    <IconUsers className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No employees found</p>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const selected = selectedIds.has(emp._id);
                    return (
                      <label
                        key={emp._id}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-all flex-shrink-0 ${selected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(emp._id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer flex-shrink-0"
                        />
                        <UserAvatar name={emp.name} image={emp.profileImage} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                          {emp.designation && (
                            <p className="text-xs text-gray-600 mt-0.5 truncate">{emp.designation}</p>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email History & Scheduled Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2.5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded">
                  <IconMail className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Email History</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTab === 'scheduled' && (
                  <button
                    onClick={handleProcessScheduled}
                    disabled={processingScheduled}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-indigo-200 bg-white text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-50"
                    title="Manually process scheduled emails"
                  >
                    <IconRefresh className={`w-3 h-3 ${processingScheduled ? 'animate-spin' : ''}`} />
                    Process
                  </button>
                )}
                <button
                  onClick={() => setExpandedScheduled(!expandedScheduled)}
                  className="p-1 hover:bg-white/50 rounded transition"
                >
                  {expandedScheduled ? (
                    <IconChevronUp className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <IconChevronDown className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${activeTab === 'scheduled'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <IconClock className="w-3.5 h-3.5" />
                  <span>Scheduled</span>
                  {scheduledEmails.length > 0 && (
                    <span className="ml-1 px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                      {scheduledEmails.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <IconSend className="w-3.5 h-3.5" />
                  <span>Sent</span>
                  {emailHistory.length > 0 && (
                    <span className="ml-1 px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                      {emailHistory.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {expandedScheduled && (
            <div className="p-4">
              {loadingScheduled ? (
                <div className="flex justify-center py-8">
                  <LoadingDots size="md" />
                </div>
              ) : activeTab === 'scheduled' ? (
                scheduledEmails.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <IconClock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">No scheduled emails</p>
                    <p className="text-[10px] text-gray-500">Schedule an email to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduledEmails.map((email) => {
                      const scheduledDate = email.scheduledFor ? new Date(email.scheduledFor) : null;
                      const recipientCount = email.userIds?.length || 0;
                      const timeUntil = scheduledDate ? formatTimeUntil(email.scheduledFor!) : '';
                      const isOverdue = scheduledDate ? scheduledDate < new Date() : false;

                      return (
                        <div
                          key={email._id}
                          className={`border rounded-lg p-3 transition-all ${isOverdue
                            ? 'border-red-200 bg-red-50/50'
                            : 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 hover:shadow-sm'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <div className={`p-1.5 rounded ${isOverdue ? 'bg-red-100' : 'bg-indigo-100'}`}>
                                  <IconCalendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-600' : 'text-indigo-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xs font-bold text-gray-900 mb-1 truncate">{email.subject}</h3>
                                  {scheduledDate && (
                                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <IconClock className="w-3 h-3" />
                                        <span className="font-medium">
                                          {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="text-gray-500">
                                          {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {isOverdue ? 'Overdue' : `In ${timeUntil}`}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-2">
                                <IconUsers className="w-3 h-3" />
                                <span className="font-medium">{recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}</span>
                              </div>
                              {email.userIds && email.userIds.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {email.userIds.slice(0, 3).map((user: any) => (
                                    <span key={user._id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 text-[10px] font-medium text-gray-700 rounded">
                                      <UserAvatar name={user.name} image={user.profileImage} size="xs" />
                                      <span className="truncate max-w-[60px]">{user.name}</span>
                                    </span>
                                  ))}
                                  {email.userIds.length > 3 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-gray-200 text-[10px] font-medium text-gray-700 rounded">
                                      +{email.userIds.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteScheduled(email._id, false)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition flex-shrink-0"
                              title="Delete"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                emailHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <IconSend className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">No sent emails</p>
                    <p className="text-[10px] text-gray-500">Sent emails will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {emailHistory.map((email) => {
                      const sentDate = email.sentAt ? new Date(email.sentAt) : new Date(email.createdAt);
                      const recipientCount = email.userIds?.length || 0;

                      return (
                        <div
                          key={email._id}
                          className="border border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-lg p-3 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="p-1.5 bg-green-100 rounded">
                                  <IconCheck className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xs font-bold text-gray-900 mb-1 truncate">{email.subject}</h3>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <IconClock className="w-3 h-3" />
                                      <span className="font-medium">
                                        Sent {sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-gray-500">
                                        {sentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">
                                      Sent
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-2">
                                <IconUsers className="w-3 h-3" />
                                <span className="font-medium">{recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}</span>
                              </div>
                              {email.userIds && email.userIds.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {email.userIds.slice(0, 3).map((user: any) => (
                                    <span key={user._id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 text-[10px] font-medium text-gray-700 rounded">
                                      <UserAvatar name={user.name} image={user.profileImage} size="xs" />
                                      <span className="truncate max-w-[60px]">{user.name}</span>
                                    </span>
                                  ))}
                                  {email.userIds.length > 3 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-gray-200 text-[10px] font-medium text-gray-700 rounded">
                                      +{email.userIds.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteScheduled(email._id, true)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition flex-shrink-0"
                              title="Delete"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

