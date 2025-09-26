-- Contact Inquiries System for Domaine Vallot
-- Handles wine tasting requests, group visits, business inquiries, etc.
-- GDPR compliant with proper consent tracking and data management

-- Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Basic Contact Information
  first_name VARCHAR(50) NOT NULL CHECK (length(trim(first_name)) >= 2),
  last_name VARCHAR(50) NOT NULL CHECK (length(trim(last_name)) >= 2),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(20) CHECK (phone IS NULL OR phone ~* '^(\+33|0)[1-9](\d{8})$'),
  company VARCHAR(100),

  -- Inquiry Details
  inquiry_type contact_inquiry_type NOT NULL,
  group_size INTEGER CHECK (group_size IS NULL OR (group_size >= 1 AND group_size <= 50)),
  preferred_date DATE,
  message TEXT NOT NULL CHECK (length(trim(message)) >= 20 AND length(trim(message)) <= 1500),

  -- Wine Industry Specific Fields
  wine_preferences TEXT, -- Store specific wine preferences for tastings
  budget_range VARCHAR(50), -- e.g., "50-100 EUR per person"
  special_requirements TEXT, -- Dietary restrictions, accessibility needs

  -- Status and Processing
  status contact_inquiry_status NOT NULL DEFAULT 'new',
  priority contact_inquiry_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id), -- Admin user handling this inquiry
  response_sent_at TIMESTAMP WITH TIME ZONE,
  internal_notes TEXT, -- Admin-only notes

  -- GDPR Compliance Fields
  age_verified BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL CHECK (privacy_accepted = true),
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  data_processing_consent BOOLEAN NOT NULL DEFAULT true,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consent_ip_address INET, -- IP address when consent was given

  -- Spam Protection & Security
  honeypot_field TEXT, -- Hidden field to catch bots
  submission_ip INET,
  user_agent TEXT,
  referrer TEXT,
  spam_score INTEGER DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
  is_spam BOOLEAN NOT NULL DEFAULT false,

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id), -- If submitted by authenticated user
  updated_by UUID REFERENCES auth.users(id),

  -- Soft Delete for GDPR
  deleted_at TIMESTAMP WITH TIME ZONE,
  deletion_reason VARCHAR(100),

  -- Auto-response tracking
  auto_response_sent BOOLEAN NOT NULL DEFAULT false,
  auto_response_sent_at TIMESTAMP WITH TIME ZONE,

  -- Follow-up tracking
  follow_up_required BOOLEAN NOT NULL DEFAULT true,
  follow_up_date DATE,
  appointment_scheduled BOOLEAN NOT NULL DEFAULT false,
  appointment_date TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_group_size_for_type CHECK (
    (inquiry_type IN ('group_visit', 'wine_tasting') AND group_size IS NOT NULL AND group_size >= 1) OR
    (inquiry_type NOT IN ('group_visit', 'wine_tasting'))
  ),

  CONSTRAINT valid_preferred_date CHECK (
    preferred_date IS NULL OR preferred_date >= CURRENT_DATE
  )
);

-- Create ENUM types for inquiry management
CREATE TYPE contact_inquiry_type AS ENUM (
  'wine_tasting',
  'group_visit',
  'wine_orders',
  'business_partnership',
  'press_media',
  'general_inquiry'
);

CREATE TYPE contact_inquiry_status AS ENUM (
  'new',
  'assigned',
  'in_progress',
  'awaiting_customer',
  'resolved',
  'closed',
  'spam'
);

CREATE TYPE contact_inquiry_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Inquiry Response Templates (for admin efficiency)
CREATE TABLE IF NOT EXISTS inquiry_response_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  inquiry_type contact_inquiry_type,
  language CHAR(2) NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inquiry Responses/Communications Log
CREATE TABLE IF NOT EXISTS inquiry_communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'note')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id), -- Admin user who sent this
  email_message_id TEXT, -- For tracking email thread
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Email specific fields
  email_template_id UUID REFERENCES inquiry_response_templates(id),
  email_sent_successfully BOOLEAN,
  email_delivery_status VARCHAR(20),
  email_opened_at TIMESTAMP WITH TIME ZONE,
  email_clicked_at TIMESTAMP WITH TIME ZONE
);

-- GDPR Data Processing Log
CREATE TABLE IF NOT EXISTS inquiry_data_processing_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES contact_inquiries(id) ON DELETE CASCADE,
  processing_activity VARCHAR(100) NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  processed_by UUID NOT NULL REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retention_period INTERVAL,
  automatic_deletion_date DATE
);

-- Indexes for Performance
CREATE INDEX idx_contact_inquiries_status ON contact_inquiries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_type ON contact_inquiries(inquiry_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_email ON contact_inquiries(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_assigned ON contact_inquiries(assigned_to) WHERE assigned_to IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_spam ON contact_inquiries(is_spam, spam_score) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_inquiries_follow_up ON contact_inquiries(follow_up_required, follow_up_date) WHERE follow_up_required = true AND deleted_at IS NULL;
CREATE INDEX idx_inquiry_communications_inquiry ON inquiry_communications(inquiry_id, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_data_processing_log ENABLE ROW LEVEL SECURITY;

-- Public can insert new inquiries (for anonymous contact form submissions)
CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admin users can read/update inquiries
CREATE POLICY "Admin users can manage inquiries" ON contact_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Customers can view their own inquiries if authenticated
CREATE POLICY "Customers can view own inquiries" ON contact_inquiries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      email = auth.jwt()->>'email'
    )
  );

-- Admin-only policies for other tables
CREATE POLICY "Admin can manage templates" ON inquiry_response_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage communications" ON inquiry_communications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can view processing log" ON inquiry_data_processing_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Trigger Functions for Automation
CREATE OR REPLACE FUNCTION update_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_inquiry_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set priority based on inquiry type and group size
  IF NEW.inquiry_type = 'press_media' THEN
    NEW.priority = 'high';
  ELSIF NEW.inquiry_type IN ('wine_tasting', 'group_visit') AND NEW.group_size > 20 THEN
    NEW.priority = 'high';
  ELSIF NEW.inquiry_type = 'business_partnership' THEN
    NEW.priority = 'normal';
  ELSE
    NEW.priority = 'normal';
  END IF;

  -- Set follow-up date based on priority
  CASE NEW.priority
    WHEN 'urgent' THEN NEW.follow_up_date = CURRENT_DATE + INTERVAL '1 day';
    WHEN 'high' THEN NEW.follow_up_date = CURRENT_DATE + INTERVAL '2 days';
    WHEN 'normal' THEN NEW.follow_up_date = CURRENT_DATE + INTERVAL '3 days';
    WHEN 'low' THEN NEW.follow_up_date = CURRENT_DATE + INTERVAL '5 days';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_inquiry_data_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Log data processing activity for GDPR compliance
  INSERT INTO inquiry_data_processing_log (
    inquiry_id,
    processing_activity,
    legal_basis,
    purpose,
    data_categories,
    processed_by,
    retention_period
  ) VALUES (
    NEW.id,
    'Contact inquiry submission',
    'Legitimate interest',
    'Wine estate customer service and business operations',
    ARRAY['contact_details', 'inquiry_content', 'preferences'],
    COALESCE(NEW.created_by, (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'system' LIMIT 1)),
    INTERVAL '3 years'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_inquiry_updated_at();

CREATE TRIGGER set_contact_inquiry_priority
  BEFORE INSERT ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_inquiry_priority();

CREATE TRIGGER log_contact_inquiry_processing
  AFTER INSERT ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION log_inquiry_data_processing();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON inquiry_response_templates
  FOR EACH ROW EXECUTE FUNCTION update_inquiry_updated_at();

-- Insert Default Response Templates
INSERT INTO inquiry_response_templates (name, inquiry_type, language, subject_template, body_template, created_by) VALUES
('Tasting Confirmation FR', 'wine_tasting', 'fr',
  'Confirmation de votre demande de dégustation - Domaine Vallot',
  'Bonjour {{first_name}},

Merci pour votre demande de dégustation au Domaine Vallot.

Nous avons bien reçu votre demande pour {{group_size}} personnes le {{preferred_date}}.

Notre équipe va étudier votre demande et vous recontacter dans les plus brefs délais pour confirmer les détails et vous proposer un créneau adapté.

Nos dégustations comprennent :
- Visite du domaine et des chais
- Dégustation de 4-5 vins sélectionnés
- Présentation de nos méthodes de vinification
- Possibilité d''achat direct au domaine

Tarif : 15€ par personne (gratuit pour les achats supérieurs à 100€)

Nous nous réjouissons de vous accueillir bientôt au domaine !

Cordialement,
L''équipe Domaine Vallot'),

('Group Visit Confirmation FR', 'group_visit', 'fr',
  'Confirmation de votre visite de groupe - Domaine Vallot',
  'Bonjour {{first_name}},

Merci pour votre demande de visite de groupe au Domaine Vallot.

Nous avons bien reçu votre demande pour {{group_size}} personnes le {{preferred_date}}.

Pour les groupes de plus de 10 personnes, nous proposons :
- Visite guidée personnalisée du domaine
- Présentation de notre histoire familiale
- Dégustation adaptée à la taille du groupe
- Tarifs préférentiels pour les achats en groupe

Notre équipe va vous recontacter pour finaliser les détails de votre visite.

Cordialement,
L''équipe Domaine Vallot'),

('Business Partnership FR', 'business_partnership', 'fr',
  'Votre demande de partenariat - Domaine Vallot',
  'Bonjour {{first_name}},

Merci pour l''intérêt que vous portez à un partenariat avec le Domaine Vallot.

Nous avons bien reçu votre demande et nous étudions avec attention les opportunités de collaboration.

Un membre de notre équipe commerciale va vous contacter dans les prochains jours pour discuter de votre projet.

Cordialement,
L''équipe Domaine Vallot'),

('General Inquiry FR', 'general_inquiry', 'fr',
  'Accusé de réception - Domaine Vallot',
  'Bonjour {{first_name}},

Merci de nous avoir contactés.

Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.

Cordialement,
L''équipe Domaine Vallot');

-- Functions for Contact Form Processing
CREATE OR REPLACE FUNCTION process_contact_submission(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_inquiry_type contact_inquiry_type,
  p_group_size INTEGER DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_message TEXT,
  p_marketing_consent BOOLEAN DEFAULT false,
  p_honeypot TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_inquiry_id UUID;
  v_spam_score INTEGER := 0;
  v_is_spam BOOLEAN := false;
BEGIN
  -- Basic spam detection
  IF p_honeypot IS NOT NULL AND length(trim(p_honeypot)) > 0 THEN
    v_spam_score := v_spam_score + 100;
    v_is_spam := true;
  END IF;

  -- Additional spam checks
  IF length(p_message) < 20 OR length(p_message) > 1500 THEN
    v_spam_score := v_spam_score + 20;
  END IF;

  IF p_message ~* '(https?://|www\.)' AND p_message ~* '(buy|cheap|discount|click|free)' THEN
    v_spam_score := v_spam_score + 50;
  END IF;

  IF v_spam_score >= 70 THEN
    v_is_spam := true;
  END IF;

  -- Insert the inquiry
  INSERT INTO contact_inquiries (
    first_name,
    last_name,
    email,
    phone,
    company,
    inquiry_type,
    group_size,
    preferred_date,
    message,
    marketing_consent,
    honeypot_field,
    submission_ip,
    user_agent,
    referrer,
    spam_score,
    is_spam,
    consent_ip_address,
    age_verified
  ) VALUES (
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    nullif(trim(p_phone), ''),
    nullif(trim(p_company), ''),
    p_inquiry_type,
    p_group_size,
    p_preferred_date,
    trim(p_message),
    p_marketing_consent,
    p_honeypot,
    p_ip_address,
    p_user_agent,
    p_referrer,
    v_spam_score,
    v_is_spam,
    p_ip_address,
    true -- Age verified is handled by client-side validation
  ) RETURNING id INTO v_inquiry_id;

  RETURN v_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inquiry statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_inquiry_statistics()
RETURNS TABLE (
  total_inquiries BIGINT,
  new_inquiries BIGINT,
  in_progress_inquiries BIGINT,
  resolved_inquiries BIGINT,
  spam_inquiries BIGINT,
  high_priority_inquiries BIGINT,
  overdue_followups BIGINT,
  tasting_requests BIGINT,
  group_visit_requests BIGINT,
  business_inquiries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status = 'new' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress') AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE status = 'resolved' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE is_spam = true AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE priority IN ('high', 'urgent') AND status NOT IN ('resolved', 'closed') AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE follow_up_required = true AND follow_up_date < CURRENT_DATE AND status NOT IN ('resolved', 'closed') AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE inquiry_type = 'wine_tasting' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE inquiry_type = 'group_visit' AND deleted_at IS NULL),
    COUNT(*) FILTER (WHERE inquiry_type = 'business_partnership' AND deleted_at IS NULL)
  FROM contact_inquiries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GDPR Functions
CREATE OR REPLACE FUNCTION anonymize_inquiry_data(p_inquiry_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE contact_inquiries
  SET
    first_name = 'ANONYMIZED',
    last_name = 'USER',
    email = 'anonymized@deleted.local',
    phone = NULL,
    company = NULL,
    message = 'Content removed per GDPR request',
    submission_ip = NULL,
    user_agent = NULL,
    referrer = NULL,
    deleted_at = now(),
    deletion_reason = 'GDPR deletion request'
  WHERE id = p_inquiry_id;

  -- Log the anonymization
  INSERT INTO inquiry_data_processing_log (
    inquiry_id,
    processing_activity,
    legal_basis,
    purpose,
    data_categories,
    processed_by
  ) VALUES (
    p_inquiry_id,
    'Data anonymization',
    'GDPR Article 17 - Right to erasure',
    'Personal data removal upon request',
    ARRAY['contact_details', 'inquiry_content'],
    (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin' LIMIT 1)
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON contact_inquiries TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_contact_submission TO anon, authenticated;