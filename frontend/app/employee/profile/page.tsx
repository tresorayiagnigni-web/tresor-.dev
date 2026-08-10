// app/employee/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { EmployeeLayout } from '@/app/layout/employeeLayout';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { getUserById, type User } from '@/lib/actions/userActions';
import { getTasks, type Task } from '@/lib/actions/taskActions';
import { getDepartmentById, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
type RequestType = 'leave' | 'expense';

interface Request {
  id: string;
  date: string;
  type: string;
  details: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface FormData {
  type: RequestType;
  startDate: string;
  endDate: string;
  amount: string;
  comment: string;
}

// ========== MAIN COMPONENT ==========
const EmployeeProfilePage: React.FC = () => {
  // ===== EMPLOYEE INFO - WILL BE FETCHED FROM API =====
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('Loading...');
  const [employeeInitials, setEmployeeInitials] = useState<string>('??');
  const [employeeRole, setEmployeeRole] = useState<string>('Loading...');

  // ===== STATE MANAGEMENT =====
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: 'leave',
    startDate: '',
    endDate: '',
    amount: '',
    comment: '',
  });

  // ===== MOCK REQUESTS DATA =====
  const [requests] = useState<Request[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      type: 'Salary Advance',
      details: 'Emergency advance - $5,000',
      status: 'approved',
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      type: 'Leave Request',
      details: 'Annual leave - 5 days',
      status: 'pending',
    },
    {
      id: '3',
      date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
      type: 'Expense Claim',
      details: 'Travel reimbursement - $350',
      status: 'approved',
    },
    {
      id: '4',
      date: new Date(Date.now() - 86400000 * 20).toISOString().split('T')[0],
      type: 'Leave Request',
      details: 'Sick leave - 2 days',
      status: 'approved',
    },
  ]);

  // ===== LOAD DATA =====
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get employee ID from cookies or localStorage
      // For now, using a placeholder - in production, get from auth context
      const userId = 2; // This should come from your auth context
      setEmployeeId(userId);

      // Fetch user data
      const userResult = await getUserById(userId);
      if (userResult.success && userResult.data) {
        const userData = userResult.data;
        setUser(userData);
        
        // Update employee info from API
        setEmployeeName(userData.nom || 'Unknown');
        setEmployeeInitials(
          userData.nom?.split(' ').map(n => n[0]).join('') || '??'
        );
        setEmployeeRole(
          userData.role === 'HOD' ? 'Head of Department' : 
          userData.role === 'ADMIN' ? 'Administrator' : 
          'Employee'
        );

        // Fetch department if user has departmentId
        if (userData.departmentId) {
          const deptResult = await getDepartmentById(userData.departmentId);
          if (deptResult.success && deptResult.data) {
            setDepartment(deptResult.data);
          }
        }
      } else {
        setError(userResult.message || 'Failed to load user profile');
      }

      // Fetch tasks to get task count
      const taskResult = await getTasks();
      if (taskResult.success && taskResult.data) {
        const userTasks = taskResult.data.filter(t => t.userId === userId);
        setTasks(userTasks);
      }
    } catch (err) {
      setError('Failed to load profile data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== DERIVED STATE =====
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Terminer').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Terminer').length;
  
  const userStatus = user?.status === 'true' || user?.status === true;
  const userPhone = user?.telephone || 'Not provided';
  const userDepartment = department?.nom_departement || user?.departement || 'Not assigned';
  const userEmail = user?.email || 'No email on file';

  // ===== EVENT HANDLERS =====
  const openModal = () => {
    setFormData({
      type: 'leave',
      startDate: '',
      endDate: '',
      amount: '',
      comment: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSuccessMessage('Request submitted successfully!');
      setIsSubmitting(false);
      closeModal();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }, 1000);
  };

  // ===== HELPER FUNCTIONS =====
  const getStatusBadge = (status: Request['status']) => {
    const config = {
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Approved',
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Pending',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Rejected',
      },
    };
    return config[status];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="My Profile"
        pageSubtitle="Loading your profile..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading profile...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <EmployeeLayout
        pageTitle="My Profile"
        pageSubtitle="Error loading profile"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-500 text-center">
            <p className="text-lg font-medium">Error Loading Profile</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-[#263A81] text-white rounded-lg hover:bg-[#1e2f6a] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <EmployeeLayout
      pageTitle="My Profile"
      pageSubtitle="View your employee information and manage requests."
      employeeName={employeeName}
      employeeInitials={employeeInitials}
      employeeRole={employeeRole}
    >
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="space-y-6 w-full">
        {/* ===== EMPLOYEE IDENTITY CARD ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-6 shadow-sm w-full box-border">
          <div className="flex flex-col sm:flex-row lg:flex-row gap-6 items-center sm:items-start">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#263A81] flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-sm">
                {employeeInitials}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Full Name
                </label>
                <p className="text-[#1F2937] font-medium break-words">{employeeName}</p>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Job Title
                </label>
                <p className="text-[#1F2937] font-medium break-words">{employeeRole}</p>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Assigned Department
                </label>
                <p className="text-[#1F2937] font-medium break-words">{userDepartment}</p>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Corporate Email
                </label>
                <p className="text-[#1F2937] font-medium break-all select-all">{userEmail}</p>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Phone Number
                </label>
                <p className="text-[#1F2937] font-medium break-words">{userPhone}</p>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-[#6B7280] mb-1">
                  Account Status
                </label>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  userStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TASK SUMMARY ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-6 shadow-sm w-full box-border">
          <h2 className="text-xl font-bold text-[#1F2937] mb-4">Task Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FEFEFC] rounded-lg border border-[#E5E7EB] p-4 text-center">
              <p className="text-2xl font-bold text-[#1F2937]">{totalTasks}</p>
              <p className="text-sm text-[#6B7280]">Total Tasks</p>
            </div>
            <div className="bg-[#FEFEFC] rounded-lg border border-[#E5E7EB] p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingTasks}</p>
              <p className="text-sm text-[#6B7280]">Pending</p>
            </div>
            <div className="bg-[#FEFEFC] rounded-lg border border-[#E5E7EB] p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              <p className="text-sm text-[#6B7280]">Completed</p>
            </div>
          </div>
        </section>

        {/* ===== REQUEST CONSOLE ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-6 shadow-sm w-full box-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1F2937]">Request Console</h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Submit new requests for approval
              </p>
            </div>
            <button
              onClick={openModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20 w-full sm:w-auto self-start sm:self-center text-sm"
            >
              <Plus size={18} />
              Submit New Request
            </button>
          </div>

          {/* ===== HISTORICAL REQUESTS TABLE ===== */}
          <div className="mt-6 w-full overflow-hidden">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Historical Requests
            </h3>
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] w-full">
              <table className="w-full text-sm min-w-[600px] table-auto">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                    <th className="text-left py-3.5 px-4 text-[#6B7280] font-semibold tracking-wide">Date</th>
                    <th className="text-left py-3.5 px-4 text-[#6B7280] font-semibold tracking-wide">Request Type</th>
                    <th className="text-left py-3.5 px-4 text-[#6B7280] font-semibold tracking-wide">Details</th>
                    <th className="text-left py-3.5 px-4 text-[#6B7280] font-semibold tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {requests.map((request) => {
                    const statusConfig = getStatusBadge(request.status);
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50/50 transition duration-150"
                      >
                        <td className="py-3.5 px-4 text-[#1F2937] font-medium whitespace-nowrap">
                          {formatDate(request.date)}
                        </td>
                        <td className="py-3.5 px-4 text-[#1F2937] font-medium whitespace-nowrap">{request.type}</td>
                        <td className="py-3.5 px-4 text-[#6B7280] max-w-[240px] truncate">{request.details}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* ===== MODAL OVERLAY ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-bold text-[#1F2937]">Submit New Request</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="requestType"
                  className="block text-sm font-medium text-[#1F2937] mb-1"
                >
                  Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="requestType"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                >
                  <option value="leave">Leave Request</option>
                  <option value="expense">Salary Advance / Expense Claim</option>
                </select>
              </div>

              {formData.type === 'leave' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-[#1F2937] mb-1"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition text-sm"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-[#1F2937] mb-1"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleFormChange}
                      className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition text-sm"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {formData.type === 'expense' && (
                <div className="animate-fade-in">
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-[#1F2937] mb-1"
                  >
                    Requested Amount (CFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    step="100"
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-[#1F2937] mb-1"
                >
                  Comment / Description
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Provide additional details about your request..."
                  className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </EmployeeLayout>
  );
};

export default EmployeeProfilePage;