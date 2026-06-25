import { useState, useCallback } from "react";
import type {
  Project,
  Task,
  Subtask,
  Attachment,
  AppNotification,
  ProjectStatus,
  TaskStatus,
  SubtaskStatus,
  Priority,
  FileType
} from "../data/types.js";
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_NOTIFICATIONS
} from "../data/mock.js";

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface CreateProjectInput {
  name: string;
  description: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description: string | null;
  taskDate: string;
  timeSpentMinutes: number | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
}

export interface CreateAttachmentWithFileInput extends CreateAttachmentInput {
  file?: File;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  taskDate?: string;
  timeSpentMinutes?: number | null;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: string | null;
  projectId?: string;
}

export interface CreateSubtaskInput {
  title: string;
  priority: Priority;
  dueDate: string | null;
}

export interface CreateAttachmentInput {
  fileName: string;
  fileType: FileType;
  fileSizeBytes: number | null;
}

export function useGestionJornada() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // --- Projects ---

  const createProject = useCallback((input: CreateProjectInput): Project => {
    const now = nowIso();
    const project: Project = {
      id: generateId(),
      name: input.name,
      description: input.description,
      status: "open",
      openedAt: now,
      closedAt: null,
      createdAt: now,
      updatedAt: now
    };
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  const updateProject = useCallback((id: string, input: UpdateProjectInput): void => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...input, updatedAt: nowIso() } : p
      )
    );
  }, []);

  const closeProject = useCallback((id: string): void => {
    const now = nowIso();
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "closed" as ProjectStatus, closedAt: now, updatedAt: now }
          : p
      )
    );
  }, []);

  const reopenProject = useCallback((id: string): void => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "open" as ProjectStatus, closedAt: null, updatedAt: nowIso() }
          : p
      )
    );
  }, []);

  // --- Tasks ---

  const createTask = useCallback((input: CreateTaskInput): Task => {
    const now = nowIso();
    const task: Task = {
      id: generateId(),
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      taskDate: input.taskDate,
      timeSpentMinutes: input.timeSpentMinutes,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
      subtasks: [],
      attachments: []
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, input: UpdateTaskInput): void => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const now = nowIso();
        const newStatus = input.status ?? t.status;
        const wasCompleted = t.status !== "completed" && newStatus === "completed";
        const wasReopened = t.status === "completed" && newStatus !== "completed";
        return {
          ...t,
          ...input,
          closedAt: wasCompleted ? now : wasReopened ? null : t.closedAt,
          updatedAt: now
        };
      })
    );
  }, []);

  const changeTaskStatus = useCallback((id: string, status: TaskStatus): void => {
    updateTask(id, { status });
  }, [updateTask]);

  // --- Subtasks ---

  const createSubtask = useCallback((taskId: string, input: CreateSubtaskInput): void => {
    const now = nowIso();
    const subtask: Subtask = {
      id: generateId(),
      taskId,
      title: input.title,
      priority: input.priority,
      status: "pending",
      dueDate: input.dueDate,
      closedAt: null,
      createdAt: now,
      updatedAt: now
    };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, subtask], updatedAt: now }
          : t
      )
    );
  }, []);

  const changeSubtaskStatus = useCallback((taskId: string, subtaskId: string, status: SubtaskStatus): void => {
    const now = nowIso();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) => {
            if (s.id !== subtaskId) return s;
            return {
              ...s,
              status,
              closedAt: status === "completed" ? now : null,
              updatedAt: now
            };
          })
        };
      })
    );
  }, []);

  // --- Attachments ---

  const addAttachment = useCallback((taskId: string, input: CreateAttachmentWithFileInput): void => {
    const now = nowIso();
    const attachment: Attachment = {
      id: generateId(),
      taskId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSizeBytes: input.fileSizeBytes,
      isDeleted: false,
      deletedAt: null,
      attachedAt: now,
      file: input.file
    };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, attachments: [...t.attachments, attachment] }
          : t
      )
    );
  }, []);

  const deleteAttachment = useCallback((taskId: string, attachmentId: string): void => {
    const now = nowIso();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          attachments: t.attachments.map((a) =>
            a.id === attachmentId
              ? { ...a, isDeleted: true, deletedAt: now }
              : a
          )
        };
      })
    );
  }, []);

  // --- Notifications ---

  const markNotificationRead = useCallback((id: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback((): void => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.channel === "in_app" && !n.isRead
  ).length;

  return {
    projects,
    tasks,
    notifications,
    unreadCount,
    createProject,
    updateProject,
    closeProject,
    reopenProject,
    createTask,
    updateTask,
    changeTaskStatus,
    createSubtask,
    changeSubtaskStatus,
    addAttachment,
    deleteAttachment,
    markNotificationRead,
    markAllNotificationsRead
  };
}
