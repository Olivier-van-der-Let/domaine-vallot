export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      wine_products: {
        Row: {
          id: string
          sku: string
          name: string
          vintage: number
          varietal: string
          region: string | null
          alcohol_content: number
          volume_ml: number
          price_eur: number
          cost_eur: number | null
          stock_quantity: number
          reserved_quantity: number
          reorder_level: number | null
          weight_grams: number
          description_en: string
          description_fr: string
          tasting_notes_en: string | null
          tasting_notes_fr: string | null
          food_pairing_en: string | null
          food_pairing_fr: string | null
          production_notes_en: string | null
          production_notes_fr: string | null
          allergens: string[] | null
          organic_certified: boolean
          biodynamic_certified: boolean
          vegan_friendly: boolean
          google_product_category: string | null
          meta_product_category: string | null
          is_active: boolean
          featured: boolean
          sort_order: number
          seo_title_en: string | null
          seo_title_fr: string | null
          seo_description_en: string | null
          seo_description_fr: string | null
          slug_en: string
          slug_fr: string
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          sku: string
          name: string
          vintage: number
          varietal: string
          region?: string | null
          alcohol_content: number
          volume_ml?: number
          price_eur: number
          cost_eur?: number | null
          stock_quantity?: number
          reserved_quantity?: number
          reorder_level?: number | null
          weight_grams: number
          description_en: string
          description_fr: string
          tasting_notes_en?: string | null
          tasting_notes_fr?: string | null
          food_pairing_en?: string | null
          food_pairing_fr?: string | null
          production_notes_en?: string | null
          production_notes_fr?: string | null
          allergens?: string[] | null
          organic_certified?: boolean
          biodynamic_certified?: boolean
          vegan_friendly?: boolean
          google_product_category?: string | null
          meta_product_category?: string | null
          is_active?: boolean
          featured?: boolean
          sort_order?: number
          seo_title_en?: string | null
          seo_title_fr?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          slug_en: string
          slug_fr: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          vintage?: number
          varietal?: string
          region?: string | null
          alcohol_content?: number
          volume_ml?: number
          price_eur?: number
          cost_eur?: number | null
          stock_quantity?: number
          reserved_quantity?: number
          reorder_level?: number | null
          weight_grams?: number
          description_en?: string
          description_fr?: string
          tasting_notes_en?: string | null
          tasting_notes_fr?: string | null
          food_pairing_en?: string | null
          food_pairing_fr?: string | null
          production_notes_en?: string | null
          production_notes_fr?: string | null
          allergens?: string[] | null
          organic_certified?: boolean
          biodynamic_certified?: boolean
          vegan_friendly?: boolean
          google_product_category?: string | null
          meta_product_category?: string | null
          is_active?: boolean
          featured?: boolean
          sort_order?: number
          seo_title_en?: string | null
          seo_title_fr?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          slug_en?: string
          slug_fr?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text_en: string | null
          alt_text_fr: string | null
          display_order: number
          image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker'
          width: number | null
          height: number | null
          file_size: number | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text_en?: string | null
          alt_text_fr?: string | null
          display_order: number
          image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker'
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text_en?: string | null
          alt_text_fr?: string | null
          display_order?: number
          image_type?: 'bottle' | 'label' | 'vineyard' | 'winemaker'
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_primary?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          birth_date: string | null
          preferred_language: 'en' | 'fr'
          marketing_consent: boolean
          newsletter_consent: boolean
          age_verified: boolean
          age_verified_at: string | null
          age_verification_method: 'id_document' | 'third_party' | 'manual' | null
          is_business: boolean
          vat_number: string | null
          vat_validated: boolean
          vat_validated_at: string | null
          company_name: string | null
          default_shipping_address_id: string | null
          default_billing_address_id: string | null
          total_orders: number
          total_spent_eur: number
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birth_date?: string | null
          preferred_language?: 'en' | 'fr'
          marketing_consent?: boolean
          newsletter_consent?: boolean
          age_verified?: boolean
          age_verified_at?: string | null
          age_verification_method?: 'id_document' | 'third_party' | 'manual' | null
          is_business?: boolean
          vat_number?: string | null
          vat_validated?: boolean
          vat_validated_at?: string | null
          company_name?: string | null
          default_shipping_address_id?: string | null
          default_billing_address_id?: string | null
          total_orders?: number
          total_spent_eur?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birth_date?: string | null
          preferred_language?: 'en' | 'fr'
          marketing_consent?: boolean
          newsletter_consent?: boolean
          age_verified?: boolean
          age_verified_at?: string | null
          age_verification_method?: 'id_document' | 'third_party' | 'manual' | null
          is_business?: boolean
          vat_number?: string | null
          vat_validated?: boolean
          vat_validated_at?: string | null
          company_name?: string | null
          default_shipping_address_id?: string | null
          default_billing_address_id?: string | null
          total_orders?: number
          total_spent_eur?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          type: 'shipping' | 'billing' | 'both'
          first_name: string
          last_name: string
          company: string | null
          address_line1: string
          address_line2: string | null
          city: string
          state_province: string | null
          postal_code: string
          country_code: string
          phone: string | null
          delivery_instructions: string | null
          is_default_shipping: boolean
          is_default_billing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type: 'shipping' | 'billing' | 'both'
          first_name: string
          last_name: string
          company?: string | null
          address_line1: string
          address_line2?: string | null
          city: string
          state_province?: string | null
          postal_code: string
          country_code: string
          phone?: string | null
          delivery_instructions?: string | null
          is_default_shipping?: boolean
          is_default_billing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          type?: 'shipping' | 'billing' | 'both'
          first_name?: string
          last_name?: string
          company?: string | null
          address_line1?: string
          address_line2?: string | null
          city?: string
          state_province?: string | null
          postal_code?: string
          country_code?: string
          phone?: string | null
          delivery_instructions?: string | null
          is_default_shipping?: boolean
          is_default_billing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          currency: string
          subtotal_eur: number
          vat_rate: number
          vat_amount_eur: number
          shipping_cost_eur: number
          total_eur: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method: string | null
          mollie_payment_id: string | null
          shipping_address: Json
          billing_address: Json
          shipping_method: string
          tracking_number: string | null
          estimated_delivery: string | null
          shipped_at: string | null
          delivered_at: string | null
          notes: string | null
          fulfillment_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          currency?: string
          subtotal_eur: number
          vat_rate: number
          vat_amount_eur: number
          shipping_cost_eur?: number
          total_eur: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method?: string | null
          mollie_payment_id?: string | null
          shipping_address: Json
          billing_address: Json
          shipping_method: string
          tracking_number?: string | null
          estimated_delivery?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          notes?: string | null
          fulfillment_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          currency?: string
          subtotal_eur?: number
          vat_rate?: number
          vat_amount_eur?: number
          shipping_cost_eur?: number
          total_eur?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method?: string | null
          mollie_payment_id?: string | null
          shipping_address?: Json
          billing_address?: Json
          shipping_method?: string
          tracking_number?: string | null
          estimated_delivery?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          notes?: string | null
          fulfillment_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_snapshot: Json
          quantity: number
          unit_price_eur: number
          vat_rate: number
          vat_amount_eur: number
          line_total_eur: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_snapshot: Json
          quantity: number
          unit_price_eur: number
          vat_rate: number
          vat_amount_eur: number
          line_total_eur: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_snapshot?: Json
          quantity?: number
          unit_price_eur?: number
          vat_rate?: number
          vat_amount_eur?: number
          line_total_eur?: number
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          quantity: number
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_id: string
          quantity: number
          added_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_id?: string
          quantity?: number
          added_at?: string
          updated_at?: string
        }
      }
      vat_rates: {
        Row: {
          id: string
          country_code: string
          product_category: string
          standard_rate: number
          reduced_rate: number | null
          applies_to_wine: boolean
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          country_code: string
          product_category?: string
          standard_rate: number
          reduced_rate?: number | null
          applies_to_wine?: boolean
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          country_code?: string
          product_category?: string
          standard_rate?: number
          reduced_rate?: number | null
          applies_to_wine?: boolean
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
      }
      product_certifications: {
        Row: {
          id: string
          product_id: string
          certification_type: 'organic' | 'biodynamic' | 'vegan' | 'sustainable'
          certifying_body: string
          certificate_number: string
          issued_date: string
          expiry_date: string
          certificate_url: string | null
          verified: boolean
          display_logo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          certification_type: 'organic' | 'biodynamic' | 'vegan' | 'sustainable'
          certifying_body: string
          certificate_number: string
          issued_date: string
          expiry_date: string
          certificate_url?: string | null
          verified?: boolean
          display_logo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          certification_type?: 'organic' | 'biodynamic' | 'vegan' | 'sustainable'
          certifying_body?: string
          certificate_number?: string
          issued_date?: string
          expiry_date?: string
          certificate_url?: string | null
          verified?: boolean
          display_logo?: boolean
          created_at?: string
        }
      }
      content_pages: {
        Row: {
          id: string
          slug_en: string
          slug_fr: string
          title_en: string | null
          title_fr: string | null
          content_en: string | null
          content_fr: string | null
          meta_title_en: string | null
          meta_title_fr: string | null
          meta_description_en: string | null
          meta_description_fr: string | null
          featured_image_url: string | null
          page_type: 'heritage' | 'practices' | 'about' | 'legal' | 'custom'
          is_published: boolean
          sort_order: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          slug_en: string
          slug_fr: string
          title_en?: string | null
          title_fr?: string | null
          content_en?: string | null
          content_fr?: string | null
          meta_title_en?: string | null
          meta_title_fr?: string | null
          meta_description_en?: string | null
          meta_description_fr?: string | null
          featured_image_url?: string | null
          page_type?: 'heritage' | 'practices' | 'about' | 'legal' | 'custom'
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          slug_en?: string
          slug_fr?: string
          title_en?: string | null
          title_fr?: string | null
          content_en?: string | null
          content_fr?: string | null
          meta_title_en?: string | null
          meta_title_fr?: string | null
          meta_description_en?: string | null
          meta_description_fr?: string | null
          featured_image_url?: string | null
          page_type?: 'heritage' | 'practices' | 'about' | 'legal' | 'custom'
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      contact_inquiries: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          inquiry_type: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry'
          group_size: number | null
          preferred_date: string | null
          message: string
          wine_preferences: string | null
          budget_range: string | null
          special_requirements: string | null
          status: 'new' | 'assigned' | 'in_progress' | 'awaiting_customer' | 'resolved' | 'closed' | 'spam'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to: string | null
          response_sent_at: string | null
          internal_notes: string | null
          age_verified: boolean
          privacy_accepted: boolean
          marketing_consent: boolean
          data_processing_consent: boolean
          consent_timestamp: string
          consent_ip_address: string | null
          honeypot_field: string | null
          submission_ip: string | null
          user_agent: string | null
          referrer: string | null
          spam_score: number
          is_spam: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deletion_reason: string | null
          auto_response_sent: boolean
          auto_response_sent_at: string | null
          follow_up_required: boolean
          follow_up_date: string | null
          appointment_scheduled: boolean
          appointment_date: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          inquiry_type: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry'
          group_size?: number | null
          preferred_date?: string | null
          message: string
          wine_preferences?: string | null
          budget_range?: string | null
          special_requirements?: string | null
          status?: 'new' | 'assigned' | 'in_progress' | 'awaiting_customer' | 'resolved' | 'closed' | 'spam'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          response_sent_at?: string | null
          internal_notes?: string | null
          age_verified?: boolean
          privacy_accepted: boolean
          marketing_consent?: boolean
          data_processing_consent?: boolean
          consent_timestamp?: string
          consent_ip_address?: string | null
          honeypot_field?: string | null
          submission_ip?: string | null
          user_agent?: string | null
          referrer?: string | null
          spam_score?: number
          is_spam?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          auto_response_sent?: boolean
          auto_response_sent_at?: string | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          appointment_scheduled?: boolean
          appointment_date?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          inquiry_type?: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry'
          group_size?: number | null
          preferred_date?: string | null
          message?: string
          wine_preferences?: string | null
          budget_range?: string | null
          special_requirements?: string | null
          status?: 'new' | 'assigned' | 'in_progress' | 'awaiting_customer' | 'resolved' | 'closed' | 'spam'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          response_sent_at?: string | null
          internal_notes?: string | null
          age_verified?: boolean
          privacy_accepted?: boolean
          marketing_consent?: boolean
          data_processing_consent?: boolean
          consent_timestamp?: string
          consent_ip_address?: string | null
          honeypot_field?: string | null
          submission_ip?: string | null
          user_agent?: string | null
          referrer?: string | null
          spam_score?: number
          is_spam?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          auto_response_sent?: boolean
          auto_response_sent_at?: string | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          appointment_scheduled?: boolean
          appointment_date?: string | null
        }
      }
      inquiry_response_templates: {
        Row: {
          id: string
          name: string
          inquiry_type: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry' | null
          language: string
          subject_template: string
          body_template: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          inquiry_type?: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry' | null
          language?: string
          subject_template: string
          body_template: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          inquiry_type?: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry' | null
          language?: string
          subject_template?: string
          body_template?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      inquiry_communications: {
        Row: {
          id: string
          inquiry_id: string
          communication_type: string
          direction: string
          subject: string | null
          message: string
          sent_by: string | null
          email_message_id: string | null
          created_at: string
          email_template_id: string | null
          email_sent_successfully: boolean | null
          email_delivery_status: string | null
          email_opened_at: string | null
          email_clicked_at: string | null
        }
        Insert: {
          id?: string
          inquiry_id: string
          communication_type: string
          direction: string
          subject?: string | null
          message: string
          sent_by?: string | null
          email_message_id?: string | null
          created_at?: string
          email_template_id?: string | null
          email_sent_successfully?: boolean | null
          email_delivery_status?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
        }
        Update: {
          id?: string
          inquiry_id?: string
          communication_type?: string
          direction?: string
          subject?: string | null
          message?: string
          sent_by?: string | null
          email_message_id?: string | null
          created_at?: string
          email_template_id?: string | null
          email_sent_successfully?: boolean | null
          email_delivery_status?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
        }
      }
      inquiry_data_processing_log: {
        Row: {
          id: string
          inquiry_id: string
          processing_activity: string
          legal_basis: string
          purpose: string
          data_categories: string[]
          processed_by: string
          processed_at: string
          retention_period: string | null
          automatic_deletion_date: string | null
        }
        Insert: {
          id?: string
          inquiry_id: string
          processing_activity: string
          legal_basis: string
          purpose: string
          data_categories: string[]
          processed_by: string
          processed_at?: string
          retention_period?: string | null
          automatic_deletion_date?: string | null
        }
        Update: {
          id?: string
          inquiry_id?: string
          processing_activity?: string
          legal_basis?: string
          purpose?: string
          data_categories?: string[]
          processed_by?: string
          processed_at?: string
          retention_period?: string | null
          automatic_deletion_date?: string | null
        }
      }
    }
    Views: {
      cart_items_with_products: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          quantity: number
          added_at: string
          updated_at: string
          name: string
          vintage: number
          varietal: string
          price_eur: number
          stock_quantity: number
          reserved_quantity: number
          is_active: boolean
          slug_en: string
          slug_fr: string
          line_total_eur: number
          in_stock: boolean
          primary_image_url: string | null
        }
      }
      wine_products_with_certifications: {
        Row: {
          id: string
          sku: string
          name: string
          vintage: number
          varietal: string
          region: string | null
          alcohol_content: number
          volume_ml: number
          price_eur: number
          cost_eur: number | null
          stock_quantity: number
          reserved_quantity: number
          reorder_level: number | null
          weight_grams: number
          description_en: string
          description_fr: string
          tasting_notes_en: string | null
          tasting_notes_fr: string | null
          food_pairing_en: string | null
          food_pairing_fr: string | null
          production_notes_en: string | null
          production_notes_fr: string | null
          allergens: string[] | null
          organic_certified: boolean
          biodynamic_certified: boolean
          vegan_friendly: boolean
          google_product_category: string | null
          meta_product_category: string | null
          is_active: boolean
          featured: boolean
          sort_order: number
          seo_title_en: string | null
          seo_title_fr: string | null
          seo_description_en: string | null
          seo_description_fr: string | null
          slug_en: string
          slug_fr: string
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          certifications: Json
        }
      }
    }
    Functions: {
      calculate_vat: {
        Args: {
          p_net_amount: number
          p_country_code: string
          p_is_business?: boolean
          p_vat_number?: string
        }
        Returns: {
          net_amount: number
          vat_rate: number
          vat_amount: number
          gross_amount: number
          reverse_charge: boolean
        }[]
      }
      cleanup_old_cart_items: {
        Args: {}
        Returns: number
      }
      get_cart_summary: {
        Args: {
          p_customer_id: string
        }
        Returns: {
          item_count: number
          total_quantity: number
          subtotal_eur: number
        }[]
      }
      get_current_vat_rate: {
        Args: {
          p_country_code: string
          p_product_category?: string
        }
        Returns: number
      }
      upsert_cart_item: {
        Args: {
          p_customer_id: string
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          customer_id: string
          product_id: string
          quantity: number
          added_at: string
          updated_at: string
        }
      }
      validate_cart_for_checkout: {
        Args: {
          p_customer_id: string
        }
        Returns: {
          is_valid: boolean
          error_message: string
          invalid_items: Json
        }[]
      }
      process_contact_submission: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_email: string
          p_phone?: string
          p_company?: string
          p_inquiry_type: 'wine_tasting' | 'group_visit' | 'wine_orders' | 'business_partnership' | 'press_media' | 'general_inquiry'
          p_group_size?: number
          p_preferred_date?: string
          p_message: string
          p_marketing_consent?: boolean
          p_honeypot?: string
          p_ip_address?: string
          p_user_agent?: string
          p_referrer?: string
        }
        Returns: string
      }
      get_inquiry_statistics: {
        Args: {}
        Returns: {
          total_inquiries: number
          new_inquiries: number
          in_progress_inquiries: number
          resolved_inquiries: number
          spam_inquiries: number
          high_priority_inquiries: number
          overdue_followups: number
          tasting_requests: number
          group_visit_requests: number
          business_inquiries: number
        }[]
      }
      anonymize_inquiry_data: {
        Args: {
          p_inquiry_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}