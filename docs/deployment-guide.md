# CCSCloud Deployment Guide — SkyEase Airline Reservation System

## Prerequisites

- CCSCloud server access (SSH credentials from your instructor)
- Node.js installed on the CCSCloud server
- MongoDB available (either local on CCSCloud or MongoDB Atlas)
- Git installed on the server

## Step 1: Connect to CCSCloud

```bash
ssh <your-username>@<ccscloud-hostname>
```

## Step 2: Clone the Repository

```bash
git clone https://github.com/TerrenceP415/CCDEVAP-MCO-Group-7.git
cd CCDEVAP-MCO-Group-7
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Update the following values in `.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/skyEase
SESSION_SECRET=<generate-a-strong-random-string>
NODE_ENV=production
```

**For MongoDB Atlas** (if not using local MongoDB):
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skyEase?retryWrites=true&w=majority
```

## Step 5: Seed the Database (Optional)

If the database is empty, run the seeders:
```bash
node seeds/seedFlights.js
node seeds/seedUsers.js
```

## Step 6: Start the Application

```bash
npm start
```

For running in the background (persists after SSH disconnect):
```bash
nohup npm start > app.log 2>&1 &
```

Or using PM2 (if installed):
```bash
pm2 start app.js --name skyease
pm2 save
```

## Step 7: Access the Application

Open your browser and navigate to:
```
http://<ccscloud-hostname>:3000
```

## Post-Deployment Verification Checklist

- [ ] Application loads at the deployment URL
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

## Troubleshooting

### Application won't start
- Check that MongoDB is running: `sudo systemctl status mongod`
- Verify `.env` file exists and has correct values
- Check logs: `cat app.log` or `pm2 logs skyease`

### Cannot connect to MongoDB
- Ensure MongoDB is running and accepting connections
- For Atlas: whitelist the CCSCloud server IP in Atlas Network Access

### Session issues in production
- Ensure `NODE_ENV=production` is set in `.env`
- The app automatically sets `trust proxy` and secure cookies in production mode
