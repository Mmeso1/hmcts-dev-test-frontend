import { TaskStatus } from '../../main/models/Task';
import { TaskFormValidator } from '../../main/validation/TaskFormValidator';

const validForm = {
  title: 'Review case file',
  description: 'Check the evidence bundle',
  status: 'IN_PROGRESS',
  'dueDate-day': '1',
  'dueDate-month': '12',
  'dueDate-year': '2026',
  dueTime: '9:30',
};

describe('TaskFormValidator', () => {
  const validator = new TaskFormValidator();

  test('turns a valid form into a new task', () => {
    const result = validator.validate(validForm);

    expect(result.errors).toEqual({});
    expect(result.task).toEqual({
      title: 'Review case file',
      description: 'Check the evidence bundle',
      status: TaskStatus.IN_PROGRESS,
      due_date: '2026-12-01T09:30:00',
    });
  });

  test('trims values and sends an empty description as null', () => {
    const result = validator.validate({ ...validForm, title: '  Review case file  ', description: '   ' });

    expect(result.task?.title).toBe('Review case file');
    expect(result.task?.description).toBeNull();
  });

  test('requires a title', () => {
    const result = validator.validate({ ...validForm, title: '   ' });

    expect(result.task).toBeUndefined();
    expect(result.errors.title).toBe('Enter a title');
  });

  test('limits the title to 255 characters', () => {
    const result = validator.validate({ ...validForm, title: 'x'.repeat(256) });

    expect(result.errors.title).toBe('Title must be 255 characters or less');
  });

  test('limits the description to 2000 characters', () => {
    const result = validator.validate({ ...validForm, description: 'x'.repeat(2001) });

    expect(result.errors.description).toBe('Description must be 2000 characters or less');
  });

  test('rejects an unknown status', () => {
    const result = validator.validate({ ...validForm, status: 'FINISHED' });

    expect(result.errors.status).toBe('Select a status');
  });

  test.each([
    [{ 'dueDate-day': '', 'dueDate-month': '', 'dueDate-year': '' }, 'Enter a due date'],
    [
      { 'dueDate-day': '1', 'dueDate-month': '', 'dueDate-year': '2026' },
      'Due date must include a day, month and year',
    ],
    [{ 'dueDate-day': '31', 'dueDate-month': '2', 'dueDate-year': '2026' }, 'Due date must be a real date'],
    [{ 'dueDate-day': 'one', 'dueDate-month': '12', 'dueDate-year': '2026' }, 'Due date must be a real date'],
    [{ 'dueDate-day': '1', 'dueDate-month': '13', 'dueDate-year': '2026' }, 'Due date must be a real date'],
    [{ 'dueDate-day': '1', 'dueDate-month': '12', 'dueDate-year': '26' }, 'Due date must be a real date'],
  ])('rejects an invalid due date %o', (dateFields, message) => {
    const result = validator.validate({ ...validForm, ...dateFields });

    expect(result.errors.dueDate).toBe(message);
  });

  test.each([
    ['', 'Enter a due time'],
    ['24:00', 'Due time must be a real time in the 24-hour format, like 09:30 or 14:00'],
    ['9.30', 'Due time must be a real time in the 24-hour format, like 09:30 or 14:00'],
  ])('rejects an invalid due time "%s"', (dueTime, message) => {
    const result = validator.validate({ ...validForm, dueTime });

    expect(result.errors.dueTime).toBe(message);
  });

  test('keeps the submitted values so the form can be shown again', () => {
    const result = validator.validate({ ...validForm, title: '' });

    expect(result.values).toMatchObject({ dueDay: '1', dueMonth: '12', dueYear: '2026', dueTime: '9:30' });
  });

  test('ignores fields that are not strings', () => {
    const result = validator.validate({ ...validForm, title: ['a', 'b'] });

    expect(result.errors.title).toBe('Enter a title');
  });
});
