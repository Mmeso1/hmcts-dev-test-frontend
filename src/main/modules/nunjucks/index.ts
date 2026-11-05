import * as path from 'path';

import { STATUS_LABELS, STATUS_TAG_CLASSES } from '../../models/Task';
import { formatDateTime, isOverdue } from '../../utils/dates';

import * as express from 'express';
import * as nunjucks from 'nunjucks';

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  enableFor(app: express.Express): void {
    app.set('view engine', 'njk');
    const env = nunjucks.configure(path.join(__dirname, '..', '..', 'views'), {
      autoescape: true,
      watch: this.developmentMode,
      express: app,
    });

    env.addGlobal('serviceName', 'Caseworker task manager');
    env.addGlobal('serviceUrl', '/');
    env.addGlobal('statusLabels', STATUS_LABELS);
    env.addGlobal('statusTagClasses', STATUS_TAG_CLASSES);
    env.addGlobal('isOverdue', isOverdue);
    env.addFilter('formatDateTime', formatDateTime);

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
  }
}
