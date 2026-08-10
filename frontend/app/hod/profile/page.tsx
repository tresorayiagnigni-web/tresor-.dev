// app/hod/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {  HODLayout } from '@/app/layout/HodLayout';
import {
  Save,
  Key,
  Mail,
  Phone,
  Building,
  Shield,
  Globe,
  UserCircle,
  Settings,
  Lock,
  AlertCircle,
  CheckCircle,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { getUserById, updateUser, type User } from '@/lib/actions/userActions';
import { getDepartmentById, type Department } from '@/lib/actions/departmentActions';

// ========== TYPE DEFINITIONS ==========
interface ProfileFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ========== MAIN COMPONENT ==========
const HODProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [department, setDepartment] = useState<Department | null>(null);
  
  // ========== HOD USER INFO ==========
  // In production, this would come from auth context
  const hodUserId = 1; // Placeholder - should come from auth
  const departmentId = 1; // Placeholder - should come from auth

  // ========== FORM STATE ==========
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ========== LOAD DATA ==========
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch HOD user data
      const userResult = await getUserById(hodUserId);
      if (userResult.success && userResult.data) {
        const user = userResult.data;
        setFormData(prev => ({
          ...prev,
          fullName: user.nom || '',
          email: user.email || '',
          phoneNumber: user.telephone || '',
        }));
      }

      // Fetch department data
      const deptResult = await getDepartmentById(departmentId);
      if (deptResult.success && deptResult.data) {
        setDepartment(deptResult.data);
      }
    } catch (err) {
      setError('Failed to load profile data');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========== HELPER FUNCTIONS ==========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 4000);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate passwords if they are being changed
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Update user profile
      const updateData: any = {
        nom: formData.fullName,
        email: formData.email,
        telephone: formData.phoneNumber,
      };

      // Only include password if it's being changed
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
        // Note: Current password verification should be handled by the backend
      }

      const result = await updateUser(hodUserId, updateData);
      
      if (result.success) {
        showSuccess('Profile updated successfully!');
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    }

    setIsSubmitting(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    // Clear cookies and redirect to login
    document.cookie = 'my_secret_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <HODLayout
        pageTitle="My Profile & Administrative Settings"
        pageSubtitle="Loading profile..."
        showCreateButton={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#263A81] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading profile...</p>
          </div>
        </div>
      </HODLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <HODLayout
      pageTitle="My Profile & Administrative Settings"
      pageSubtitle="Manage your personal credentials and department administration settings"
      showCreateButton={false}
    >
      {/* Success Banner */}
      {showSuccessBanner && (
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

      <div className="space-y-6">
        {/* ===== HOD PERSONAL PROFILE & CREDENTIALS ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle size={24} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Personal Credentials</h2>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#1F2937] mb-1">
                Contact Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Update Section */}
            <div className="pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={20} className="text-[#263A81]" />
                <h3 className="text-base font-semibold text-[#1F2937]">Security Account Password</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#1F2937] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1F2937] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">
                Leave password fields blank to keep current password. Current password is required to change.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#263A81] text-white font-bold rounded-lg hover:bg-[#1e2f6a] transition-all duration-200 active:scale-95 shadow-lg shadow-[#263A81]/20 w-full md:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ===== DEPARTMENT METADATA PANEL ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Building size={24} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Department Metadata</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Department Name
                </label>
                <p className="text-[#1F2937] font-medium mt-1 flex items-center gap-2">
                  <Building size={16} className="text-[#263A81]" />
                  {department?.nom_departement || 'Loading...'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Department Code
                </label>
                <p className="text-[#1F2937] font-medium mt-1 flex items-center gap-2">
                  <Shield size={16} className="text-[#263A81]" />
                  {department?.code || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Department Description
                </label>
                <p className="text-[#1F2937] font-medium mt-1">
                  {department?.description || 'No description available'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Structural Level
                </label>
                <p className="text-[#1F2937] font-medium mt-1 flex items-center gap-2">
                  <Globe size={16} className="text-[#263A81]" />
                  Senior Department Management
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Scope of Authority
                </label>
                <div className="mt-1 p-3 bg-[#FEFEFC] border border-[#E5E7EB] rounded-lg">
                  <p className="text-sm text-[#1F2937]">
                    Authorized for Personnel Offboarding, Task CRUD, and Task Allocation within {department?.nom_departement || 'your department'}.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                  Department Status
                </label>
                <p className="text-[#1F2937] font-medium mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    department?.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {department?.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SESSION MANAGEMENT ===== */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings size={24} className="text-[#263A81]" />
            <h2 className="text-xl font-bold text-[#1F2937]">Session Management</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-red-50/50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <LogOutIcon size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1F2937]">End Current Session</p>
                <p className="text-sm text-[#6B7280]">Securely log out of your current session</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all duration-200 active:scale-95 w-full md:w-auto shadow-lg shadow-red-200"
            >
              <LogOutIcon size={20} />
              Logout
            </button>
          </div>
        </section>
      </div>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <LogOutIcon size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1F2937]">Confirm Logout</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[#1F2937] mb-2">
                Are you sure you want to log out of your session?
              </p>
              <p className="text-sm text-[#6B7280]">
                You will be redirected to the login page and will need to re-authenticate to access your dashboard.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0 border-t border-[#E5E7EB]">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-3 rounded-lg border border-[#D1D5DB] text-[#1F2937] font-medium hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
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

export default HODProfilePage;