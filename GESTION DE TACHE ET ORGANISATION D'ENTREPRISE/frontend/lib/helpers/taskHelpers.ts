// lib/helpers/taskHelpers.ts

import { type TaskStatus, type TaskPriority } from '@/lib/actions/taskActions';

export const formatTaskStatus = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    'A_faire': 'To Do',
    'En_cours': 'In Progress',
    'Terminer': 'Completed',
  };
  return map[status] || status;
};

export const formatTaskPriority = (priority: TaskPriority): string => {
  const map: Record<TaskPriority, string> = {
    'Bas': 'Low',
    'Moyen': 'Medium',
    'Elevee': 'High',
  };
  return map[priority] || priority;
};

export const getStatusColor = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    'A_faire': 'bg-gray-100 text-gray-800',
    'En_cours': 'bg-blue-100 text-blue-800',
    'Terminer': 'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const map: Record<TaskPriority, string> = {
    'Bas': 'bg-green-100 text-green-800',
    'Moyen': 'bg-amber-100 text-amber-800',
    'Elevee': 'bg-red-100 text-red-800',
  };
  return map[priority] || 'bg-gray-100 text-gray-800';
};

export const getStatusIcon = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    'A_faire': '○',
    'En_cours': '◉',
    'Terminer': '✓',
  };
  return map[status] || '○';
};