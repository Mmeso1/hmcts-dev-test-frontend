import { HTTPError } from '../HttpError';
import { NewTask, Task, TaskStatus } from '../models/Task';

import axios, { AxiosInstance, AxiosResponse, isAxiosError } from 'axios';

/**
 * Talks to the task backend API. All HTTP details live here, so the rest of the
 * frontend works with plain Task objects and HTTPErrors.
 */
export class TaskApiClient {
  constructor(private readonly http: AxiosInstance) {}

  static create(baseURL: string): TaskApiClient {
    return new TaskApiClient(axios.create({ baseURL, timeout: 5000 }));
  }

  listTasks(): Promise<Task[]> {
    return this.send(() => this.http.get<Task[]>('/tasks'));
  }

  getTask(id: number): Promise<Task> {
    return this.send(() => this.http.get<Task>(`/tasks/${id}`));
  }

  createTask(task: NewTask): Promise<Task> {
    return this.send(() => this.http.post<Task>('/tasks', task));
  }

  updateStatus(id: number, status: TaskStatus): Promise<Task> {
    return this.send(() => this.http.patch<Task>(`/tasks/${id}/status`, { status }));
  }

  async deleteTask(id: number): Promise<void> {
    await this.send(() => this.http.delete(`/tasks/${id}`));
  }

  private async send<T>(request: () => Promise<AxiosResponse<T>>): Promise<T> {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  private toHttpError(error: unknown): HTTPError {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return new HTTPError('Task not found', 404);
      }
      return new HTTPError(`The task service returned an unexpected response (${error.response.status})`, 502);
    }
    return new HTTPError('The task service is unavailable', 503);
  }
}
