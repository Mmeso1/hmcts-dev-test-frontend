import { Task, TaskStatus } from '../../main/models/Task';
import { formatDateTime, isOverdue } from '../../main/utils/dates';

describe('formatDateTime', () => {
  test.each([
    ['2026-12-01T09:05:00', '1 December 2026 at 9:05am'],
    ['2026-12-01T00:00:00', '1 December 2026 at 12:00am'],
    ['2026-12-01T12:30:00', '1 December 2026 at 12:30pm'],
    ['2026-12-01T17:45:00', '1 December 2026 at 5:45pm'],
  ])('formats %s as "%s"', (isoDateTime, expected) => {
    expect(formatDateTime(isoDateTime)).toBe(expected);
  });

  test('returns the original value when it is not a date', () => {
    expect(formatDateTime('not a date')).toBe('not a date');
  });
});

describe('isOverdue', () => {
  const now = new Date('2026-11-05T12:00:00');
  const task = (status: TaskStatus, due_date: string): Task => ({
    id: 1,
    title: 'Task',
    description: null,
    status,
    due_date,
    created_at: '2026-11-01T09:00:00',
  });

  test('is true when the due date has passed and the task is not done', () => {
    expect(isOverdue(task(TaskStatus.IN_PROGRESS, '2026-11-04T09:00:00'), now)).toBe(true);
  });

  test('is false when the due date is in the future', () => {
    expect(isOverdue(task(TaskStatus.TODO, '2026-11-06T09:00:00'), now)).toBe(false);
  });

  test('is false when the task is done', () => {
    expect(isOverdue(task(TaskStatus.DONE, '2026-11-04T09:00:00'), now)).toBe(false);
  });
});
