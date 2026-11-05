import { HTTPError } from '../../main/HttpError';
import { createApp } from '../../main/app';
import { Task, TaskStatus } from '../../main/models/Task';
import { TaskApiClient } from '../../main/services/TaskApiClient';

import request from 'supertest';

const task: Task = {
  id: 1,
  title: 'Review case file 1234',
  description: 'Check the evidence bundle',
  status: TaskStatus.TODO,
  due_date: '2099-12-01T09:30:00',
  created_at: '2026-11-05T10:00:00',
};

const validForm = {
  title: 'Review case file 1234',
  description: 'Check the evidence bundle',
  status: 'TODO',
  'dueDate-day': '1',
  'dueDate-month': '12',
  'dueDate-year': '2099',
  dueTime: '09:30',
};

const client = {
  listTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateStatus: jest.fn(),
  deleteTask: jest.fn(),
};

const app = createApp(client as unknown as TaskApiClient);

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('GET /', () => {
  test('lists tasks with their status and due date', async () => {
    client.listTasks.mockResolvedValue([task]);

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Your tasks');
    expect(response.text).toContain('href="/tasks/1"');
    expect(response.text).toContain('Review case file 1234');
    expect(response.text).toContain('To do');
    expect(response.text).toContain('1 December 2099 at 9:30am');
  });

  test('flags overdue tasks', async () => {
    client.listTasks.mockResolvedValue([{ ...task, due_date: '2020-01-01T09:00:00' }]);

    const response = await request(app).get('/');

    expect(response.text).toContain('Overdue');
  });

  test('shows a message when there are no tasks', async () => {
    client.listTasks.mockResolvedValue([]);

    const response = await request(app).get('/');

    expect(response.text).toContain('You do not have any tasks yet');
  });

  test('shows a success banner after a task is deleted', async () => {
    client.listTasks.mockResolvedValue([]);

    const response = await request(app).get('/?deleted=true');

    expect(response.text).toContain('Task deleted');
  });

  test('shows the error page when the task service is unavailable', async () => {
    client.listTasks.mockRejectedValue(new HTTPError('The task service is unavailable', 503));

    const response = await request(app).get('/');

    expect(response.status).toBe(503);
    expect(response.text).toContain('Sorry, there is a problem with the service');
    expect(response.text).toContain('The task service is unavailable');
  });
});

describe('GET /tasks/:id', () => {
  test('shows the task details', async () => {
    client.getTask.mockResolvedValue(task);

    const response = await request(app).get('/tasks/1');

    expect(response.status).toBe(200);
    expect(client.getTask).toHaveBeenCalledWith(1);
    expect(response.text).toContain('Check the evidence bundle');
    expect(response.text).toContain('Update status');
    expect(response.text).toContain('href="/tasks/1/delete"');
  });

  test('shows the page not found page when the task does not exist', async () => {
    client.getTask.mockRejectedValue(new HTTPError('Task not found', 404));

    const response = await request(app).get('/tasks/99');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Page not found');
  });

  test('returns 404 for an id that is not a number', async () => {
    const response = await request(app).get('/tasks/abc');

    expect(response.status).toBe(404);
    expect(client.getTask).not.toHaveBeenCalled();
  });
});

describe('GET /tasks/new', () => {
  test('shows the create task form', async () => {
    const response = await request(app).get('/tasks/new');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Create a task');
    expect(response.text).toContain('name="dueDate-day"');
  });
});

describe('POST /tasks', () => {
  test('creates the task and redirects to it', async () => {
    client.createTask.mockResolvedValue(task);

    const response = await request(app).post('/tasks').type('form').send(validForm);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/tasks/1?created=true');
    expect(client.createTask).toHaveBeenCalledWith({
      title: 'Review case file 1234',
      description: 'Check the evidence bundle',
      status: TaskStatus.TODO,
      due_date: '2099-12-01T09:30:00',
    });
  });

  test('shows errors and keeps the entered values when the form is invalid', async () => {
    const response = await request(app)
      .post('/tasks')
      .type('form')
      .send({ ...validForm, title: '', 'dueDate-day': '31', 'dueDate-month': '2' });

    expect(response.status).toBe(400);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter a title');
    expect(response.text).toContain('href="#title"');
    expect(response.text).toContain('Due date must be a real date');
    expect(response.text).toContain('value="31"');
    expect(client.createTask).not.toHaveBeenCalled();
  });
});

describe('POST /tasks/:id/status', () => {
  test('updates the status and redirects to the task', async () => {
    client.updateStatus.mockResolvedValue({ ...task, status: TaskStatus.DONE });

    const response = await request(app).post('/tasks/1/status').type('form').send({ status: 'DONE' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/tasks/1?updated=true');
    expect(client.updateStatus).toHaveBeenCalledWith(1, TaskStatus.DONE);
  });

  test('rejects an invalid status', async () => {
    const response = await request(app).post('/tasks/1/status').type('form').send({ status: 'FINISHED' });

    expect(response.status).toBe(400);
    expect(client.updateStatus).not.toHaveBeenCalled();
  });
});

describe('Deleting a task', () => {
  test('GET /tasks/:id/delete asks for confirmation', async () => {
    client.getTask.mockResolvedValue(task);

    const response = await request(app).get('/tasks/1/delete');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Are you sure you want to delete this task?');
    expect(client.deleteTask).not.toHaveBeenCalled();
  });

  test('POST /tasks/:id/delete deletes the task and redirects to the list', async () => {
    client.deleteTask.mockResolvedValue(undefined);

    const response = await request(app).post('/tasks/1/delete');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/?deleted=true');
    expect(client.deleteTask).toHaveBeenCalledWith(1);
  });
});

describe('Unknown pages', () => {
  test('return the page not found page', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Page not found');
  });
});
