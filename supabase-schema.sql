-- Supabase SQL Schema for Hospital Management System

-- Drop existing tables to ensure a clean slate if re-running
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.diagnostics_labs CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;

-- Create Users table (for authentication and basic info, extending Supabase Auth)
-- It's recommended to handle auth via Supabase Auth and link to a profiles table.

CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    date_of_birth DATE,
    allergies TEXT,
    medical_history TEXT,
    address TEXT,
    last_visit DATE,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    doctor_id VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    speciality VARCHAR(100),
    qualifications TEXT,
    fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    appointment_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    department VARCHAR(100),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    fee_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Paid'
);

CREATE TABLE public.diagnostics_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    category VARCHAR(100),
    test_date DATE,
    status VARCHAR(20) DEFAULT 'Processing',
    result_summary TEXT,
    report_url TEXT
);

CREATE TABLE public.hospital_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo TEXT,
    dark_mode BOOLEAN DEFAULT false,
    compact_view BOOLEAN DEFAULT false,
    two_factor_auth BOOLEAN DEFAULT true,
    session_timeout BOOLEAN DEFAULT true
);

CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    notes TEXT,
    medicines JSONB,
    vitals JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;

-- Note: For a real application, you would configure proper RLS policies
-- depending on roles (Admin, Doctor, Receptionist, Patient). 
-- For development to work without complex auth yet, you could create a permissive policy:

CREATE POLICY "Allow anonymous read access" on public.patients FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.patients FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.patients FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" on public.doctors FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.doctors FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.doctors FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" on public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.appointments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.appointments FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" on public.diagnostics_labs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.diagnostics_labs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.diagnostics_labs FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.diagnostics_labs FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" on public.prescriptions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.prescriptions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.prescriptions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" on public.hospital_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.hospital_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.hospital_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.hospital_settings FOR DELETE USING (true);

CREATE TABLE public.death_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    date_of_death TIMESTAMP WITH TIME ZONE NOT NULL,
    cause_of_death TEXT NOT NULL,
    place_of_death TEXT,
    notes TEXT
);

CREATE POLICY "Allow anonymous read access" on public.death_certificates FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" on public.death_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" on public.death_certificates FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" on public.death_certificates FOR DELETE USING (true);

alter publication supabase_realtime add table public.death_certificates;
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.diagnostics_labs;
alter publication supabase_realtime add table public.hospital_settings;
alter publication supabase_realtime add table public.prescriptions;

