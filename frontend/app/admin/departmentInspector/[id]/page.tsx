// app/admin/department-inspector/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/app/layout/AppLayout';
import {
  Users,
  User,
  Building,
  Mail,
  UserCog,
  Search,
  Database,
  Activity,
  UserCheck,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getDepartmentById } from '@/lib/actions/departmentActions';
import { getUsers, type User as ApiUser } from '@/lib/actions/userActions';
import { getTasks, type Task } from '@/lib/actions/taskActions';
import { formatDate } from '@/lib/helpers/adminHelpers';

// ========== TYPE DEFINITIONS ==========
interface Department {
  id?: number;
  nom_departement: string;
  chef_departementId?: number;
  description?: string;
  cree_le?: string;
  isActive?: boolean;
  code?: string;
}

// ========== MAIN COMPONENT ==========
const DepartmentInspectorPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===== LOAD DATA =====
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch department details
      const deptResult = await getDepartmentById(parseInt(departmentId));
      if (deptResult.success && deptResult.data) {
        setDepartment(deptResult.data);
      } else {
        setError(deptResult.message || 'Failed to load department');
      }

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
    } catch (err) {
      setError('Failed to load data');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (departmentId) {
      loadData();
    }
  }, [departmentId]);

  // ===== DERIVED STATE =====
  // Get HOD details
  const hod = department?.chef_departementId 
    ? users.find(u => u.id === department.chef_departementId) 
    : null;

  // Get employees in this department
  const employees = users.filter(u => u.departmentId === department?.id);

  // Get tasks for users in this department
  const employeeIds = employees.map(e => e.id).filter((id): id is number => id !== undefined);
  const departmentTasks = tasks.filter(t => t.userId && employeeIds.includes(t.userId));

  // Calculate stats
  const totalEmployees = employees.length;
  const totalActiveTasks = departmentTasks.filter(t => t.status !== 'Terminer').length;
  const hodStatus = hod?.status === true || hod?.status === 'true' ? 'active' : 'inactive';

  // Filtered employees for search
  const filteredEmployees = employees.filter(emp =>
    (emp.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== HELPER FUNCTIONS =====
  const getStatusBadge = (status: 'active' | 'inactive' | boolean | undefined) => {
    const isActive = status === true || status === 'active';
    const config = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <UserCheck size={14} className="mr-1" />,
        label: 'Active',
      },
      inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Inactive',
      },
    };
    return isActive ? config.active : config.inactive;
  };

  const getTaskStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'A_faire': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'To Do' },
      'En_cours': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      'Terminer': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    };
    return config[status] || config['A_faire'];
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'Bas': { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
      'Moyen': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Medium' },
      'Elevee': { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
    };
    return config[priority] || config['Moyen'];
  };

  const handleGoBack = () => {
    router.push('/admin/departments');
  };

  const navigateToUserProfile = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <AppLayout
        pageTitle="Department Inspector"
        pageSubtitle="Loading department details..."
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading department information...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <AppLayout
        pageTitle="Department Inspector"
        pageSubtitle="Error loading department"
        showCreateButton={false}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle size={64} className="text-red-500 opacity-50 mb-4" />
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">Error Loading Department</h3>
          <p className="text-[#6B7280] mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition"
          >
            <ArrowLeft size={18} />
            Back to Departments
          </button>
        </div>
      </AppLayout>
    );
  }

  // ===== NOT FOUND STATE =====
  if (!department) {
    return (
      <AppLayout
        pageTitle="Department Not Found"
        pageSubtitle="The department you're looking for doesn't exist"
        showCreateButton={false}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Building size={64} className="text-[#6B7280] opacity-30 mb-4" />
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">Department Not Found</h3>
          <p className="text-[#6B7280] mb-6">The department you're looking for may have been removed or doesn't exist.</p>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#263A81] text-white font-medium rounded-lg hover:bg-[#1e2f6a] transition"
          >
            <ArrowLeft size={18} />
            Back to Departments
          </button>
        </div>
      </AppLayout>
    );
  }

  // ===== RENDER =====
  return (
    <AppLayout
      pageTitle={department.nom_departement || 'Department'}
      pageSubtitle={`${department.code || 'No Code'} · ${department.description || 'No description'}`}
      showCreateButton={false}
    >
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-[#6B7280] hover:text-[#263A81] transition mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Departments</span>
      </button>

      {/* Department Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Employees</p>
              <p className="text-3xl font-bold text-[#1F2937] mt-1">{totalEmployees}</p>
            </div>
            <div className="p-3 bg-[#263A81]/10 rounded-lg">
              <Users size={24} className="text-[#263A81]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Active Tasks</p>
              <p className="text-3xl font-bold text-[#1F2937] mt-1">{totalActiveTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-[#6B7280]">
            Across {totalEmployees} employees
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">HOD Status</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(hodStatus).bg} ${getStatusBadge(hodStatus).text}`}
                >
                  {getStatusBadge(hodStatus).icon}
                  {getStatusBadge(hodStatus).label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCog size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* HOD Details */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCog size={20} className="text-[#263A81]" />
          <h3 className="font-semibold text-[#1F2937]">Head of Department</h3>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#263A81] flex items-center justify-center text-white font-bold text-lg">
              {hod?.nom?.split(' ').map(n => n[0]).join('') || 'N/A'}
            </div>
            <div>
              <p className="font-semibold text-[#1F2937] text-lg">{hod?.nom || 'Unassigned'}</p>
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Mail size={14} />
                <span>{hod?.email || 'No email'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div>
              <p className="text-xs text-[#6B7280]">Activity Count</p>
              <p className="text-2xl font-bold text-[#1F2937]">
                {tasks.filter(t => t.userId === hod?.id).length}
              </p>
            </div>
            <div className="w-px h-10 bg-[#E5E7EB]"></div>
            <div>
              <p className="text-xs text-[#6B7280]">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(hodStatus).bg} ${getStatusBadge(hodStatus).text}`}
              >
                {getStatusBadge(hodStatus).icon}
                {getStatusBadge(hodStatus).label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Personnel Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Database size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Unit Personnel</h2>
              <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                {totalEmployees} employees
              </span>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search personnel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Employee</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Email</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Role</th>
                <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Active Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-[#6B7280] opacity-30" />
                      <p className="font-medium">No personnel found</p>
                      <p className="text-sm">Try adjusting your search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const userTasks = tasks.filter(t => t.userId === employee.id);
                  const activeTasks = userTasks.filter(t => t.status !== 'Terminer').length;

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50/50 transition duration-150 cursor-pointer group"
                      onClick={() => navigateToUserProfile(employee.id!)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#263A81]/10 flex items-center justify-center text-[#263A81] font-semibold flex-shrink-0">
                            {employee.nom?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <span className="font-medium text-[#1F2937] group-hover:text-[#263A81] transition-colors flex items-center gap-2">
                            {employee.nom || 'Unknown'}
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#263A81]" />
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280]">
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-[#6B7280]" />
                          <span>{employee.email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          employee.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                          employee.role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.role === 'ADMIN' ? 'Admin' :
                           employee.role === 'HOD' ? 'HOD' : 'Employee'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {activeTasks} {activeTasks === 1 ? 'task' : 'tasks'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Tasks Section */}
      {departmentTasks.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <Activity size={24} className="text-[#263A81]" />
              <h2 className="text-xl font-bold text-[#1F2937]">Department Tasks</h2>
              <span className="text-sm text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
                {departmentTasks.length} tasks
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Task Title</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Assigned To</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Status</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Priority</th>
                  <th className="text-left py-3.5 px-6 text-[#6B7280] font-semibold tracking-wide">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {departmentTasks.slice(0, 10).map((task) => {
                  const assignedUser = users.find(u => u.id === task.userId);
                  const statusConfig = getTaskStatusBadge(task.status || 'A_faire');
                  const priorityConfig = getPriorityBadge(task.priorite || 'Moyen');

                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-3.5 px-6">
                        <span className="font-medium text-[#1F2937]">{task.titre}</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280]">
                        {assignedUser?.nom || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}>
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[#6B7280]">
                        {task.Date_limite ? new Date(task.Date_limite).toLocaleDateString() : 'No date'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {departmentTasks.length > 10 && (
              <div className="p-4 text-center text-sm text-[#6B7280] border-t border-[#E5E7EB]">
                Showing 10 of {departmentTasks.length} tasks
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
};

export default DepartmentInspectorPage;