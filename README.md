
# RS Timer - A PWA Pomodoro Focus App

RS Timer is a Progressive Web App (PWA) built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit. It's designed to help you enhance focus and productivity using the Pomodoro Technique, with AI-powered session analysis and customizable features.

## Features

*   Customizable Pomodoro, Short Break, and Long Break timers.
*   Selectable soundscapes for work and break periods.
*   AI-powered session summarization and improvement suggestions (using Genkit).
*   Task list to manage your session's to-dos.
*   Session notes with context selection (Work, Learning, General) for tailored AI feedback.
*   Session history tracking.
*   Themeable (Light/Dark mode).
*   Multiple background animations (Rain, Snow, Starfield, Bubbles, Gradient).
*   Mouse trail effect (optional).
*   Interactive user guide and initial coach marks.
*   PWA-ready for offline use and app-like installation.
*   Dockerized for easy deployment.

## Prerequisites

*   **Node.js**: Version 18.x or 20.x recommended.
*   **npm** (usually comes with Node.js).
*   **Docker and Docker Compose** (for Docker-based setup).
*   **Git** (for cloning the repository).

## Environment Setup

This application uses Genkit with Google AI (Gemini). You'll need a Google AI API key.

1.  Create a `.env` file in the root of your project:
    ```bash
    touch .env
    ```
2.  Add your Google AI API key to the `.env` file:
    ```env
    GOOGLE_API_KEY="your_actual_google_api_key_here"
    ```
    Replace `"your_actual_google_api_key_here"` with your actual API key.

## Installation and Running (Manual)

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up your `.env` file** as described in "Environment Setup" above.

4.  **Run the development server**:
    This command starts the Next.js development server, typically on `http://localhost:9002`.
    ```bash
    npm run dev
    ```
    *Note: The `dev` script in `package.json` is configured to run on port `9002`.*

5.  **Run Genkit development server (optional, for Genkit UI)**:
    If you want to use the Genkit Developer UI to inspect flows, traces, etc., run this in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Or for auto-reloading on Genkit file changes:
    ```bash
    npm run genkit:watch
    ```
    The Genkit UI typically runs on `http://localhost:4000`.

6.  **Access the application**: Open your browser and go to `http://localhost:9002`.

### Building for Production (Manual)

1.  **Build the application**:
    ```bash
    npm run build
    ```
2.  **Start the production server**:
    ```bash
    npm run start
    ```
    This will typically start the server on `http://localhost:3000`.

## Installation and Running (Docker)

1.  **Prerequisites**:
    *   Ensure Docker and Docker Compose are installed on your system.
    *   Clone the repository (if applicable).

2.  **Set up your `.env` file** as described in "Environment Setup" above.
    The `docker-compose.yml` file is configured to pick up environment variables, but for sensitive keys like `GOOGLE_API_KEY`, it's best to pass them directly to your Docker environment if deploying, or ensure your `.env` file is correctly configured if `docker-compose.yml` is set to read it (it currently expects them to be set in the environment it runs in, or you can uncomment the volume mount for `.env` in `docker-compose.yml` for local Docker development - **be cautious with committing `.env` files containing secrets**).

3.  **Build the Docker image**:
    From the project root directory:
    ```bash
    docker-compose build
    ```

4.  **Run the application using Docker Compose**:
    ```bash
    docker-compose up
    ```
    To run in detached mode (in the background):
    ```bash
    docker-compose up -d
    ```

5.  **Access the application**: Open your browser and go to `http://localhost:3000`.

6.  **Stopping the application**:
    If running in the foreground, press `Ctrl+C`.
    If running in detached mode:
    ```bash
    docker-compose down
    ```

## Available Scripts

*   `npm run dev`: Starts the Next.js development server (with Turbopack) on port 9002.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with file watching.
*   `npm run build`: Builds the Next.js application for production.
*   `npm run start`: Starts the Next.js production server.
*   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
*   `npm run typecheck`: Runs TypeScript to check for type errors.
```