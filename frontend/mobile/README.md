# SteadyAI Mobile

The Expo member app connects to the existing SteadyAI backend and database. It includes member sign-in, AI coach chat and history, nutrition logging, workout history, reports, community, challenge check-ins, store listings, and account settings.

## Run locally

1. Start PostgreSQL and the backend using the repository's backend setup.
2. From this directory install dependencies and start Expo:

   ```powershell
   npm install
   npx expo start
   ```

3. Use the Expo app to open the app on a simulator or device.

The default API address is `http://localhost:3000` for iOS Simulator and `http://10.0.2.2:3000` for the Android emulator. A physical phone cannot use either loopback address to reach your computer. Create `frontend/mobile/.env.local` and set the computer's LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:3000
```

Replace `192.168.1.25` with the computer's current LAN IP, ensure the phone and computer are on the same network, and restart Expo after changing the value. The backend must listen on an interface reachable from the phone and allow the backend port through the local firewall.

## Validate

```powershell
npm run typecheck
```
