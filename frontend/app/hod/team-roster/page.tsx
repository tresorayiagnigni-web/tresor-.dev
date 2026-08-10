// app/hod/team-roster/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { HODLayout } from '@/app/layout/HodLayout';
import {
  Users,
  User,
  LogOut,
  Bell,
  Briefcase,
  Menu,
  X,
  ChevronRight,
  Trash2,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCircle,
  UserX,
  Eye,
  Search,
  Filter,
  Building,
  Award,
  FileText,
} from 'lucide-react';
import { getUsers, type User } from '@/lib/actions/userActions';
import { getTasks, type Task } from '@/lib/actions/taskActions';
import { getDepartmentById, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
interface Employee {
  id: number;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  employeeId: string;
  dateJoined: string;
  activeTasks: number;
  completedTasks: number;
  recentTasks: RecentTask[];
}

interface RecentTask {
  id: number;
  title: string;
  assignedDate: string;
  status: 'completed' | 'in-progress' | 'pending';
}

// ========== MAIN COMPONENT ==========
const HODTeamRosterPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState<boolean>(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>('');

  // HOD user info - In production, this would come from auth context
  const hodUserId = 1; // Placeholder - should come from auth
  const departmentId = 1; // Placeholder - should come from auth
  const hodName = 'Dr. Sarah Taylor';
  const hodInitials = 'ST';
  const departmentName = 'IT Architecture';

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch users
      const userResult = await getUsers();
      if (userResult.success && userResult.data) {
        setUsers(userResult.data);
      }

      // Fetch tasks
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        setTasks(taskResult.data);
      }

      // Fetch department
      const deptResult = await getDepartmentById(departmentId);
      if (deptResult.success && deptResult.data) {
        setDepartment(deptResult.data);
      }
    } catch (err) {
      setError('Failed to load team roster data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  // Get users in HOD's department
  const departmentUsers = users.filter(u => u.departmentId === department?.id);
  const departmentUserIds = departmentUsers.map(u => u.id).filter((id): id is number => id !== undefined);

  // Build employee objects
  const employeeList: Employee[] = departmentUsers.map(user => {
    const userTasks = tasks.filter(t => t.userId === user.id);
    const activeTasks = userTasks.filter(t => t.status !== 'Terminer').length;
    const completedTasks = userTasks.filter(t => t.status === 'Terminer').length;

    // Recent tasks (last 3)
    const recentTasks: RecentTask[] = userTasks.slice(0, 3).map(task => ({
      id: task.id!,
      title: task.titre || '',
      assignedDate: task.cree_le || new Date().toISOString(),
      status: task.status === 'Terminer' ? 'completed' : 
              task.status === 'En_cours' ? 'in-progress' : 'pending',
    }));

    return {
      id: user.id!,
      name: user.nom || 'Unknown',
      email: user.email || '',
      jobTitle: user.role === 'ADMIN' ? 'Administrator' : 
                 user.role === 'HOD' ? 'Head of Department' : 'Employee',
      department: user.departement || department?.nom_departement || 'Unassigned',
      employeeId: `EMP-${String(user.id!).padStart(4, '0')}`,
      dateJoined: user.createdAt || new Date().toISOString(),
      activeTasks,
      completedTasks,
      recentTasks,
    };
  });

  // ===== DERIVED STATE =====
  const filteredEmployees = employeeList.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== HELPER FUNCTIONS =====
  const getStatusBadge = (status: RecentTask['status']) => {
    const config = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Completed',
      },
      'in-progress': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'In Progress',
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Pending',
      },
    };
    return config[status];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openProfileDrawer = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsProfileDrawerOpen(true);
  };

  const closeProfileDrawer = () => {
    setIsProfileDrawerOpen(false);
    setSelectedEmployee(null);
  };

  const openRemoveModal = (employee: Employee) => {
    setEmployeeToRemove(employee);
    setConfirmationInput('');
    setIsRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    setIsRemoveModalOpen(false);
    setEmployeeToRemove(null);
    setConfirmationInput('');
  };

  const handleRemoveEmployee = () => {
    if (!employeeToRemove) return;
    if (confirmationInput !== employeeToRemove.name && confirmationInput !== 'CONFIRM') return;
    
    // In production, this would call an API to remove/offboard the employee
    // For now, we'll just filter them out of the local list
    setEmployees(employeeList.filter(emp => emp.id !== employeeToRemove.id));
    showSuccess(`Employee ${employeeToRemove.name} has been removed from the department.`);
    closeRemoveModal();
    loadData(); // Refresh data
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <HODLayout
        pageTitle="Departmental Team Roster & Administration"
        pageSubtitle="Loading team roster..."
        departmentName={departmentName}
        hodName={hodName}
        hodInitials={hodInitials}
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading team roster...</p>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <HODLayout
      pageTitle="Departmental Team Roster & Administration"
      pageSubtitle={`Unit Control Scope: ${department?.nom_departement || 'Department'} Staff Only`}
      departmentName={departmentName}
      hodName={hodName}
      hodInitials={hodInitials}
      showCreateButton={false}
    >
      {/* Success Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-white px-4 py-2 rounded-lg border border-[#E5E7EB]">
          <Users size={18} className="text-[#263A81]" />
          <span>Total Staff: <span className="font-semibold text-[#1F2937]">{employeeList.length}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-white px-4 py-2 rounded-lg border border-[#E5E7EB]">
          <CheckCircle size={18} className="text-green-600" />
          <span>Active: <span className="font-semibold text-[#1F2937]">
            {employeeList.filter(e => e.activeTasks > 0).length}
          </span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-white px-4 py-2 rounded-lg border border-[#E5E7EB]">
          <Clock size={18} className="text-blue-600" />
          <span>Total Tasks: <span className="font-semibold text-[#1F2937]">
            {tasks.filter(t => t.userId && departmentUserIds.includes(t.userId)).length}
          </span></span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 transition whitespace-nowrap">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {/* Personnel Directory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Employee Info</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Job Title</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Workload Metrics</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-[#6B7280] opacity-30" />
                      <p className="font-medium">No employees found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50/50 transition duration-150 cursor-pointer"
                    onClick={() => openProfileDrawer(employee)}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#263A81]/10 flex items-center justify-center text-[#263A81] font-semibold flex-shrink-0">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-[#1F2937] font-medium">{employee.name}</div>
                          <div className="text-xs text-[#6B7280] flex items-center gap-1">
                            <Mail size={12} />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5">
                        <Building size={14} className="text-[#6B7280]" />
                        <span className="text-[#1F2937]">{employee.jobTitle}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-[#6B7280]" />
                          <span className="font-medium text-[#1F2937]">{employee.activeTasks}</span>
                          <span className="text-[#6B7280]">active</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="font-medium text-[#1F2937]">{employee.completedTasks}</span>
                          <span className="text-[#6B7280]">completed</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProfileDrawer(employee);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition text-[#6B7280] hover:text-blue-600"
                          aria-label="View profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRemoveModal(employee);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition text-[#6B7280] hover:text-red-600"
                          aria-label="Remove employee"
                        >
                          <UserX size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PROFILE SLIDE-OUT DRAWER ===== */}
      {isProfileDrawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeProfileDrawer}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-[#1F2937]">Employee Profile</h2>
              <button
                onClick={closeProfileDrawer}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close drawer"
              >
                <X size={24} className="text-[#6B7280]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#263A81] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937]">{selectedEmployee.name}</h3>
                  <p className="text-[#6B7280]">{selectedEmployee.jobTitle}</p>
                  <p className="text-sm text-[#6B7280] flex items-center gap-1">
                    <Mail size={14} />
                    {selectedEmployee.email}
                  </p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FEFEFC] rounded-xl border border-[#E5E7EB] p-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Departmental ID
                  </label>
                  <p className="text-[#1F2937] font-medium mt-1">{selectedEmployee.employeeId}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Date Joined
                  </label>
                  <p className="text-[#1F2937] font-medium mt-1">{formatDate(selectedEmployee.dateJoined)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Total Completed Tasks
                  </label>
                  <p className="text-[#1F2937] font-medium mt-1">{selectedEmployee.completedTasks}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Active Tasks
                  </label>
                  <p className="text-[#1F2937] font-medium mt-1">{selectedEmployee.activeTasks}</p>
                </div>
              </div>

              {/* Recent Task History */}
              <div>
                <h4 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#263A81]" />
                  Recent Task History
                </h4>
                <div className="space-y-3">
                  {selectedEmployee.recentTasks.length === 0 ? (
                    <p className="text-[#6B7280] text-sm">No recent tasks assigned.</p>
                  ) : (
                    selectedEmployee.recentTasks.map((task) => {
                      const statusConfig = getStatusBadge(task.status);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-[#FEFEFC] border border-[#E5E7EB] rounded-lg"
                        >
                          <div>
                            <p className="text-[#1F2937] font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-[#6B7280] flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(task.assignedDate)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== REMOVE EMPLOYEE CONFIRMATION MODAL ===== */}
      {isRemoveModalOpen && employeeToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX size={24} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937]">Remove Employee Account</h2>
                  <p className="text-sm text-[#6B7280] mt-0.5">This action is irreversible</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Warning:</span> You are about to remove <strong>{employeeToRemove.name}</strong> from the department.
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>Account access will be immediately revoked</li>
                  <li>All active tasks will be reassigned</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <div>
                <label htmlFor="confirmationInput" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Type the employee&apos;s name or &quot;CONFIRM&quot; to proceed
                </label>
                <input
                  type="text"
                  id="confirmationInput"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Enter employee name or CONFIRM"
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  autoFocus
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Type &quot;{employeeToRemove.name}&quot; or &quot;CONFIRM&quot; to unlock removal
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0 border-t border-[#E5E7EB]">
              <button
                onClick={closeRemoveModal}
                className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveEmployee}
                disabled={confirmationInput !== employeeToRemove.name && confirmationInput !== 'CONFIRM' || isSubmitting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </HODLayout>
  );
};

export default HODTeamRosterPage;