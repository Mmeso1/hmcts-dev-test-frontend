import { TaskController } from '../controllers/TaskController';
import { TaskApiClient } from '../services/TaskApiClient';
import { TaskFormValidator } from '../validation/TaskFormValidator';

import { Application } from 'express';

// HTML forms can only send GET and POST, so updates and deletes use POST routes
export default function (app: Application, client: TaskApiClient): void {
  const controller = new TaskController(client, new TaskFormValidator());

  app.get('/', controller.list);
  app.get('/tasks/new', controller.newForm);
  app.post('/tasks', controller.create);
  app.get('/tasks/:id', controller.show);
  app.post('/tasks/:id/status', controller.updateStatus);
  app.get('/tasks/:id/delete', controller.confirmDelete);
  app.post('/tasks/:id/delete', controller.delete);
}
