# WMS Admin Panel — Project README

## Project Structure

```
d:\ME\Intern\ssv\on1\
├── admin-panel/
│   └── wms admin/          ← Admin frontend (React + Vite + MUI)
├── supervisor-panel/
│   └── wms supervisor pannel/  ← Supervisor frontend
└── user/
    └── user/               ← Worker/User frontend

d:\ME\Intern\project\1-copy\   ← NestJS Backend
```

---

## Backend

- **Framework:** NestJS + Prisma + PostgreSQL (Render hosted)
- **Port:** `3000`
- **Base URL:** `http://localhost:3000`
- **API Prefix:** `/api/v1`
- **Database:** PostgreSQL (Render cloud)

### Start Backend
```bash
cd "d:\ME\Intern\project\1-copy"
npm run start:dev
```

### Backend API Endpoints

| Module | Method | Route | Auth |
|--------|--------|-------|------|
| Auth | POST | `/api/v1/auth/login` | Public |
| Auth | GET | `/api/v1/auth/profile` | JWT |
| Users | GET | `/api/v1/users` | JWT |
| Users | POST | `/api/v1/users` | Admin only |
| Users | GET | `/api/v1/users/:id` | JWT |
| Users | PATCH | `/api/v1/users/:id` | JWT |
| Users | PATCH | `/api/v1/users/:id/change-password` | JWT |
| Users | DELETE | `/api/v1/users/:id` | Admin only |
| Departments | GET | `/api/v1/departments` | JWT |
| Departments | POST | `/api/v1/departments` | Admin only |
| Departments | PATCH | `/api/v1/departments/:id` | Admin only |
| Departments | DELETE | `/api/v1/departments/:id` | Admin only |
| Sales Orders | GET | `/api/v1/sales-orders` | JWT |
| Sales Orders | POST | `/api/v1/sales-orders` | Admin only |
| Sales Orders | PATCH | `/api/v1/sales-orders/:id` | Admin only |
| Sales Orders | DELETE | `/api/v1/sales-orders/:id` | Admin only |
| Sales Orders | PUT | `/api/v1/sales-orders/:id/departments` | Admin only |
| Activity Logs | GET | `/api/v1/activity-logs` | JWT |
| Activity Logs | POST | `/api/v1/activity-logs` | JWT |
| Activity Logs | PATCH | `/api/v1/activity-logs/:id` | JWT |
| Dashboard | GET | `/api/v1/dashboard/summary` | JWT |

---

## Admin Frontend

- **Framework:** React 19 + TypeScript + Vite + Material UI v9
- **Port:** `5173`
- **Directory:** `d:\ME\Intern\ssv\on1\admin-panel\wms admin\`

### Start Admin Frontend
```bash
cd "d:\ME\Intern\ssv\on1\admin-panel\wms admin"
npm run dev
```

Open: http://localhost:5173

### Login Credentials (from backend DB)
- Use credentials seeded by `seed-all-data.js` or `add-admin.js` in the backend
- The login now calls the **real backend** at `POST /api/v1/auth/login`

### Pages & Routes

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Admin authentication |
| Dashboard | `/dashboard` | Overview metrics |
| User Management | `/user-management` | View/edit/delete users |
| Add User | `/add-user` | Create new user |
| User Profile | `/user-profile/:userId` | Individual user profile |
| Department Management | `/department-management` | Manage departments |
| Work Monitoring | `/work-monitoring` | Real-time activity tracking |
| Reports & Analytics | `/reports-analytics` | Charts + export |
| Worker Productivity | `/worker-productivity` | Per-worker stats |
| SO Management | `/so-management` | Sales Order CRUD |
| SO Dashboard | `/so-dashboard/:soNumber` | Per-SO progress |
| Settings | `/settings` | App configuration |

### Source Structure

```
src/
├── api/                    ← Backend API services (NEW)
│   ├── index.ts            ← Barrel export
│   ├── client.ts           ← Fetch client with JWT auth
│   ├── auth.ts             ← Login / profile
│   ├── users.ts            ← User CRUD
│   ├── departments.ts      ← Department CRUD
│   ├── salesOrders.ts      ← Sales Order CRUD + reports
│   ├── activityLogs.ts     ← Activity log CRUD
│   └── dashboard.ts        ← Dashboard summary
├── components/
│   └── DashboardLayout.tsx ← Sidebar + Navbar
├── context/
│   └── AppContext.tsx       ← Global state + real auth
├── mock/                   ← Legacy mock data (to be removed page by page)
│   ├── users.ts
│   ├── departments.ts
│   ├── salesOrders.ts
│   ├── activityLogs.ts
│   └── roles.ts
├── pages/                  ← All 12 admin pages
├── assets/
│   └── hero.png
├── App.tsx                 ← Router
├── theme.ts                ← MUI theme
├── index.css
└── main.tsx
```

---

## Supervisor Frontend

- **Directory:** `d:\ME\Intern\ssv\on1\supervisor-panel\wms supervisor pannel\`
- **Pages:** Dashboard, ReviewActivity, WorkVerification, UserMonitoring, EmployeeDetails, Reports, Notifications, Profile

### Start Supervisor Frontend
```bash
cd "d:\ME\Intern\ssv\on1\supervisor-panel\wms supervisor pannel"
npm run dev
```

---

## Worker/User Frontend

- **Directory:** `d:\ME\Intern\ssv\on1\user\user\`
- **Pages:** WorkerDashboard, SubmitWork, SubmissionHistory, WorkerNotifications

### Start Worker Frontend
```bash
cd "d:\ME\Intern\ssv\on1\user\user"
npm run dev
```

---

## Environment Variables

### Admin Frontend `.env`
```env
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_URL=http://localhost:3000
```

### Backend `.env`
```env
APP_NAME=backend
APP_PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret-key-1234
JWT_EXPIRES_IN=1d
```

---

## Next Steps (TODO)

- [ ] Replace mock data in each page with real `usersApi`, `departmentsApi`, etc. calls
- [ ] Remove `src/mock/` folder once all pages are migrated
- [ ] Add `api/` layer to Supervisor and Worker frontends
- [ ] Delete `dist/` folders (auto-regenerated on build)
- [ ] Stop terminal running `npm run dev` in `frontend/` (empty folder), delete it
