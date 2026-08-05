# CCSCloud Deployment Guide — SkyEase Airline Reservation System

## Server Credentials

| Field                     | Value                    |
| ------------------------- | ------------------------ |
| **Proxmox Host**          | ccscloud.dlsu.edu.ph     |
| **Proxmox Username**      | CCDEVAP24                |
| **Proxmox Password**      | jM64BVWGTUGt             |
| **Proxmox Realm**         | Proxmox VE               |
| **Node**                  | Hanan                    |
| **VM ID**                 | 20124                    |
| **VM Name**               | CCDEVAP24-Server         |
| **VM (Ubuntu) Username**  | root                     |
| **VM (Ubuntu) Password**  | jM64BVWGTUGt             |
| **VM Internal IP**        | 10.2.14.24/16            |

### Port Mappings (External → Internal)

| Service   | External Port | Internal Port |
| --------- | ------------- | ------------- |
| HTTP      | 60124         | 80            |
| SSH       | 60424         | 22            |
| MySQL     | 60724         | 3306          |
| HTTPS     | 60924         | 443           |

> **Important:** The external URL for the deployed app will be:
> ```
> http://ccscloud.dlsu.edu.ph:60124
> ```

---

## Prerequisites

- CCSCloud Proxmox access (see credentials above)
- SSH client (built into macOS/Linux; use Windows Terminal or PuTTY on Windows)

---

## Step 1: Access the Proxmox Web Console

1. Open your browser and go to:
   ```
   https://ccscloud.dlsu.edu.ph
   ```
2. Login with:
   - **Username:** CCDEVAP24
   - **Password:** jM64BVWGTUGt
   - **Realm:** Proxmox VE
3. Navigate to **Node: Hanan → VM 20124 (CCDEVAP24-Server)**
4. Start the VM if it's not already running.

---

## Step 2: SSH into the VM

From your local terminal:
```bash
ssh root@ccscloud.dlsu.edu.ph -p 60424
```
**Password:** `jM64BVWGTUGt`

> **Tip:** If you get a host key warning, type `yes` to continue.

---

## Step 3: Install Required Software

Update the system and install Node.js, npm, MongoDB, nginx, and Git:

```bash
# Update packages
apt update && apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node -v
npm -v

# Install MongoDB
apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start MongoDB and enable on boot
systemctl start mongod
systemctl enable mongod

# Install nginx (reverse proxy)
apt install -y nginx

# Install Git
apt install -y git
```

---

## Step 4: Clone the Repository

```bash
cd /root
git clone https://github.com/TerrenceP415/CCDEVAP-MCO-Group-7.git
cd CCDEVAP-MCO-Group-7
```

---

## Step 5: Install Dependencies

```bash
npm install
```

---

## Step 6: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Set the following values:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/skyEase
SESSION_SECRET=skyease_prod_jM64BVWGTUGt_secret_2024
NODE_ENV=production
```

> **Note:** Since we serve over HTTP (not HTTPS), the app's `secure: true` cookie setting in production will cause login issues. See Step 7 below for the fix.

---

## Step 7: Fix Secure Cookies for HTTP Deployment

The app sets `secure: true` on cookies when `NODE_ENV=production`, but CCSCloud uses plain HTTP. Update the session config in `app.js`:

**Option A — Set `NODE_ENV=production` but keep `secure: false`:**

In `app.js`, change the cookie config (around line 62-66):
```js
cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false   // CCSCloud uses HTTP, not HTTPS
}
```

**Option B — Use a `COOKIE_SECURE` env variable** (recommended):

In `app.js`:
```js
cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true'
}
```
Then in `.env`:
```env
COOKIE_SECURE=false
```

---

## Step 8: Configure Nginx Reverse Proxy

CCSCloud maps external port **60124 → internal port 80**. Since the app runs on port 3000, nginx will proxy port 80 → 3000.

```bash
nano /etc/nginx/sites-available/skyease
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name ccscloud.dlsu.edu.ph;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart nginx:

```bash
ln -s /etc/nginx/sites-available/skyease /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default   # Remove default site
nginx -t                               # Test configuration
systemctl restart nginx
systemctl enable nginx
```

---

## Step 9: Seed the Database

```bash
cd /root/CCDEVAP-MCO-Group-7
node seeds/seedFlights.js
node seeds/seedUsers.js
```

---

## Step 10: Start the Application

### Using PM2 (Recommended — auto-restarts on crash/reboot)

```bash
npm install -g pm2

cd /root/CCDEVAP-MCO-Group-7
pm2 start app.js --name skyease
pm2 save
pm2 startup    # Follow the output command to enable auto-start on boot
```

### Alternative: Using nohup

```bash
cd /root/CCDEVAP-MCO-Group-7
nohup npm start > app.log 2>&1 &
```

---

## Step 11: Access the Application

Open your browser and navigate to:
```
http://ccscloud.dlsu.edu.ph:60124
```

---

## Test Accounts

Create these accounts after deployment for the instructor to verify:

### Administrator Account
- **Email:** admin@skyease.com
- **Password:** Admin123!
- **Role:** admin

### Passenger Account
- **Email:** passenger@skyease.com
- **Password:** Passenger123!
- **Role:** passenger

> **Note:** The admin account needs to be created with the `admin` role set directly in the database since the registration form defaults to `passenger`. Use the MongoDB shell:
> ```bash
> mongosh
> use skyEase
> db.users.updateOne({ email: "admin@skyease.com" }, { $set: { role: "admin" } })
> ```

---

## Post-Deployment Verification Checklist

- [ ] Application loads at `http://ccscloud.dlsu.edu.ph:60124`
- [ ] User registration works
- [ ] Login works for both admin and passenger accounts
- [ ] Protected pages redirect unauthenticated users to login
- [ ] Admin can access: Dashboard, Flights, Users, Reservations, Audit Log
- [ ] Passengers cannot access admin pages
- [ ] Flight search works
- [ ] Booking a flight works
- [ ] Viewing "My Reservations" works
- [ ] Cancelling a reservation works
- [ ] Admin can create/update/delete flights
- [ ] Admin can create/delete reservations
- [ ] Audit log records all activities
- [ ] Admin can view the Audit Log page with filters
- [ ] Session persists correctly across page navigations
- [ ] Logout destroys the session properly

---

## Useful Commands Reference

```bash
# SSH into the server
ssh root@ccscloud.dlsu.edu.ph -p 60424

# Check app status
pm2 status
pm2 logs skyease

# Restart the app
pm2 restart skyease

# Check nginx status
systemctl status nginx

# Check MongoDB status
systemctl status mongod

# View app logs (if using nohup)
tail -f /root/CCDEVAP-MCO-Group-7/app.log

# Pull latest code and redeploy
cd /root/CCDEVAP-MCO-Group-7
git pull origin main
npm install
pm2 restart skyease
```

---

## Troubleshooting

### Application won't start
- Check that MongoDB is running: `sudo systemctl status mongod`
- Verify `.env` file exists and has correct values
- Check logs: `pm2 logs skyease` or `cat app.log`

### Cannot connect to MongoDB
- Ensure MongoDB is running and accepting connections on port 27017
- Check: `mongosh --eval "db.runCommand({ping: 1})"`

### Session / Login issues
- If login succeeds but redirects back to login, the `secure: true` cookie flag is the cause
- Ensure `secure: false` in the cookie config (see Step 7)
- Clear browser cookies and try again

### 502 Bad Gateway from nginx
- The Node.js app isn't running — start it with `pm2 start app.js --name skyease`
- Check if the app is listening: `curl http://127.0.0.1:3000`

### Cannot SSH into the server
- Make sure you're using port **60424**: `ssh root@ccscloud.dlsu.edu.ph -p 60424`
- Check if the VM is running in Proxmox console

### Port 80 already in use
- Check what's using it: `lsof -i :80`
- If Apache is installed, stop it: `systemctl stop apache2 && systemctl disable apache2`
