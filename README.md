# Around the World

Around the World is a responsive photo-sharing application built with vanilla
JavaScript as part of TripleTen's frontend development curriculum. Users can
manage their profile, share places, and interact with photo cards. A REST API
stores profile information, cards, and likes across page reloads.

[View the live application](https://daniel-fernandez25.github.io/web_project_around_es/)

## Features

- Loads the current user's profile and cards from the server.
- Updates the user's name, description, and profile picture.
- Creates new place cards from validated form data.
- Adds and removes likes while keeping the interface synchronized with the API.
- Allows users to delete their own cards after confirming the action.
- Opens card images in a dedicated preview popup.
- Provides client-side form validation and loading feedback during requests.
- Shows a spinner while the initial profile and card data are being requested.
- Replaces the main content with a dedicated error section if initial loading fails.
- Displays non-blocking error notifications when a request fails.
- Adapts the layout and interface controls for desktop and mobile screens.

## How It Works

### Initial Data and Page States

The application requests the current user and initial cards together using
`Promise.all()`. It saves the user's ID before rendering cards so each card can
determine whether its delete button should be available.

The initial HTML and CSS define the loading state. The request handlers then
switch the interface to the appropriate result:

| State   | Spinner | Profile and Cards | Load Error Section |
| ------- | ------- | ----------------- | ------------------ |
| Loading | Visible | Hidden            | Hidden             |
| Success | Hidden  | Visible           | Hidden             |
| Failure | Hidden  | Hidden            | Visible            |

The spinner tracks the API data requests. Image URLs arrive in the JSON
responses; assigning them to image elements starts separate downloads. The
page can therefore show its content while photos are still loading. Waiting
for images, image placeholders, and fallback images are not implemented yet.
Reloading the page retries initial loading; there is no dedicated Retry button.

### UI and API Responsibilities

`scripts/index.js` connects UI callbacks to API requests. Persistent changes to
profiles, cards, and likes are reflected in the interface after successful
server responses. Failed requests are reported through toast notifications.

| Module                 | Responsibility                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| `Api`                  | Sends requests, checks HTTP responses, and returns parsed data.  |
| `Card`                 | Creates card elements and manages their visual state and events. |
| `Section`              | Renders collections and inserts elements into the card list.     |
| `UserInfo`             | Reads and updates the displayed profile and stores the user ID.  |
| `Popup` and subclasses | Manage forms, image previews, and deletion confirmation.         |
| `FormValidator`        | Validates inputs and controls form submit-button availability.   |
| `NotificationToast`    | Displays dismissible error messages with an automatic timeout.   |

Initial cards are appended in the order supplied by the API. Newly created
cards are prepended so they appear at the beginning of the list immediately.

## Technologies

- Semantic HTML5
- CSS3, responsive design, and the BEM naming methodology
- JavaScript ES6 modules
- Object-oriented JavaScript and class inheritance
- Fetch API, Promises, and REST API integration
- Client-side form validation
- Git, GitHub, and GitHub Actions
- GitHub Pages for static hosting

## Project Structure

```text
.github/workflows/  GitHub Pages deployment workflow
docs/              Study backlog and learning notes
src/               Main HTML document
blocks/            BEM CSS blocks
components/        Reusable JavaScript classes
scripts/           Application setup, configuration, and UI coordination
pages/             Main CSS entry point
images/            Interface assets and the custom avatar image
vendor/            Fonts and normalized browser styles
```

## Running the Project Locally

No dependency installation or local build step is required.

1. Clone the repository and open its root folder in your editor.
2. Ensure the `Api` instance in `scripts/index.js` is configured with a valid
   personal token supplied for the course API. Requests use the
   `authorization` header and the base URL
   `https://around-api.es.tripleten-services.com/v1`.
3. Serve the repository root with a local static server, such as the VS Code
   Live Server extension.
4. Open `/src/index.html` through that server.

A directory listing at the server's root is expected because the HTML entry
point is inside `src/`. Keep the repository root as the server root: the HTML
references sibling folders containing CSS, JavaScript, and images. A local
server is needed to run the JavaScript modules instead of opening the HTML as
a local file.

## Deployment

Pushing to `main` triggers the workflow in `.github/workflows/deploy.yml`.
It prepares a `dist/` directory containing the HTML from `src/` and the
application's asset folders. The workflow adjusts the HTML's relative asset
paths for this published layout and deploys the result to GitHub Pages.

The published entry point is at the site's root, unlike the local
`/src/index.html` path. Files from `images/` are also published, allowing the
application to use its own hosted image URLs. Check the workflow in GitHub's
Actions tab when verifying a deployment.

## Manual Verification

There is no automated test suite configured. Before publishing changes:

- Check that successful initial loading hides the spinner and error section,
  then displays the profile and cards.
- Use network throttling to observe the loading state and subsequent image
  downloads.
- Simulate a failed API request and verify that the spinner stops, the main
  content stays hidden, and the error section appears. Restore normal test
  conditions before committing or publishing.
- Check profile and avatar updates, card creation, likes, image previews, and
  deletion confirmation, including their failure feedback.
- Verify the layout at desktop and mobile widths and check the deployed page
  after a successful GitHub Actions run.
