# BikeFix Club — Deployment & Operations Guide

**Application:** BikeFix Club  
**Tech Stack:** React 18 + Vite 6 (Frontend), PHP 8.2+ REST API + PDO (Backend), MySQL 8+ / 9.5 (Database)  
**Target Environments:** Local Development (XAMPP / Node.js) and Production Linux Server (Ubuntu 22.04 LTS / Nginx / PHP-FPM)

---

## 1. Local Development Setup (Windows / XAMPP)

### Prerequisites
1. **XAMPP / PHP 8.2+** installed (with extensions: `pdo_mysql`, `curl`, `mbstring`, `openssl`).
2. **MySQL Server 8+ or 9.5** running on `127.0.0.1:3306`.
3. **Node.js LTS (v18+)** and `npm`.

### Step 1: Database Migration & Seeding
Ensure MySQL service is running, then run the migration script:
```bash
cd "v:\BikeFix Club"
& "V:\XAMPP\php\php.exe" database/migrate.php
```
This executes `database/schema.sql` (creating 24 tables) followed by `database/seed-development.sql`.

### Step 2: Configure Environment Variables
Verify `backend/.env`:
```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bikefix_club
DB_USER=root
DB_PASS=sathish
JWT_SECRET=super_secret_bikefix_club_jwt_key_2026_xyz
APP_ENV=development
APP_DEBUG=true
RAZORPAY_KEY_ID=rzp_test_bikefix_sandbox
RAZORPAY_KEY_SECRET=bikefix_secret_sandbox
```

### Step 3: Run Backend Server
Start the PHP built-in web server listening on port 8000:
```powershell
& "V:\XAMPP\php\php.exe" -S 127.0.0.1:8000 -t "v:\BikeFix Club\backend\public" "v:\BikeFix Club\backend\public\index.php"
```

### Step 4: Run Frontend Development Server
```bash
cd "v:\BikeFix Club\frontend"
npm install
npm run dev -- --host 127.0.0.1
```
The application will be accessible at `http://127.0.0.1:5173/`.  
Vite automatically proxies all `/api` calls to `http://127.0.0.1:8000`.

---

## 2. Production Deployment (Ubuntu Linux + Nginx + PHP-FPM)

### Architecture
```
[ User Browser / Mobile ]
           │
           ▼
[ Nginx Reverse Proxy (Port 80/443 SSL) ]
   ├── /api/  ──> FastCGI Proxy to PHP-FPM (8.2) ──> MySQL Database
   └── /*     ──> Static Files (/var/www/bikefix-club/frontend/dist)
```

### Step 1: Server Provisioning
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-curl php8.2-mbstring php8.2-xml git nodejs npm
```

### Step 2: Clone & Build Frontend
```bash
cd /var/www
git clone https://github.com/your-org/bikefix-club.git
cd /var/www/bikefix-club/frontend
npm ci
npm run build
```
The compiled assets will reside in `/var/www/bikefix-club/frontend/dist`.

### Step 3: Configure PHP Backend
```bash
cd /var/www/bikefix-club/backend
cp .env.example .env
nano .env # Set production DB credentials, strong JWT_SECRET, and disable APP_DEBUG
chown -R www-data:www-data /var/www/bikefix-club/backend
chmod -R 755 /var/www/bikefix-club/backend
```

### Step 4: Nginx Configuration
Create `/etc/nginx/sites-available/bikefixclub.com`:
```nginx
server {
    listen 80;
    server_name bikefixclub.com www.bikefixclub.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bikefixclub.com www.bikefixclub.com;

    ssl_certificate /etc/letsencrypt/live/bikefixclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bikefixclub.com/privkey.pem;

    root /var/www/bikefix-club/frontend/dist;
    index index.html;

    # Frontend Single Page App fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API routing
    location /api/ {
        root /var/www/bikefix-club/backend/public;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/bikefix-club/backend/public/index.php;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Enable site and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/bikefixclub.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. Backup & Maintenance Procedures

### Daily Database Backup (Cronjob)
```bash
# Add to /etc/cron.daily/bikefix_backup
#!/bin/bash
BACKUP_DIR="/var/backups/bikefix_club"
mkdir -p $BACKUP_DIR
mysqldump -u root -p'YOUR_SECRET_DB_PASSWORD' bikefix_club | gzip > "$BACKUP_DIR/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz"
find $BACKUP_DIR -type f -mtime +14 -delete
```

### Health Monitoring Endpoint
- Perform automated external uptime pings to:  
  `https://bikefixclub.com/api/v1/health`
- Expected payload returns:
  ```json
  { "status": "healthy", "database": "connected", "app": "BikeFix Club API" }
  ```
