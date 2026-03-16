-- SQL for Quamify Mail Advanced Features

-- 1. Domains Table
CREATE TABLE IF NOT EXISTS user_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own domains" 
    ON user_domains FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" 
    ON user_domains FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" 
    ON user_domains FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" 
    ON user_domains FOR UPDATE USING (auth.uid() = user_id);

-- Final Admin Infrastructure
CREATE TABLE IF NOT EXISTS public.admins (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    domain_name TEXT UNIQUE NOT NULL,
    dns_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS & Policies
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Global Read Access
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read admins" ON public.admins FOR SELECT USING (true);

-- Admin Management
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL 
    USING (auth.jwt() ->> 'email' = 'info369skills@gmail.com' OR EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins manage admins" ON public.admins FOR ALL 
    USING (auth.jwt() ->> 'email' = 'info369skills@gmail.com' OR auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "Admins manage custom_domains" ON public.custom_domains FOR ALL 
    USING (auth.jwt() ->> 'email' = 'info369skills@gmail.com' OR EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

-- User Custom Domains
CREATE POLICY "Users view own custom_domains" ON public.custom_domains FOR SELECT 
    USING (auth.uid() = user_id);

-- Cache Refresh
NOTIFY pgrst, 'reload schema';

-- Initial records
INSERT INTO admins (email) VALUES ('info369skills@gmail.com');
INSERT INTO site_settings (key, value) VALUES ('main_domain', 'quamify-mail.vercel.app');
INSERT INTO site_settings (key, value) VALUES ('support_email', 'support@369aiventures.com');
INSERT INTO site_settings (key, value) VALUES ('copyright_text', 'Quamify. All Rights Reserved.');
INSERT INTO site_settings (key, value) VALUES ('terms_content', 'By accessing and using Quamify Mail, you agree to be bound by these terms. This service provides temporary holographic email addresses for testing and privacy purposes.');
INSERT INTO site_settings (key, value) VALUES ('safety_clause_content', 'Quamify ka structure third-party providers (Vercel, Supabase, Cloudflare) par depend karta hai. In platforms ki policies, free-tier limits, ya uptime humare control mein nahi hain.');

-- 2. Domain Limit Trigger (9 Domains Max)
CREATE OR REPLACE FUNCTION check_domain_limit() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_domains WHERE user_id = NEW.user_id) >= 9 THEN
    RAISE EXCEPTION 'Domain limit reached (Max 9)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_check_domain_limit
BEFORE INSERT ON user_domains
FOR EACH ROW EXECUTE FUNCTION check_domain_limit();

-- 3. High-Concurrency Indexes for Emails
-- Assuming public.emails exists based on user's previous code
CREATE INDEX IF NOT EXISTS idx_emails_recipient_address ON public.emails (recipient_address);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON public.emails (received_at DESC);

-- 4. Rate Limiting Table (Optional but recommended for Cloudflare Workers interaction)
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 1,
    last_hit TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
