# RowQue — Game Queue Management

This repository contains a production-ready MVP for a game queue management system built with Vue 3 (TypeScript) on the frontend and Supabase (Postgres, Auth, Realtime, RPC) for backend logic.

Quick status:
- Database migrations and RPC functions: `supabase/migrations/*.sql`
- RLS policies: `supabase/migrations/20260818000002_rls_policies.sql`
- Supabase Edge Function wrappers (HTTP): `supabase/functions/*` (add service role key in env)
- Frontend: `frontend/` (Vite + Vue 3 + Pinia)
- Tests: `supabase/tests/concurrency_test.js`

Getting started (development):

1) Create a Supabase project and configure DB

2) Run migrations (using supabase CLI):

```bash
supabase db reset --project-ref <your-project-ref> # optional, CAUTION: destroys data
supabase db push --project-ref <your-project-ref>
```

3) Seed (optional):

```bash
psql <supabase_db_connection> -f supabase/migrations/20260818000004_seed_data.sql
```

4) Configure environment for Edge Functions and Frontend (do NOT commit real keys):

Create `.env` files or configure environment variables in your deployment platform.

Required for local testing:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # for Edge Functions only
ROUND_ID=<a-round-id-for-tests>
```

5) Edge Functions

- The repository includes lightweight HTTP wrappers in `supabase/functions/*` which call RPC methods atomically. Deploy these with `supabase functions deploy` after setting `SUPABASE_SERVICE_ROLE_KEY` in the function environment.

6) Run concurrency test (example):

```bash
cd supabase/tests
SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon> ROUND_ID=<round-uuid> CONCURRENT=6 node concurrency_test.js
```

Notes and next steps
- Final security review and RLS verification should be run in a staging environment before production.
- Add automated test suite (CI) to run concurrency and permission tests.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend or public repos.
 
## 🔁 CI / Automated Deploy (GitHub Actions)

This repo includes a GitHub Actions workflow `.github/workflows/deploy.yml` which can:
- Build the frontend
- Push database migrations via the Supabase CLI
- Deploy Supabase Edge Functions
- Deploy the frontend to Vercel using the `vercel` CLI

Required GitHub Secrets for the workflow (set in repository Settings → Secrets):
- `SUPABASE_ACCESS_TOKEN` — Supabase CLI access token (use `supabase login` to generate locally)
- `SUPABASE_PROJECT_REF` — your Supabase project ref (e.g. `abcd1234`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key (for Edge Functions environment)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — used to build frontend
- `VERCEL_TOKEN` — Vercel token for CLI deploy

Security notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in GitHub Secrets and in Supabase Function env — never in frontend or repo.
- Recommend running workflow in a staging branch before `main`.

After setting secrets, push to `main` to trigger the workflow.
# RowQue - Game Queue Management System

ระบบจัดการคิวผู้เล่นเกมแบบครบวงจร พัฒนาด้วย Vue 3 + TypeScript + Supabase

## 📋 Features

### สำหรับผู้เล่น (Player)
- ✅ ลงคิวออนไลน์ได้ง่ายๆ
- ✅ เลือกตำแหน่ง Support หรือ ทั่วไป
- ✅ ตรวจสอบสถานะคิวได้ตลอดเวลา
- ✅ ดูจอแสดงผลแบบ Realtime

### สำหรับ Staff
- ✅ สุ่มคิวแบบอัตโนมัติ (ป้องกัน Race Condition)
- ✅ เรียกคิวเองได้ (Manual Call)
- ✅ จัดการสถานะคิว (Called, Serving, Completed, No-show)
- ✅ ดูสถิติและข้อมูลแบบ Realtime

### สำหรับ Admin
- ✅ สร้างและจัดการ Round
- ✅ เปิด/ปิด รับคิว
- ✅ เปิดรับคิวเพิ่มในรอบเดิมได้หลายครั้ง
- ✅ จัดการ Staff (ผ่าน Supabase Dashboard)
- ✅ ดู Audit Logs

## 🏗️ Architecture

```
Frontend (Vue 3 + TypeScript)
├── Vite
├── Pinia (State Management)
├── Vue Router
├── Tailwind CSS
└── Supabase JS Client

Backend (Supabase)
├── PostgreSQL Database
├── Supabase Auth
├── Supabase Realtime
├── Row Level Security (RLS)
└── PostgreSQL Functions (RPC)

Deployment
├── Frontend → Vercel
└── Backend → Supabase
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm หรือ yarn
- Supabase Account

### 1. สร้าง Supabase Project

1. ไปที่ https://supabase.com และสร้าง Project ใหม่
2. รอให้ Project พร้อมใช้งาน

### 2. รัน Database Migrations

1. ไปที่ Supabase Dashboard → SQL Editor
2. Copy และรันไฟล์ทั้งหมดใน `supabase/migrations/` ตามลำดับ:
   - `20260818000001_create_profiles.sql`
   - `20260818000002_rls_policies.sql`
   - `20260818000003_database_functions.sql`
   - `20260818000004_seed_data.sql`

หรือใช้ Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 3. สร้าง Admin User

1. ไปที่ Supabase Dashboard → Authentication → Users
2. คลิก "Add User" และสร้าง Admin User
3. Copy User ID
4. ไปที่ SQL Editor และรัน:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

### 4. ติดตั้ง Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. ตั้งค่า Environment Variables

```bash
cd frontend
cp .env.example .env
```

แก้ไข `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

หา Supabase URL และ Anon Key ได้ที่:
Supabase Dashboard → Settings → API

### 6. รัน Development Server

```bash
cd frontend
npm run dev
```

เปิด http://localhost:3000

## 📁 Project Structure

```
rowque/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── QueueRegistrationView.vue
│   │   │   ├── QueueStatusView.vue
│   │   │   ├── PublicDisplayView.vue
│   │   │   ├── LoginView.vue
│   │   │   ├── staff/
│   │   │   └── admin/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260818000001_create_profiles.sql
│   │   ├── 20260818000002_rls_policies.sql
│   │   ├── 20260818000003_database_functions.sql
│   │   └── 20260818000004_seed_data.sql
│   └── functions/
└── README.md
```

## 🔐 Authentication & Authorization

### Roles
- **player**: ผู้เล่นทั่วไป (ไม่ต้อง Login)
- **staff**: เจ้าหน้าที่จัดการคิว (ต้อง Login)
- **admin**: ผู้ดูแลระบบ (ต้อง Login)

### Row Level Security (RLS)
ระบบใช้ RLS เพื่อป้องกันข้อมูล:
- ทุกคนดู Rounds และ Queue Entries ได้
- เฉพาะ Staff/Admin เท่านั้นที่แก้ไขได้
- Player ลงคิวได้เฉพาะเมื่อ Round เปิดรับ
- Audit Logs ดูได้เฉพาะ Staff/Admin

## 🎯 Key Features

### 1. ระบบคิวแบบ Round-based
- แต่ละ Round มีวันที่และสถานะชัดเจน
- เปิด/ปิด รับคิวได้หลายครั้งในรอบเดิม
- Queue Number ไม่ซ้ำกันภายใน Round + Position

### 2. การสุ่มคิว (Random Queue)
- ใช้ PostgreSQL Function แบบ Atomic
- ป้องกัน Race Condition ด้วย `FOR UPDATE SKIP LOCKED`
- Staff หลายคนสุ่มพร้อมกันได้ไม่ซ้ำ

### 3. Realtime Updates
- ใช้ Supabase Realtime
- ข้อมูลอัพเดททันทีทุกเครื่องไม่ต้อง Refresh

### 4. Audit Logs
- บันทึกทุกการกระทำ
- ตรวจสอบย้อนหลังได้

## 📊 Database Schema

### Tables
- **profiles**: ข้อมูลผู้ใช้และ Role
- **rounds**: รอบกิจกรรม
- **queue_entries**: คิวผู้เล่น
- **audit_logs**: บันทึกการทำงาน

### Key Functions
- `generate_queue_number()`: Generate เลขคิวอัตโนมัติ
- `register_queue_entry()`: ลงคิวแบบ Atomic
- `random_select_queue()`: สุ่มคิวป้องกัน Race Condition
- `manual_call_queue()`: เรียกคิวเอง
- `complete_queue()`: ทำเครื่องหมายว่าเสร็จ
- `mark_no_show()`: ทำเครื่องหมายว่าไม่มา
- `cancel_queue()`: ยกเลิกคิว
- `reopen_round()`: เปิดรับคิวเพิ่มในรอบเดิม

## 🚀 Deployment

### Frontend (Vercel)

1. Push code ขึ้น GitHub
2. ไปที่ https://vercel.com
3. Import Repository
4. ตั้งค่า Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### Backend (Supabase)

Supabase เป็น Managed Service ไม่ต้อง Deploy

## 🧪 Testing

### Manual Testing Checklist

#### Registration
- [ ] ลงคิวสำเร็จ
- [ ] Round ปิดไม่สามารถลงได้
- [ ] Position ถูกต้อง
- [ ] Generate Queue Number ถูกต้อง
- [ ] Duplicate prevention

#### Random Queue
- [ ] สุ่มเฉพาะ waiting
- [ ] ไม่สุ่มคนเดิมพร้อมกัน (Concurrent test)
- [ ] Random confirm
- [ ] Random reject

#### Manual Call
- [ ] เรียก waiting ได้
- [ ] เรียก completed ไม่ได้
- [ ] Concurrent call protection

#### Round Management
- [ ] Open
- [ ] Close
- [ ] Reopen (หลายครั้งได้)
- [ ] Complete

#### Permission
- [ ] Player เข้าหน้า Admin ไม่ได้
- [ ] Staff จัดการ Queue ได้
- [ ] Admin ทำทุกอย่างได้

#### Realtime
- [ ] ข้อมูลอัพเดททันทีเมื่อมีการเปลี่ยนแปลง

## 🔒 Security

- ✅ Row Level Security (RLS) เปิดทุกตาราง
- ✅ ไม่ใช้ Service Role Key ใน Frontend
- ✅ Business Logic อยู่ใน Database Functions
- ✅ Input Validation
- ✅ Prevent Race Conditions
- ✅ Prevent Duplicate Registration
- ✅ Role-based Access Control

## 📝 Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 UI Pages

### Public
- `/` - หน้าหลัก เลือกรอบ
- `/queue` - ลงคิว
- `/status` - ตรวจสอบสถานะ
- `/display` - จอแสดงผล (TV)

### Staff (ต้อง Login)
- `/staff` - Dashboard
- `/staff/round/:id` - จัดการคิว

### Admin (ต้อง Login + Admin Role)
- `/admin` - Dashboard
- `/admin/rounds` - จัดการรอบ
- `/admin/rounds/:id` - จัดการคิว (Admin)
- `/admin/staff` - จัดการ Staff
- `/admin/logs` - Audit Logs

## 📱 Responsive Design

- **Mobile First**: สำหรับผู้เล่น
- **Desktop Friendly**: สำหรับ Admin/Staff

## 🐛 Known Limitations

1. **Staff Management**: ต้องจัดการผ่าน Supabase Dashboard (จะพัฒนาต่อ)
2. **Email Verification**: ต้องเปิดใน Supabase Auth Settings
3. **Rate Limiting**: ใช้ Supabase Default (จะเพิ่ม Edge Functions ต่อ)

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ Console Log
2. ตรวจสอบ Supabase Logs
3. ตรวจสอบ RLS Policies

## 📄 License

MIT License

---

Developed with ❤️ by ManageAI Solution, Thailand
Hosting on INET Cloud, Thailand# rowque
