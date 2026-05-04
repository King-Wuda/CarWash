-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'owner', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CAR WASHES ──────────────────────────────────────────────────────────────
create table public.car_washes (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  address text not null,
  city text not null,
  province text not null default 'Gauteng',
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text,
  email text,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  operating_hours jsonb default '{"mon":"07:00-18:00","tue":"07:00-18:00","wed":"07:00-18:00","thu":"07:00-18:00","fri":"07:00-18:00","sat":"07:00-17:00","sun":"08:00-15:00"}'::jsonb,
  created_at timestamptz default now()
);

alter table public.car_washes enable row level security;

create policy "Anyone can view approved car washes"
  on public.car_washes for select using (status = 'approved');

create policy "Owners can view their own car wash"
  on public.car_washes for select using (auth.uid() = owner_id);

create policy "Owners can update their own car wash"
  on public.car_washes for update using (auth.uid() = owner_id);

create policy "Authenticated users can insert car washes"
  on public.car_washes for insert with check (auth.uid() = owner_id);

create policy "Admins can do everything on car washes"
  on public.car_washes for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── SERVICES ────────────────────────────────────────────────────────────────
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  car_wash_id uuid references public.car_washes(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  duration_minutes int not null default 30,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

create policy "Anyone can view services of approved car washes"
  on public.services for select using (
    exists (select 1 from public.car_washes where id = car_wash_id and status = 'approved')
  );

create policy "Owners can manage their services"
  on public.services for all using (
    exists (select 1 from public.car_washes where id = car_wash_id and owner_id = auth.uid())
  );

-- ─── TIME SLOTS ──────────────────────────────────────────────────────────────
create table public.slots (
  id uuid default uuid_generate_v4() primary key,
  car_wash_id uuid references public.car_washes(id) on delete cascade not null,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null default 1,
  bookings_count int not null default 0,
  created_at timestamptz default now(),
  unique(car_wash_id, slot_date, start_time)
);

alter table public.slots enable row level security;

create policy "Anyone can view slots of approved car washes"
  on public.slots for select using (
    exists (select 1 from public.car_washes where id = car_wash_id and status = 'approved')
  );

create policy "Owners can manage their slots"
  on public.slots for all using (
    exists (select 1 from public.car_washes where id = car_wash_id and owner_id = auth.uid())
  );

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  car_wash_id uuid references public.car_washes(id) on delete cascade not null,
  service_id uuid references public.services(id) not null,
  slot_id uuid references public.slots(id) not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  vehicle_make text,
  vehicle_model text,
  vehicle_colour text,
  vehicle_plate text,
  notes text,
  total_price numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Customers can view their own bookings"
  on public.bookings for select using (auth.uid() = customer_id);

create policy "Customers can create bookings"
  on public.bookings for insert with check (auth.uid() = customer_id);

create policy "Customers can cancel their own bookings"
  on public.bookings for update using (auth.uid() = customer_id);

create policy "Owners can view bookings at their car wash"
  on public.bookings for select using (
    exists (select 1 from public.car_washes where id = car_wash_id and owner_id = auth.uid())
  );

create policy "Owners can update booking status at their car wash"
  on public.bookings for update using (
    exists (select 1 from public.car_washes where id = car_wash_id and owner_id = auth.uid())
  );

-- Increment/decrement slot bookings_count on booking changes
create or replace function public.handle_booking_insert()
returns trigger as $$
begin
  update public.slots set bookings_count = bookings_count + 1 where id = new.slot_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_created
  after insert on public.bookings
  for each row execute procedure public.handle_booking_insert();

create or replace function public.handle_booking_cancel()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update public.slots set bookings_count = bookings_count - 1 where id = new.slot_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_cancelled
  after update on public.bookings
  for each row execute procedure public.handle_booking_cancel();

-- ─── SEED DATA ───────────────────────────────────────────────────────────────
-- Insert demo car washes (status = approved so they appear immediately)
insert into public.car_washes (id, owner_id, name, description, address, city, province, image_url, status, phone)
values
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    null,
    'Shine & Go Car Wash',
    'Johannesburg''s most popular car wash. Drive in, book a slot, and we''ll have your car spotless in no time. No queues, no waiting.',
    '14 Sandton Drive, Sandton',
    'Johannesburg',
    'Gauteng',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'approved',
    '011 123 4567'
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    null,
    'Sparkle Auto Spa',
    'Premium car wash and detailing in Cape Town. We treat your vehicle like our own.',
    '88 Kloof Street, Gardens',
    'Cape Town',
    'Western Cape',
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800',
    'approved',
    '021 987 6543'
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    null,
    'QuickClean Rosebank',
    'Fast, affordable, and convenient. Located in the heart of Rosebank with 20 bays and full valet service.',
    '15 Bath Avenue, Rosebank',
    'Johannesburg',
    'Gauteng',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800',
    'approved',
    '011 555 0101'
  );

-- Services for Shine & Go
insert into public.services (car_wash_id, name, description, price, duration_minutes) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Basic Exterior Wash', 'Full exterior rinse and hand wash', 80.00, 20),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Interior & Exterior', 'Full hand wash plus interior vacuum and wipe-down', 150.00, 40),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Full Valet', 'Complete valet — exterior wash, interior deep clean, dashboard polish, tyre shine', 280.00, 75);

-- Services for Sparkle Auto Spa
insert into public.services (car_wash_id, name, description, price, duration_minutes) values
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Express Exterior', 'Quick hand wash and dry', 90.00, 20),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Standard Wash', 'Exterior wash, interior vacuum, windows cleaned', 180.00, 45),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Premium Valet', 'Full detailing package with wax and leather treatment', 450.00, 120);

-- Services for QuickClean Rosebank
insert into public.services (car_wash_id, name, description, price, duration_minutes) values
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Quick Wash', 'Exterior rinse and hand wash', 70.00, 15),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Full Wash', 'Exterior + interior clean', 130.00, 35),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Valet Special', 'Complete valet with engine bay clean', 320.00, 90);
