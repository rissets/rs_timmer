
# RS Timer - A PWA Pomodoro Focus App

RS Timer is a Progressive Web App (PWA) built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit. It's designed to help you enhance focus and productivity using the Pomodoro Technique, with AI-powered session analysis and customizable features. It now includes Firebase authentication for user management.

## Features

*   User Authentication: Registration, Login, Forgot Password.
*   Protected main application page, accessible only after login.
*   Customizable Pomodoro, Short Break, and Long Break timers.
*   Selectable soundscapes for work and break periods.
*   AI-powered session summarization and improvement suggestions (using Genkit).
*   Task list to manage your session's to-dos.
*   Session notes with context selection (Work, Learning, General) for tailored AI feedback.
*   Session history tracking.
*   Themeable (Light/Dark mode).
*   Multiple background animations (Rain, Snow, Starfield, Bubbles, Gradient, Fireflies).
*   Mouse trail effect (optional).
*   Interactive user guide and initial coach marks.
*   PWA-ready for offline use and app-like installation.
*   Multi-language support (English, Indonesian).
*   Dockerized for easy deployment.
*   AI Chat Widget for quick assistance.
*   Session Dictionary feature with Markdown export.

## Prerequisites (for Local Development)

*   **Node.js**: Version 18.x or 20.x recommended.
*   **npm** (usually comes with Node.js).
*   **Git** (for cloning the repository).
*   **Firebase Project**: You need to set up a Firebase project and enable Email/Password authentication.

## Environment Setup (Local Development)

This application uses Genkit with Google AI (Gemini) and Firebase for authentication.

1.  **Firebase Setup**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Create a new Firebase project (or use an existing one).
    *   In your project, navigate to "Authentication" (under Build menu) and enable the "Email/Password" sign-in method on the "Sign-in method" tab.
    *   Go to Project Settings (click the gear icon next to "Project Overview").
    *   Under the "General" tab, scroll down to "Your apps". If you don't have a web app, click "Add app" and select the web platform (</> icon).
    *   Register your app (you can give it a nickname). Firebase Hosting setup is optional for now.
    *   After registering, you'll see your web app's Firebase configuration (it will look like `const firebaseConfig = { apiKey: "...", authDomain: "...", ... };`). You'll need these values.

2.  Create a `.env` file in the root of your project:
    ```bash
    touch .env
    ```
3.  Add your Google AI API key and Firebase configuration to the `.env` file. Replace placeholders with your actual credentials:
    ```env
    # Genkit Google AI API Key
    GOOGLE_API_KEY="your_actual_google_ai_api_key_here"

    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_firebase_measurement_id" # Optional, for Analytics
    ```

## Installation and Running (Local Development - Manual)

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up your `.env` file** as described in "Environment Setup (Local Development)" above.

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

6.  **Access the application**: Open your browser and go to `http://localhost:9002`. You will be redirected to the login page if not authenticated.

## Deployment

This section provides guidance on deploying the RS Timer application to a server.

### Method 1: Deploying to a Server/VPS (Manual)

This method involves building the Next.js application and running its standalone server output, typically behind a reverse proxy like Nginx.

**Prerequisites on the Server:**

*   **Node.js**: Version 18.x or 20.x.
*   **npm** or **yarn**.
*   A **process manager** like `pm2` is highly recommended to keep the application running and manage logs.
*   A **reverse proxy** (e.g., Nginx, Apache) to handle incoming traffic, SSL termination, and serve static assets efficiently.

**Deployment Steps:**

1.  **Build the Application:**
    On your local machine or a CI/CD server, build the application for production:
    ```bash
    npm run build
    ```
    This command utilizes the `output: 'standalone'` configuration in `next.config.ts` to create an optimized build in the `.next/standalone` directory.

2.  **Transfer Files to Server:**
    Copy the following to your server (e.g., to `/var/www/rs-timer`):
    *   The entire `.next/standalone` directory.
    *   The `public` directory (for static assets like icons and manifest).
    *   Your `package.json` (the standalone output should include necessary `node_modules`, but `package.json` might be needed by some process managers or for context).

3.  **Set Up Environment Variables on Server:**
    Create a `.env` file in the root of your deployed application directory (e.g., `/var/www/rs-timer/.env`) with your production `GOOGLE_API_KEY` and Firebase configuration:
    ```env
    NODE_ENV=production
    
    # Genkit Google AI API Key
    GOOGLE_API_KEY="your_production_google_ai_api_key"

    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="your_production_firebase_api_key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_production_firebase_auth_domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_production_firebase_project_id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_production_firebase_storage_bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_production_firebase_messaging_sender_id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your_production_firebase_app_id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_production_firebase_measurement_id"
    
    # You might need to set the PORT if your reverse proxy expects a specific port
    # PORT=3000 
    ```
    Alternatively, configure these environment variables directly in your server's environment or through your process manager.

4.  **Run the Application:**
    Navigate to the standalone directory on your server:
    ```bash
    cd /var/www/rs-timer/.next/standalone
    ```
    Start the Next.js server:
    ```bash
    node server.js
    ```
    The application will typically run on port 3000 by default unless specified by the `PORT` environment variable.

5.  **Use a Process Manager (Recommended):**
    Use `pm2` to run your application reliably:
    ```bash
    # Install pm2 globally if you haven't already
    # npm install pm2 -g 

    # Start the application with pm2 from the standalone directory
    cd /var/www/rs-timer/.next/standalone
    pm2 start server.js --name rs-timer
    
    # To ensure pm2 restarts on server reboot
    pm2 startup
    pm2 save
    ```

6.  **Configure Reverse Proxy (Example with Nginx):**
    Set up Nginx (or another reverse proxy) to forward requests to your Next.js application, handle SSL, and serve static assets.
    Create an Nginx server block configuration (e.g., in `/etc/nginx/sites-available/rs-timer`):
    ```nginx
    server {
        listen 80;
        listen [::]:80; # For IPv6
        server_name yourdomain.com www.yourdomain.com; # Replace with your domain

        # Redirect HTTP to HTTPS (if using SSL)
        # return 301 https://$host$request_uri;

        # For SSL (recommended, use Certbot for free certificates)
        # listen 443 ssl http2;
        # listen [::]:443 ssl http2;
        # server_name yourdomain.com www.yourdomain.com;
        # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        # include /etc/letsencrypt/options-ssl-nginx.conf;
        # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            proxy_pass http://localhost:3000; # Assuming Next.js runs on port 3000
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Serve PWA static files directly for better performance
        location ~ ^/(manifest\.json|favicon\.ico|icons/) {
            root /var/www/rs-timer/public; # Path to your public directory
            try_files $uri =404;
        }
    }
    ```
    Enable the site and restart Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/rs-timer /etc/nginx/sites-enabled/
    sudo nginx -t # Test configuration
    sudo systemctl restart nginx
    ```

### Method 2: Deploying with Docker

This application includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.

**Prerequisites on the Server:**

*   **Docker**: Install Docker Engine.
*   **Docker Compose**: Install Docker Compose (if using `docker-compose.yml`).

**Deployment Steps:**

1.  **Transfer Project to Server:**
    Copy your entire project directory (or clone it from Git) to your server.

2.  **Set Up Environment Variables:**
    Create a `.env` file in the project root on your server with your production credentials (see example in Manual Deployment Step 3).
    The `docker-compose.yml` is configured to use variables set in the environment it runs in. You can also directly specify an `env_file` in `docker-compose.yml` or pass variables via `docker run --env-file .env ...`. **Do not commit `.env` files with secrets to Git.**

3.  **Build the Docker Image:**
    From the project root directory on your server:
    ```bash
    docker-compose build
    ```
    Or, if not using Docker Compose, build directly with Docker:
    ```bash
    docker build -t rs-timer-app .
    ```

4.  **Run the Application:**
    Using Docker Compose:
    ```bash
    docker-compose up -d # -d runs in detached mode
    ```
    Or, if you built with `docker build` directly:
    ```bash
    # Ensure your .env file is in the current directory or provide the full path
    docker run -d -p 3000:3000 --env-file .env --name rs-timer-container rs-timer-app
    ```
    This maps port 3000 of the host to port 3000 in the container.

5.  **Access the Application:**
    Open your browser and go to `http://your_server_ip:3000`.

6.  **Reverse Proxy (Optional but Recommended):**
    Even with Docker, use a reverse proxy like Nginx on the host machine for SSL, custom domains, etc. The Nginx configuration would proxy requests to the port exposed by Docker (e.g., `http://localhost:3000`).

### Setting Up a Custom Domain with Cloudflare

Cloudflare can provide DNS management, SSL, CDN, and security for your deployed application.

**Prerequisites:**

*   A deployed RS Timer application accessible via an IP address and port.
*   A registered domain name (e.g., `yourdomain.com`).
*   A Cloudflare account.

**Setup Steps:**

1.  **Add Your Domain to Cloudflare:**
    *   Log in to your Cloudflare account.
    *   Click "Add a Site" and enter your domain name.
    *   Cloudflare will query your existing DNS records. Review them.

2.  **Update Nameservers:**
    *   Cloudflare will provide you with two nameservers.
    *   Go to your domain registrar (where you bought your domain) and update your domain's nameservers to the ones provided by Cloudflare.
    *   DNS propagation can take some time (minutes to hours).

3.  **Configure DNS Records in Cloudflare:**
    *   Once your domain is active on Cloudflare, go to the "DNS" settings for your domain.
    *   Add an `A` record:
        *   **Type:** `A`
        *   **Name:** `@` (for the root domain, e.g., `yourdomain.com`) or `www` (for `www.yourdomain.com`)
        *   **IPv4 address:** Your server's public IP address.
        *   **Proxy status:** "Proxied" (orange cloud icon) is recommended for Cloudflare's benefits (CDN, SSL, DDoS protection). If you want Cloudflare to only act as DNS, set it to "DNS only" (grey cloud).
    *   If you have an IPv6 address, add an `AAAA` record similarly.

4.  **Configure SSL/TLS:**
    *   In Cloudflare, go to "SSL/TLS" settings.
    *   **Overview Tab:** Choose an SSL/TLS encryption mode:
        *   **Full (Strict):** Most secure. Encrypts traffic end-to-end, and Cloudflare validates the SSL certificate on your origin server. You'll need a valid SSL certificate on your server (e.g., from Let's Encrypt, often handled by your Nginx setup).
    *   **Edge Certificates Tab:** Ensure "Always Use HTTPS" is enabled to redirect HTTP traffic to HTTPS.

5.  **Wait for Propagation:**
    DNS and SSL changes can take time.

6.  **Verify:**
    Access your RS Timer application via `https://yourdomain.com`.

## Available Scripts (for Local Development)

*   `npm run dev`: Starts the Next.js development server (with Turbopack) on port 9002.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with file watching.
*   `npm run build`: Builds the Next.js application for production.
*   `npm run start`: Starts the Next.js production server (after `npm run build`, not for standalone output deployment).
*   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
*   `npm run typecheck`: Runs TypeScript to check for type errors.

## PWA (Progressive Web App)

This application is configured as a PWA.
*   **Manifest:** `public/manifest.json`
*   **Service Worker:** Handled by `next-pwa`.
*   Modern browsers will automatically offer an "Install" or "Add to Home Screen" option if the PWA criteria are met when accessed over HTTPS.
