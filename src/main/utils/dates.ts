import { Task, TaskStatus } from '../models/Task';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats an ISO date-time in the GOV.UK style, for example "1 December 2026 at 9:05am".
 * The backend sends date-times without a timezone, so they are read as local time.
 */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours % 12 || 12}:${minutes}${hours < 12 ? 'am' : 'pm'}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} at ${time}`;
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return task.status !== TaskStatus.DONE && new Date(task.due_date).getTime() < now.getTime();
}
