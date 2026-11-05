# HMCTS Dev Test Frontend

A web application that lets HMCTS caseworkers create, view, update and delete their tasks. Built with **Node.js**, **Express**, **TypeScript** and **Nunjucks**, using the [GOV.UK Design System](https://design-system.service.gov.uk/).

It uses the task API in [hmcts-dev-test-backend](https://github.com/Mmeso1/hmcts-dev-test-backend), so that API must be running for the pages to work.

## Features

- **Task list**: every task with its status and due date, ordered by due date. Tasks past their due date that are not done are flagged as **Overdue**.
- **Create a task**: title, optional description, status, and due date and time, with GOV.UK-style validation messages and an error summary.
- **Task details**: see a task, change its status, or delete it.
- **Delete confirmation**: asks before a task is deleted.
- Friendly error pages when a task does not exist (`404`) or the task API is unavailable (`503`).

## Requirements

- Node.js 18 or later
- Yarn. It ships with Node through Corepack: run `corepack enable` once.
- The [backend API](https://github.com/Mmeso1/hmcts-dev-test-backend) running on http://localhost:4000

## Getting started

```bash
yarn install
yarn webpack      # build the GOV.UK styles and scripts
yarn start:dev    # start with automatic reload
```

Open https://localhost:3100. The development server uses a self-signed certificate, so your browser will warn you the first time. Choose to continue to `localhost`.

### Configuration

| Variable       | Default                 | Description                 |
| -------------- | ----------------------- | --------------------------- |
| `TASK_API_URL` | `http://localhost:4000` | Base URL of the backend API |
| `PORT`         | `3100`                  | Port the frontend runs on   |

## Pages

| Method | Path                | Description                           |
| ------ | ------------------- | ------------------------------------- |
| `GET`  | `/`                 | List all tasks                        |
| `GET`  | `/tasks/new`        | Create a task form                    |
| `POST` | `/tasks`            | Validate the form and create the task |
| `GET`  | `/tasks/:id`        | Task details and change status form   |
| `POST` | `/tasks/:id/status` | Update the task's status              |
| `GET`  | `/tasks/:id/delete` | Confirm deletion                      |
| `POST` | `/tasks/:id/delete` | Delete the task                       |

HTML forms can only send `GET` and `POST`, so updating and deleting use `POST` routes that call the API's `PATCH` and `DELETE` endpoints.

## Running the tests

```bash
yarn test          # unit tests
yarn test:routes   # route tests
yarn lint          # stylelint, ESLint and Prettier
```

- **Unit tests** (`src/test/unit`): `TaskApiClient` (with a mocked HTTP client), `TaskFormValidator` and the date helpers.
- **Route tests** (`src/test/routes`): every page, including validation errors, `404`s and an unavailable API. They use a fake `TaskApiClient`, so they do not need the backend running.

## Project structure

```
src/main/
├── app.ts                          # createApp(): sets up Express, routes and error handling
├── server.ts                       # Starts the server
├── controllers/TaskController.ts   # Request handlers for the task pages
├── services/TaskApiClient.ts       # Calls the backend API
├── validation/TaskFormValidator.ts # Validates the create task form
├── models/Task.ts                  # Task types, TaskStatus enum and display labels
├── utils/dates.ts                  # Date formatting and overdue check
├── routes/tasks.ts                 # Maps URLs to controller methods
├── modules/nunjucks/               # Template setup, filters and globals
└── views/
    ├── tasks/                      # list, show, new and delete pages
    ├── macros/status-tag.njk       # Coloured status tag
    ├── error.njk
    └── not-found.njk
```

## Design

Each class has a single responsibility:

```
Route → TaskController → TaskApiClient → backend API
               ↓
       TaskFormValidator
```

- **`TaskApiClient`** hides all HTTP details. It turns API errors into `HTTPError`s (`404`, `502`, `503`) so the rest of the app never deals with Axios. Its Axios instance is passed into the constructor, so the tests can supply a mock.
- **`TaskFormValidator`** checks the form (including impossible dates such as 31 February) and builds the request for the API. Validation happens in the frontend so users get clear, field-level messages, and the API validates again.
- **`TaskController`** handles requests and chooses what to render or where to redirect. It receives its client and validator through the constructor.
- **`createApp(client)`** builds the Express app around a given `TaskApiClient`. The real app uses one that points at `TASK_API_URL`, and the route tests pass in a fake.

## Possible improvements

- Edit a task's title, description and due date
- CSRF protection on forms
- Filter and sort tasks (for example by status, or overdue first)
- Pagination for long task lists
- End-to-end and accessibility tests against both services running together
