export type ProjectStatus = "open" | "closed";
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";
export type SubtaskStatus = "pending" | "completed";
export type Priority = "low" | "medium" | "high";
export type FileType = "pdf" | "image" | "excel" | "email" | "other";
export type NotificationChannel = "in_app" | "email";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  priority: Priority;
  status: SubtaskStatus;
  dueDate: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: FileType;
  fileSizeBytes: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  attachedAt: string;
  /** File object only available for files uploaded in this session (not persisted) */
  file?: File;
}

export interface AppNotification {
  id: string;
  type: "due_date_reminder";
  channel: NotificationChannel;
  taskId: string | null;
  subtaskId: string | null;
  sentAt: string;
  isRead: boolean;
  taskTitle?: string;
  subtaskTitle?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  taskDate: string;
  timeSpentMinutes: number | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
  attachments: Attachment[];
}
