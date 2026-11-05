import { HTTPError } from '../HttpError';
import { STATUS_LABELS, TaskStatus, isTaskStatus } from '../models/Task';
import { TaskApiClient } from '../services/TaskApiClient';
import { TaskFormErrors, TaskFormField, TaskFormValidator, TaskFormValues } from '../validation/TaskFormValidator';

import { Request, Response } from 'express';

const STATUS_OPTIONS = Object.values(TaskStatus).map(status => ({ value: status, text: STATUS_LABELS[status] }));

// The input each form error links to from the GOV.UK error summary
const ERROR_ANCHORS: Record<TaskFormField, string> = {
  title: 'title',
  description: 'description',
  status: 'status',
  dueDate: 'dueDate-day',
  dueTime: 'dueTime',
};

/**
 * Handles the task pages. Each method is an Express request handler; errors thrown
 * here (including HTTPErrors from the API client) are passed to the app's error handler.
 */
export class TaskController {
  constructor(
    private readonly client: TaskApiClient,
    private readonly validator: TaskFormValidator
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const tasks = await this.client.listTasks();
    res.render('tasks/list', { tasks, deleted: req.query.deleted === 'true' });
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const task = await this.client.getTask(this.taskId(req));
    res.render('tasks/show', {
      task,
      statusOptions: STATUS_OPTIONS,
      created: req.query.created === 'true',
      updated: req.query.updated === 'true',
    });
  };

  newForm = (req: Request, res: Response): void => {
    this.renderForm(res, TaskFormValidator.emptyValues(), {});
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { values, errors, task } = this.validator.validate(req.body ?? {});
    if (!task) {
      res.status(400);
      this.renderForm(res, values, errors);
      return;
    }
    const created = await this.client.createTask(task);
    res.redirect(`/tasks/${created.id}?created=true`);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = this.taskId(req);
    const status = req.body?.status;
    if (!isTaskStatus(status)) {
      throw new HTTPError('Select a valid status', 400);
    }
    await this.client.updateStatus(id, status);
    res.redirect(`/tasks/${id}?updated=true`);
  };

  confirmDelete = async (req: Request, res: Response): Promise<void> => {
    const task = await this.client.getTask(this.taskId(req));
    res.render('tasks/delete', { task });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.client.deleteTask(this.taskId(req));
    res.redirect('/?deleted=true');
  };

  private renderForm(res: Response, values: TaskFormValues, errors: TaskFormErrors): void {
    const errorList = (Object.keys(errors) as TaskFormField[]).map(field => ({
      text: errors[field],
      href: `#${ERROR_ANCHORS[field]}`,
    }));
    res.render('tasks/new', { values, errors, errorList, statusOptions: STATUS_OPTIONS });
  }

  private taskId(req: Request): number {
    const id = String(req.params.id);
    if (!/^\d+$/.test(id)) {
      throw new HTTPError('Task not found', 404);
    }
    return Number(id);
  }
}
