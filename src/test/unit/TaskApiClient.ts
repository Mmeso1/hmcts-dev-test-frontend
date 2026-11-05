import { HTTPError } from '../../main/HttpError';
import { Task, TaskStatus } from '../../main/models/Task';
import { TaskApiClient } from '../../main/services/TaskApiClient';

import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const task: Task = {
  id: 1,
  title: 'Review case file',
  description: null,
  status: TaskStatus.TODO,
  due_date: '2026-12-01T09:00:00',
  created_at: '2026-11-05T10:00:00',
};

function mockHttp() {
  return { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };
}

function responseError(status: number): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse);
}

describe('TaskApiClient', () => {
  let http: ReturnType<typeof mockHttp>;
  let client: TaskApiClient;

  beforeEach(() => {
    http = mockHttp();
    client = new TaskApiClient(http as unknown as AxiosInstance);
  });

  test('listTasks gets all tasks', async () => {
    http.get.mockResolvedValue({ data: [task] });

    await expect(client.listTasks()).resolves.toEqual([task]);
    expect(http.get).toHaveBeenCalledWith('/tasks');
  });

  test('getTask gets one task by id', async () => {
    http.get.mockResolvedValue({ data: task });

    await expect(client.getTask(1)).resolves.toEqual(task);
    expect(http.get).toHaveBeenCalledWith('/tasks/1');
  });

  test('createTask posts the new task', async () => {
    const newTask = { title: 'Review case file', description: null, status: TaskStatus.TODO, due_date: task.due_date };
    http.post.mockResolvedValue({ data: task });

    await expect(client.createTask(newTask)).resolves.toEqual(task);
    expect(http.post).toHaveBeenCalledWith('/tasks', newTask);
  });

  test('updateStatus patches only the status', async () => {
    http.patch.mockResolvedValue({ data: { ...task, status: TaskStatus.DONE } });

    const updated = await client.updateStatus(1, TaskStatus.DONE);

    expect(updated.status).toBe(TaskStatus.DONE);
    expect(http.patch).toHaveBeenCalledWith('/tasks/1/status', { status: TaskStatus.DONE });
  });

  test('deleteTask deletes the task', async () => {
    http.delete.mockResolvedValue({ data: '' });

    await client.deleteTask(1);

    expect(http.delete).toHaveBeenCalledWith('/tasks/1');
  });

  test('turns a 404 from the API into a 404 HTTPError', async () => {
    http.get.mockRejectedValue(responseError(404));

    await expect(client.getTask(99)).rejects.toEqual(new HTTPError('Task not found', 404));
  });

  test('turns other API errors into a 502 HTTPError', async () => {
    http.get.mockRejectedValue(responseError(500));

    await expect(client.listTasks()).rejects.toMatchObject({ status: 502 });
  });

  test('reports the service as unavailable when the API cannot be reached', async () => {
    http.get.mockRejectedValue(new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED'));

    await expect(client.listTasks()).rejects.toEqual(new HTTPError('The task service is unavailable', 503));
  });
});
