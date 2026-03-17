
-- 1. Add admin_approval column to user_domains
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

ALTER TABLE public.user_domains 
ADD COLUMN IF NOT EXISTS admin_approval approval_status DEFAULT 'approved';

-- 2. Add auto_approve_domains to site_settings
INSERT INTO public.site_settings (key, value) 
VALUES ('auto_approve_domains', 'true')
ON CONFLICT (key) DO NOTHING;

-- 3. Ensure master admin email is in site_settings if not already
INSERT INTO public.site_settings (key, value) 
VALUES ('admin_email', 'info369skills@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- 4. Update existing domains to 'approved' to avoid breaking current users
UPDATE public.user_domains SET admin_approval = 'approved' WHERE admin_approval IS NULL;

NOTIFY pgrst, 'reload schema';
