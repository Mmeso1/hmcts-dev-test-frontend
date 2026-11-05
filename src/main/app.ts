import * as path from 'path';

import { HTTPError } from './HttpError';
import { Nunjucks } from './modules/nunjucks';
import { TaskApiClient } from './services/TaskApiClient';

import cookieParser from 'cookie-parser';
import express from 'express';
import { glob } from 'glob';
import favicon from 'serve-favicon';

const { setupDev } = require('./development');

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';
const taskApiUrl = process.env.TASK_API_URL || 'http://localhost:4000';

export function createApp(taskApiClient: TaskApiClient = TaskApiClient.create(taskApiUrl)): express.Express {
  const app = express();
  app.locals.ENV = env;

  new Nunjucks(developmentMode).enableFor(app);

  app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
    next();
  });

  glob
    .sync(__dirname + '/routes/**/*.+(ts|js)')
    .map(filename => require(filename))
    .forEach(route => route.default(app, taskApiClient));

  setupDev(app, developmentMode);

  app.use((req, res) => {
    res.status(404);
    res.render('not-found');
  });

  // Express only treats middleware as an error handler when it takes four arguments
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err instanceof HTTPError ? err.status : 500;
    res.status(status);
    if (status === 404) {
      res.render('not-found');
      return;
    }
    console.log(err);
    res.render('error', {
      message: err instanceof HTTPError ? err.message : 'Sorry, there is a problem with the service',
      error: developmentMode ? err : {},
    });
  });

  return app;
}

export const app = createApp();
