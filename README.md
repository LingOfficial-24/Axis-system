# Axis System

## 1. Cấu hình Supabase (bắt buộc, làm trước khi chạy/deploy)

### a) Tạo bảng lưu dữ liệu người dùng

Vào Supabase Dashboard → **SQL Editor** → chạy đoạn SQL sau:

```sql
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "Users can view their own state"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own state"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own state"
  on public.user_state for update
  using (auth.uid() = user_id);
```

**Row Level Security (RLS) ở trên là phần quan trọng nhất** — nó đảm bảo mỗi
người chỉ đọc/ghi được đúng dòng dữ liệu của chính mình, kể cả khi ai đó có
được API key public (key này vốn được thiết kế để lộ ra ngoài, an toàn nằm ở
RLS chứ không phải ở việc giấu key).

### b) Cấu hình Auth (đăng nhập/đăng ký)

Vào **Authentication → Providers → Email**:
- Bật **Enable Email provider** (thường mặc định đã bật).
- Tuỳ chọn: tắt **Confirm email** nếu muốn người dùng đăng ký xong là đăng
  nhập được luôn, không cần xác nhận qua email (phù hợp lúc test nhanh).
  Nếu để bật, code đã xử lý sẵn — sau khi đăng ký sẽ hiện thông báo yêu cầu
  kiểm tra email trước khi đăng nhập.

## 2. Chạy thử ở máy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. File `.env.local` đã có sẵn 2 biến môi trường
Supabase — không cần sửa gì nếu bạn dùng đúng project Supabase đã tạo ở
bước 1.

## 3. Đưa lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <link-repo-github-cua-ban>
git push -u origin main
```

(`.env.local` đã được `.gitignore` loại trừ — sẽ không bị đẩy lên GitHub.)

## 4. Deploy lên Vercel

1. Vào vercel.com → **Add New Project** → chọn repo GitHub vừa tạo.
2. Ở bước cấu hình, vào **Environment Variables**, thêm đúng 2 biến:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ysvwudazegxcftpdqnfm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_goemAKSeK9dYisVvjRRxvA_0rQh4RWL`
3. Bấm **Deploy**. Xong sẽ có link thật (dạng `ten-project.vercel.app`).

## Ghi chú về cách lưu dữ liệu

- **Khách (chưa đăng nhập):** dữ liệu lưu trong `localStorage` của trình
  duyệt — dùng được ngay không cần tài khoản, nhưng chỉ ở trên thiết bị đó.
- **Đã đăng nhập:** dữ liệu lưu trên Supabase (bảng `user_state`), đồng bộ
  qua mọi thiết bị, mật khẩu được Supabase tự hash — không còn lưu dạng
  văn bản thô như bản demo trước.
