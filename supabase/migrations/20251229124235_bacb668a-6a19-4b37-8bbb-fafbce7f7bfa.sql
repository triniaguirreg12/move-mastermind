-- Create enum for email campaign status
CREATE TYPE public.email_campaign_status AS ENUM ('draft', 'queued', 'sending', 'sent', 'failed');

-- Create enum for email message status
CREATE TYPE public.email_message_status AS ENUM ('queued', 'sent', 'failed', 'skipped_opt_out');

-- Create enum for audience type
CREATE TYPE public.email_audience_type AS ENUM ('single', 'selected', 'filtered');

-- Create enum for body format
CREATE TYPE public.email_body_format AS ENUM ('markdown', 'html');

-- User email preferences table
CREATE TABLE public.user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  opt_out BOOLEAN NOT NULL DEFAULT false,
  opt_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin_id UUID NOT NULL,
  name TEXT,
  subject TEXT NOT NULL,
  preheader TEXT,
  body TEXT NOT NULL,
  body_format public.email_body_format NOT NULL DEFAULT 'markdown',
  cta_text TEXT,
  cta_url TEXT,
  audience_type public.email_audience_type NOT NULL,
  filters_json JSONB,
  selected_user_ids_json JSONB,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  is_test BOOLEAN NOT NULL DEFAULT false,
  status public.email_campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Email messages table
CREATE TABLE public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email_to TEXT NOT NULL,
  status public.email_message_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  provider_name TEXT,
  provider_message_id TEXT,
  queued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON public.email_campaigns(created_by_admin_id);
CREATE INDEX idx_email_messages_campaign ON public.email_messages(campaign_id);
CREATE INDEX idx_email_messages_status ON public.email_messages(status);
CREATE INDEX idx_email_messages_user ON public.email_messages(user_id);
CREATE INDEX idx_user_email_preferences_user ON public.user_email_preferences(user_id);
CREATE INDEX idx_user_email_preferences_opt_out ON public.user_email_preferences(opt_out);

-- Enable RLS
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

-- RLS for user_email_preferences
-- Users can view their own preferences
CREATE POLICY "Users can view their own email preferences"
ON public.user_email_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own preferences (for unsubscribe)
CREATE POLICY "Users can update their own email preferences"
ON public.user_email_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow insert for system (via service role) and users for themselves
CREATE POLICY "Users can insert their own email preferences"
ON public.user_email_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Authenticated admins can view all preferences
CREATE POLICY "Authenticated users can view all email preferences"
ON public.user_email_preferences
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS for email_campaigns - only admins (authenticated users for now)
CREATE POLICY "Authenticated users can view campaigns"
ON public.email_campaigns
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create campaigns"
ON public.email_campaigns
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaigns"
ON public.email_campaigns
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS for email_messages
CREATE POLICY "Authenticated users can view messages"
ON public.email_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create messages"
ON public.email_messages
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update messages"
ON public.email_messages
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on user_email_preferences
CREATE TRIGGER update_user_email_preferences_updated_at
BEFORE UPDATE ON public.user_email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();