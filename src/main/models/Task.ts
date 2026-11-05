export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To do',
  [TaskStatus.IN_PROGRESS]: 'In progress',
  [TaskStatus.DONE]: 'Done',
};

// GOV.UK tag colour modifiers for each status
export const STATUS_TAG_CLASSES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'govuk-tag--grey',
  [TaskStatus.IN_PROGRESS]: 'govuk-tag--blue',
  [TaskStatus.DONE]: 'govuk-tag--green',
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return Object.values(TaskStatus).includes(value as TaskStatus);
}

// A task as returned by the backend API
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string;
  created_at: string;
}

// The data needed to create a task
export interface NewTask {
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string;
}
