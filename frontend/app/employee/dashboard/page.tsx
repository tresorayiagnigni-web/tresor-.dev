// app/employee/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { EmployeeLayout } from '@/app/layout/employeeLayout';
import {
  CheckSquare,
  Clock,
  Bell,
  Calendar,
} from 'lucide-react';
import { getTasks, type Task } from '@/lib/actions/taskActions';
import { getUserById, type User } from '@/lib/actions/userActions';

// ========== TYPE DEFINITIONS ==========
interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

// ========== MAIN COMPONENT ==========
const EmployeeWorkspaceDashboardV2: React.FC = () => {
  // ===== EMPLOYEE INFO =====
  // In production, this would come from auth context
  const employeeId = 2; // Placeholder - John Doe
  const employeeName = 'John Doe';
  const employeeInitials = 'JD';
  const employeeRole = 'Senior Developer';

  // ===== STATE MANAGEMENT =====
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Attendance State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [hoursWorked, setHoursWorked] = useState<number>(0);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Announcements Data (static - would come from API in production)
  const announcements: Announcement[] = [
    {
      id: 1,
      title: 'Updated Health & Safety Policy',
      date: 'March 15, 2026',
      content:
        'Please review the updated workplace safety guidelines. New protocols for remote work and office hygiene have been implemented effective immediately.',
    },
    {
      id: 2,
      title: 'Performance Review Cycle Q2 2026',
      date: 'March 12, 2026',
      content:
        'The Q2 performance review cycle will begin on April 1st. Managers are requested to schedule review meetings with their team members.',
    },
    {
      id: 3,
      title: 'System Maintenance Notice',
      date: 'March 10, 2026',
      content:
        'HRMS platform will undergo scheduled maintenance on March 20th from 2:00 AM to 6:00 AM EST. Please plan your work accordingly.',
    },
  ];

  // ===== LOAD DATA =====
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch user data
      const userResult = await getUserById(employeeId);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
      }

      // Fetch tasks assigned to this employee
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        const userTasks = taskResult.data.filter(t => t.userId === employeeId);
        setTasks(userTasks);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  const pendingTasks = tasks.filter(task => task.status !== 'Terminer').length;
  const completedTasks = tasks.filter(task => task.status === 'Terminer').length;
  const inProgressTasks = tasks.filter(task => task.status === 'En_cours').length;

  // ===== EFFECTS =====
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockedIn && clockInTime) {
      interval = setInterval(() => {
        setHoursWorked(prev => prev + 1);
      }, 1000);
    } else if (!isClockedIn && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, clockInTime]);

  // ===== EVENT HANDLERS =====
  const handleClockToggle = () => {
    if (!isClockedIn) {
      setIsClockedIn(true);
      setClockInTime(new Date());
      setHoursWorked(0);
    } else {
      setIsClockedIn(false);
      setClockInTime(null);
    }
  };

  const formatHoursWorked = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'A_faire': 'Pending',
      'En_cours': 'In Progress',
      'Terminer': 'Completed',
    };
    return map[status] || status;
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="Dashboard"
        pageSubtitle="Loading your workspace..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading dashboard...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <EmployeeLayout
        pageTitle="Dashboard"
        pageSubtitle="Error loading data"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-500 text-center">
            <p className="text-lg font-medium">Error Loading Dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <EmployeeLayout
      pageTitle="Dashboard"
      pageSubtitle={`Welcome back, ${user?.nom || employeeName}. Here's your workspace overview.`}
      employeeName={user?.nom || employeeName}
      employeeInitials={employeeInitials}
      employeeRole={user?.role === 'HOD' ? 'Head of Department' : 
                    user?.role === 'ADMIN' ? 'Administrator' : 
                    'Employee'}
    >
      <div className="space-y-6">
        {/* ===== ATTENDANCE TRACKER ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg transition-colors ${
                isClockedIn ? 'bg-green-100' : 'bg-[#263A81]/10'
              }`}>
                <Clock size={28} className={isClockedIn ? 'text-green-600' : 'text-[#263A81]'} />
              </div>
              <div>
                <div className="text-sm font-medium text-[#6B7280]">
                  Hours Worked Today
                </div>
                <div className="text-3xl font-bold text-[#1F2937] font-mono">
                  {formatHoursWorked(hoursWorked)}
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isClockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></span>
                    Status: {isClockedIn ? 'On the Clock' : 'Off the Clock'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClockToggle}
              className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all duration-200 active:scale-95 ${
                isClockedIn
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100'
                  : 'bg-[#263A81] hover:bg-[#1e2f6a] shadow-lg shadow-[#263A81]/20'
              }`}
            >
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </section>

        {/* ===== TASK SUMMARY MATRIX ===== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">Pending Tasks</div>
                <div className="text-3xl font-bold text-[#1F2937] mt-1">{pendingTasks}</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckSquare size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">In Progress</div>
                <div className="text-3xl font-bold text-[#1F2937] mt-1">{inProgressTasks}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#6B7280]">Completed Tasks</div>
                <div className="text-3xl font-bold text-[#1F2937] mt-1">{completedTasks}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckSquare size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== TASK LIST ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckSquare size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Current Tasks</h2>
            </div>
            <span className="text-sm text-[#6B7280]">
              {tasks.length} total · {pendingTasks} pending
            </span>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">
                <p>No tasks assigned to you yet.</p>
              </div>
            ) : (
              tasks.map(task => {
                const isCompleted = task.status === 'Terminer';
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                      isCompleted ? 'border-green-200 bg-green-50/50' : 'border-[#E5E7EB] hover:border-[#263A81]/20 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className={`font-medium ${isCompleted ? 'text-[#6B7280] line-through' : 'text-[#1F2937]'}`}>
                        {task.titre}
                      </div>
                      <div className="text-sm text-[#6B7280] flex items-center gap-2 flex-wrap">
                        <Calendar size={14} />
                        <span>Due: {formatDate(task.Date_limite)}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getStatusLabel(task.status || 'A_faire')}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ===== ANNOUNCEMENTS ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Company Announcements</h2>
          </div>

          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div key={announcement.id} className={`pb-4 ${index < announcements.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-[#1F2937]">{announcement.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Calendar size={14} />
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed">{announcement.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </EmployeeLayout>
  );
};

export default EmployeeWorkspaceDashboardV2;