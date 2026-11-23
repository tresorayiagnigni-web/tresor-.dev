"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EmployeeLayout } from "@/app/layout/employeeLayout";
import { Plus, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { getProfile, type User } from "@/lib/actions/userActions";
import { getTasks, type Task } from "@/lib/actions/taskActions";
import {
  getDepartmentById,
  type Department,
} from "@/lib/actions/departmentActions";
import AvatarUploader from "@/components/AvatarUploader"; // ← AJOUT

// ========== TYPES ==========
type RequestType = "leave" | "expense";

interface Request {
  id: string;
  date: string;
  type: string;
  details: string;
  status: "approved" | "pending" | "rejected";
}

interface FormData {
  type: RequestType;
  startDate: string;
  endDate: string;
  amount: string;
  comment: string;
}

// ========== HELPERS ==========
function getTaskAssigneeIds(task: any): number[] {
  if (Array.isArray(task.assigneeIds)) {
    return task.assigneeIds.map(Number).filter(Number.isFinite);
  }
  if (task.userId != null) return [Number(task.userId)];
  if (task.assignedTo != null) return [Number(task.assignedTo)];
  if (task.user?.id != null) return [Number(task.user.id)];
  return [];
}

// ========== MAIN COMPONENT ==========
export default function EmployeeProfilePage() {
  const [employeeName, setEmployeeName] = useState("Loading...");
  const [employeeInitials, setEmployeeInitials] = useState("??");
  const [employeeRole, setEmployeeRole] = useState("Loading...");

  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 👇 NOUVEAU : state pour l'avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    type: "leave",
    startDate: "",
    endDate: "",
    amount: "",
    comment: "",
  });

  // Mock requests (à remplacer plus tard par une API)
  const [requests] = useState<Request[]>([
    {
      id: "1",
      date: new Date().toISOString().split("T")[0],
      type: "Salary Advance",
      details: "Emergency advance - $5,000",
      status: "approved",
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
      type: "Leave Request",
      details: "Annual leave - 5 days",
      status: "pending",
    },
    {
      id: "3",
      date: new Date(Date.now() - 86400000 * 10).toISOString().split("T")[0],
      type: "Expense Claim",
      details: "Travel reimbursement - $350",
      status: "approved",
    },
    {
      id: "4",
      date: new Date(Date.now() - 86400000 * 20).toISOString().split("T")[0],
      type: "Leave Request",
      details: "Sick leave - 2 days",
      status: "approved",
    },
  ]);

  // ===== LOAD DATA =====
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Profil de l'utilisateur connecté
      const profileResult = await getProfile();

      if (!profileResult.success || !profileResult.data) {
        throw new Error(
          profileResult.message || "Impossible de récupérer votre profil.",
        );
      }

      const raw = profileResult.data as any;
      const currentUser: User =
        raw?.data?.user ?? raw?.user ?? raw?.data ?? raw;

      if (currentUser.id == null) {
        throw new Error("L'identifiant de l'utilisateur est absent du profil.");
      }

      setUser(currentUser);

      // 👇 Récupération robuste de l'avatar
      const avatar =
        (currentUser as any).avatarUrl ||
        (currentUser as any).avatar ||
        (currentUser as any).photo ||
        (currentUser as any).profilePicture ||
        null;

      setAvatarUrl(avatar);

      const name =
        (currentUser as any).nom || (currentUser as any).name || "Employee";
      setEmployeeName(name);
      setEmployeeInitials(
        name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part: string) => part.charAt(0).toUpperCase())
          .join(""),
      );
      setEmployeeRole(
        currentUser.role === "HOD"
          ? "Head of Department"
          : currentUser.role === "ADMIN"
            ? "Administrator"
            : "Employee",
      );

      const currentUserId = Number(currentUser.id);

      // 2. Département
      const deptId =
        (currentUser as any).departementId ??
        (currentUser as any).departmentId ??
        (currentUser as any).departement?.id;

      if (deptId != null) {
        const deptResult = await getDepartmentById(Number(deptId));
        if (deptResult.success && deptResult.data) {
          setDepartment(deptResult.data);
        }
      }

      // 3. Tâches de l'employé
      const taskResult = await getTasks();

      console.log("Profil connecté :", currentUser);
      console.log("Résultat getTasks :", taskResult);

      if (taskResult.success && Array.isArray(taskResult.data)) {
        const myTasks = (taskResult.data as any[]).filter((task) => {
          const assigneeIds = getTaskAssigneeIds(task);
          return assigneeIds.includes(currentUserId);
        });
        setTasks(myTasks as Task[]);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Erreur profil employé :", err);
      setError(
        err instanceof Error ? err.message : "Failed to load profile data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ===== DERIVED STATE =====
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Terminer").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Terminer").length;

  const userStatus =
    (user as any)?.status === true ||
    (user as any)?.status === "true" ||
    (user as any)?.status === "ACTIVE";

  const userPhone =
    (user as any)?.telephone || (user as any)?.phone || "Not provided";
  const userDepartment =
    department?.nom_departement ||
    (typeof (user as any)?.departement === "string"
      ? (user as any).departement
      : (user as any)?.departement?.nom_departement) ||
    "Not assigned";
  const userEmail = user?.email || "No email on file";

  // ===== EVENT HANDLERS =====
  const openModal = () => {
    setFormData({
      type: "leave",
      startDate: "",
      endDate: "",
      amount: "",
      comment: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation (à remplacer par un vrai appel API plus tard)
    setTimeout(() => {
      setSuccessMessage("Request submitted successfully!");
      setIsSubmitting(false);
      closeModal();
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1000);
  };

  // 👇 NOUVEAU : handler appelé quand l'avatar est mis à jour
  const handleAvatarUpdated = (newUrl: string) => {
    setAvatarUrl(newUrl);
    setSuccessMessage("Photo de profil mise à jour avec succès !");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const getStatusBadge = (status: Request["status"]) => {
    const config = {
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <CheckCircle size={14} className="mr-1" />,
        label: "Approved",
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: <Clock size={14} className="mr-1" />,
        label: "Pending",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <AlertCircle size={14} className="mr-1" />,
        label: "Rejected",
      },
    };
    return config[status];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ===== LOADING =====
  if (isLoading) {
    return (
      <EmployeeLayout
        pageTitle="My Profile"
        pageSubtitle="Loading your profile..."
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#263A81]" />
            <p className="text-[#6B7280]">Loading profile...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== ERROR =====
  if (error) {
    return (
      <EmployeeLayout
        pageTitle="My Profile"
        pageSubtitle="Error loading profile"
        employeeName={employeeName}
        employeeInitials={employeeInitials}
        employeeRole={employeeRole}
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="text-center text-red-500">
            <p className="text-lg font-medium">Error Loading Profile</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-4 rounded-lg bg-[#263A81] px-4 py-2 text-white transition hover:bg-[#1e2f6a]"
            >
              Retry
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // ===== RENDER =====
  return (
    <EmployeeLayout
      pageTitle="My Profile"
      pageSubtitle="View your employee information and manage requests."
      employeeName={employeeName}
      employeeInitials={employeeInitials}
      employeeRole={employeeRole}
    >
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-medium text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="w-full space-y-6">
        {/* IDENTITY CARD */}
        <section className="box-border w-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* 👇 Zone photo de profil (comme HOD) */}
            <div className="flex-shrink-0">
              <AvatarUploader
                initialAvatarUrl={avatarUrl}
                userName={employeeName}
                onAvatarUpdated={handleAvatarUpdated}
              />
            </div>

            <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Full Name
                </label>
                <p className="break-words font-medium text-[#1F2937]">
                  {employeeName}
                </p>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Job Title
                </label>
                <p className="break-words font-medium text-[#1F2937]">
                  {employeeRole}
                </p>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Assigned Department
                </label>
                <p className="break-words font-medium text-[#1F2937]">
                  {userDepartment}
                </p>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Corporate Email
                </label>
                <p className="break-all font-medium text-[#1F2937] select-all">
                  {userEmail}
                </p>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Phone Number
                </label>
                <p className="break-words font-medium text-[#1F2937]">
                  {userPhone}
                </p>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                  Account Status
                </label>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    userStatus
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {userStatus ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* TASK SUMMARY */}
        <section className="box-border w-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-[#1F2937]">
            Task Summary
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] p-4 text-center">
              <p className="text-2xl font-bold text-[#1F2937]">{totalTasks}</p>
              <p className="text-sm text-[#6B7280]">Total Tasks</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {pendingTasks}
              </p>
              <p className="text-sm text-[#6B7280]">Pending</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FEFEFC] p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {completedTasks}
              </p>
              <p className="text-sm text-[#6B7280]">Completed</p>
            </div>
          </div>
        </section>

        {/* REQUEST CONSOLE */}
        <section className="box-border w-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1F2937]">
                Request Console
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Submit new requests for approval
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="flex w-full items-center justify-center gap-2 self-start rounded-lg bg-[#263A81] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#263A81]/20 transition hover:bg-[#1e2f6a] active:scale-95 sm:w-auto sm:self-center"
            >
              <Plus size={18} />
              Submit New Request
            </button>
          </div>

          <div className="mt-6 w-full overflow-hidden">
            <h3 className="mb-4 text-sm font-semibold text-[#1F2937]">
              Historical Requests
            </h3>
            <div className="w-full overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full min-w-[600px] table-auto text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-gray-50/70">
                    <th className="px-4 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                      Date
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                      Request Type
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                      Details
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold tracking-wide text-[#6B7280]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {requests.map((request) => {
                    const statusConfig = getStatusBadge(request.status);
                    return (
                      <tr
                        key={request.id}
                        className="transition duration-150 hover:bg-gray-50/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 font-medium text-[#1F2937]">
                          {formatDate(request.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-medium text-[#1F2937]">
                          {request.type}
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-3.5 text-[#6B7280]">
                          {request.details}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${statusConfig.bg} ${statusConfig.text}`}
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] p-6">
              <h2 className="text-xl font-bold text-[#1F2937]">
                Submit New Request
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 transition hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="requestType"
                  className="mb-1 block text-sm font-medium text-[#1F2937]"
                >
                  Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="requestType"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  required
                  disabled={isSubmitting}
                >
                  <option value="leave">Leave Request</option>
                  <option value="expense">
                    Salary Advance / Expense Claim
                  </option>
                </select>
              </div>

              {formData.type === "leave" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="mb-1 block text-sm font-medium text-[#1F2937]"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="mb-1 block text-sm font-medium text-[#1F2937]"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleFormChange}
                      className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#1F2937] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {formData.type === "expense" && (
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-1 block text-sm font-medium text-[#1F2937]"
                  >
                    Requested Amount (CFA){" "}
                    <span className="text-red-500">*</span>
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
                    className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-[#1F2937] transition placeholder:text-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="comment"
                  className="mb-1 block text-sm font-medium text-[#1F2937]"
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
                  className="w-full resize-none rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#1F2937] transition placeholder:text-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#263A81]"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-[#D1D5DB] px-4 py-3 font-medium text-[#1F2937] transition hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#263A81] px-4 py-3 font-bold text-white transition hover:bg-[#1e2f6a] active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
