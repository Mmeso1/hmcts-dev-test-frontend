import { NewTask, TaskStatus, isTaskStatus } from '../models/Task';

export const TITLE_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 2000;

// The raw values submitted by the create task form, kept so the form can be redisplayed
export interface TaskFormValues {
  title: string;
  description: string;
  status: string;
  dueDay: string;
  dueMonth: string;
  dueYear: string;
  dueTime: string;
}

export type TaskFormField = 'title' | 'description' | 'status' | 'dueDate' | 'dueTime';

export type TaskFormErrors = Partial<Record<TaskFormField, string>>;

export interface TaskFormResult {
  values: TaskFormValues;
  errors: TaskFormErrors;
  task?: NewTask;
}

/**
 * Validates the create task form and turns it into the data the backend expects.
 * Error messages follow the GOV.UK Design System guidance.
 */
export class TaskFormValidator {
  validate(body: Record<string, unknown>): TaskFormResult {
    const values = TaskFormValidator.readValues(body);
    const errors: TaskFormErrors = {};

    if (!values.title) {
      errors.title = 'Enter a title';
    } else if (values.title.length > TITLE_MAX_LENGTH) {
      errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
    }

    if (values.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
    }

    if (!isTaskStatus(values.status)) {
      errors.status = 'Select a status';
    }

    const dueDateError = this.validateDate(values);
    if (dueDateError) {
      errors.dueDate = dueDateError;
    }

    const dueTimeError = this.validateTime(values.dueTime);
    if (dueTimeError) {
      errors.dueTime = dueTimeError;
    }

    if (Object.keys(errors).length > 0) {
      return { values, errors };
    }

    return {
      values,
      errors,
      task: {
        title: values.title,
        description: values.description || null,
        status: values.status as TaskStatus,
        due_date: this.toIsoDateTime(values),
      },
    };
  }

  static emptyValues(): TaskFormValues {
    return {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      dueDay: '',
      dueMonth: '',
      dueYear: '',
      dueTime: '',
    };
  }

  private static readValues(body: Record<string, unknown>): TaskFormValues {
    const read = (field: string): string => (typeof body[field] === 'string' ? (body[field] as string).trim() : '');
    return {
      title: read('title'),
      description: read('description'),
      status: read('status'),
      dueDay: read('dueDate-day'),
      dueMonth: read('dueDate-month'),
      dueYear: read('dueDate-year'),
      dueTime: read('dueTime'),
    };
  }

  private validateDate({ dueDay, dueMonth, dueYear }: TaskFormValues): string | undefined {
    if (!dueDay && !dueMonth && !dueYear) {
      return 'Enter a due date';
    }
    if (!dueDay || !dueMonth || !dueYear) {
      return 'Due date must include a day, month and year';
    }
    if (!/^\d{1,2}$/.test(dueDay) || !/^\d{1,2}$/.test(dueMonth) || !/^\d{4}$/.test(dueYear)) {
      return 'Due date must be a real date';
    }

    const day = Number(dueDay);
    const month = Number(dueMonth);
    const year = Number(dueYear);
    const date = new Date(year, month - 1, day);
    // Rejects dates such as 31 February, which Date would otherwise roll over into March
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return 'Due date must be a real date';
    }
    return undefined;
  }

  private validateTime(dueTime: string): string | undefined {
    if (!dueTime) {
      return 'Enter a due time';
    }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(dueTime)) {
      return 'Due time must be a real time in the 24-hour format, like 09:30 or 14:00';
    }
    return undefined;
  }

  private toIsoDateTime({ dueDay, dueMonth, dueYear, dueTime }: TaskFormValues): string {
    const [hours, minutes] = dueTime.split(':');
    const pad = (value: string): string => value.padStart(2, '0');
    return `${dueYear}-${pad(dueMonth)}-${pad(dueDay)}T${pad(hours)}:${minutes}:00`;
  }
}
