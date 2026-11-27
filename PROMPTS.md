# Project Prompts

A chronological collation of all user prompts used to build **BusWatch SG**.

---

## Prompt 1 — Initial Frontend Application

```text
1. Build me a Singapore-based bus application that tracks real-time bus arrival times and include search bar to input bus stop code for quick access to arrival data and favorites functionality. 

2. Build just the front end for now, I will establish an API connection later.
```

---

## Prompt 2 — Resume After Unexpected Error

```text
There was an unexpected error. Finish what you were doing.
```

---

## Prompt 3 — LTA DataMall v3 Serverless API Integration

```text
1. add a serverless connection that pulls data frmo LTA's data mall using the following end-points:

Next buses at a stop (v3, the current version; refreshes every 20 seconds):
https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121
To ask about one service only, add &ServiceNo=7

Every request needs the header: AccountKey: <LTA_ACCOUNT_KEY>

2. store this in /api at project root level (not the src file)
3. include a /health.ts and /busarrival.ts within the same subfolder
4. do not hardcode any key, i will input them manually
```

---

## Prompt 4 — Vercel Build Dependency Fix

```text
encountered errors, please fix:

10:17:37.113 Running build in Washington, D.C., USA (East) – iad1
10:17:37.114 Build machine configuration: 2 cores, 8 GB
10:17:37.256 Cloning github.com/gurgkle/bus-when (Branch: main, Commit: 2f1f385)
10:17:37.257 Previous build caches not available.
10:17:37.550 Cloning completed: 293.000ms
10:17:38.759 Running "vercel build"
10:17:38.778 Vercel CLI 66.6.0
10:17:39.602 Installing dependencies...
10:17:40.444 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
10:17:54.429 npm error code ERESOLVE
10:17:54.430 npm error ERESOLVE could not resolve
10:17:54.430 npm error
10:17:54.431 npm error Found: esbuild@0.25.12
10:17:54.432 npm error node_modules/esbuild
10:17:54.432 npm error   dev esbuild@"^0.25.0" from the root project
10:17:54.432 npm error
10:17:54.432 npm error Could not resolve dependency:
10:17:54.432 npm error peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.4.0
10:17:54.432 npm error node_modules/vite
10:17:54.432 npm error   vite@"^8.3.0" from the root project
10:17:54.432 npm error   peer vite@"^5.2.0 || ^6 || ^7 || ^8" from @tailwindcss/vite@4.3.5
10:17:54.432 npm error   node_modules/@tailwindcss/vite
10:17:54.433 npm error     @tailwindcss/vite@"^4.3.3" from the root project
10:17:54.434 npm error   1 more (@vitejs/plugin-react)
10:17:54.434 npm error
10:17:54.434 npm error Conflicting peer dependency: esbuild@0.28.2
10:17:54.434 npm error node_modules/tsx/node_modules/esbuild
10:17:54.434 npm error   peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.4.0
10:17:54.434 npm error node_modules/vite
10:17:54.434 npm error   vite@"^8.3.0" from the root project
10:17:54.434 npm error   peer vite@"^5.2.0 || ^6 || ^7 || ^8" from @tailwindcss/vite@4.3.5
10:17:54.434 npm error   node_modules/@tailwindcss/vite
10:17:54.434 npm error     @tailwindcss/vite@"^4.3.3" from the root project
10:17:54.434 npm error   1 more (@vitejs/plugin-react)
10:17:54.434 npm error
10:17:54.435 npm error Fix the upstream dependency conflict, or retry this command with --force or --legacy-peer-deps to accept an incorrect (and potentially broken) dependency resolution.
10:17:54.435 npm error
10:17:54.435 npm error
10:17:54.435 npm error For a full report see:
10:17:54.435 npm error /vercel/.npm/_logs/2026-11-27T02_17_39_887Z-eresolve-report.txt
10:17:54.436 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-11-27T02_17_39_887Z-debug-0.log
10:17:54.489 Error: [BUILD_UTILS_SPAWN_1] Command "npm install" exited with 1
```

---

## Prompt 5 — Prompt Collation

```text
Collate all prompts and store them in PROMPTS.md
```
