import type { ContactInquiry } from '@/lib/supabase/client';

// Inquiry type labels for display
export const inquiryTypeLabels = {
  fr: {
    wine_tasting: 'Dégustation de vins',
    group_visit: 'Visite de groupe',
    wine_orders: 'Commande de vins',
    business_partnership: 'Partenariat commercial',
    press_media: 'Presse et médias',
    general_inquiry: 'Demande générale'
  },
  en: {
    wine_tasting: 'Wine Tasting',
    group_visit: 'Group Visit',
    wine_orders: 'Wine Orders',
    business_partnership: 'Business Partnership',
    press_media: 'Press & Media',
    general_inquiry: 'General Inquiry'
  }
} as const;

// Status labels
export const statusLabels = {
  fr: {
    new: 'Nouvelle',
    assigned: 'Assignée',
    in_progress: 'En cours',
    awaiting_customer: 'En attente client',
    resolved: 'Résolue',
    closed: 'Fermée',
    spam: 'Spam'
  },
  en: {
    new: 'New',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    awaiting_customer: 'Awaiting Customer',
    resolved: 'Resolved',
    closed: 'Closed',
    spam: 'Spam'
  }
} as const;

// Priority labels
export const priorityLabels = {
  fr: {
    low: 'Faible',
    normal: 'Normale',
    high: 'Élevée',
    urgent: 'Urgente'
  },
  en: {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent'
  }
} as const;

// Priority colors for UI
export const priorityColors = {
  low: '#28a745',    // Green
  normal: '#6c757d', // Gray
  high: '#fd7e14',   // Orange
  urgent: '#dc3545'  // Red
} as const;

// Status colors for UI
export const statusColors = {
  new: '#007bff',           // Blue
  assigned: '#6f42c1',      // Purple
  in_progress: '#fd7e14',   // Orange
  awaiting_customer: '#ffc107', // Yellow
  resolved: '#28a745',      // Green
  closed: '#6c757d',        // Gray
  spam: '#dc3545'           // Red
} as const;

// Utility functions
export function getInquiryTypeLabel(type: string, language: 'fr' | 'en' = 'fr'): string {
  return inquiryTypeLabels[language][type as keyof typeof inquiryTypeLabels.fr] || type;
}

export function getStatusLabel(status: string, language: 'fr' | 'en' = 'fr'): string {
  return statusLabels[language][status as keyof typeof statusLabels.fr] || status;
}

export function getPriorityLabel(priority: string, language: 'fr' | 'en' = 'fr'): string {
  return priorityLabels[language][priority as keyof typeof priorityLabels.fr] || priority;
}

export function getPriorityColor(priority: string): string {
  return priorityColors[priority as keyof typeof priorityColors] || '#6c757d';
}

export function getStatusColor(status: string): string {
  return statusColors[status as keyof typeof statusColors] || '#6c757d';
}

// Format inquiry for display
export function formatInquiryForDisplay(inquiry: ContactInquiry, language: 'fr' | 'en' = 'fr') {
  return {
    ...inquiry,
    type_label: getInquiryTypeLabel(inquiry.inquiry_type, language),
    status_label: getStatusLabel(inquiry.status, language),
    priority_label: getPriorityLabel(inquiry.priority, language),
    priority_color: getPriorityColor(inquiry.priority),
    status_color: getStatusColor(inquiry.status),
    full_name: `${inquiry.first_name} ${inquiry.last_name}`,
    created_date: new Date(inquiry.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB'),
    created_time: new Date(inquiry.created_at).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-GB'),
    preferred_date_formatted: inquiry.preferred_date
      ? new Date(inquiry.preferred_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB')
      : null,
    is_overdue: inquiry.follow_up_required && inquiry.follow_up_date
      ? new Date(inquiry.follow_up_date) < new Date()
      : false
  };
}

// Calculate response time in hours
export function calculateResponseTime(inquiry: ContactInquiry): number | null {
  if (!inquiry.response_sent_at) return null;

  const created = new Date(inquiry.created_at).getTime();
  const responded = new Date(inquiry.response_sent_at).getTime();

  return Math.round((responded - created) / (1000 * 60 * 60));
}

// Calculate time since creation
export function getTimeSinceCreation(inquiry: ContactInquiry, language: 'fr' | 'en' = 'fr'): string {
  const now = new Date().getTime();
  const created = new Date(inquiry.created_at).getTime();
  const diffMinutes = Math.floor((now - created) / (1000 * 60));

  if (diffMinutes < 60) {
    return language === 'fr'
      ? `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
      : `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return language === 'fr'
      ? `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
      : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return language === 'fr'
    ? `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Validate inquiry type and group size requirements
export function validateInquiryRequirements(inquiryType: string, groupSize?: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Group size required for certain inquiry types
  if (['wine_tasting', 'group_visit'].includes(inquiryType)) {
    if (!groupSize || groupSize < 1) {
      errors.push('Le nombre de personnes est requis pour ce type de demande');
    } else if (groupSize > 50) {
      errors.push('Nous ne pouvons accueillir plus de 50 personnes par groupe');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate inquiry summary for admin notifications
export function generateInquirySummary(inquiry: ContactInquiry, language: 'fr' | 'en' = 'fr'): string {
  const typeLabel = getInquiryTypeLabel(inquiry.inquiry_type, language);
  const parts = [typeLabel];

  if (inquiry.group_size) {
    const peopleLabel = language === 'fr'
      ? `${inquiry.group_size} personne${inquiry.group_size > 1 ? 's' : ''}`
      : `${inquiry.group_size} person${inquiry.group_size > 1 ? 's' : ''}`;
    parts.push(peopleLabel);
  }

  if (inquiry.preferred_date) {
    const dateLabel = language === 'fr' ? 'le' : 'on';
    const formattedDate = new Date(inquiry.preferred_date).toLocaleDateString(
      language === 'fr' ? 'fr-FR' : 'en-GB'
    );
    parts.push(`${dateLabel} ${formattedDate}`);
  }

  if (inquiry.company) {
    parts.push(`(${inquiry.company})`);
  }

  return parts.join(' - ');
}

// Calculate estimated revenue for an inquiry
export function estimateInquiryRevenue(inquiry: ContactInquiry): number | null {
  switch (inquiry.inquiry_type) {
    case 'wine_tasting':
      const tastingRevenue = (inquiry.group_size || 1) * 15;
      const wineRevenue = (inquiry.group_size || 1) * 75;
      return tastingRevenue + wineRevenue;

    case 'group_visit':
      if (!inquiry.group_size) return null;
      return inquiry.group_size * 25 + (inquiry.group_size * 50);

    case 'wine_orders':
      if (inquiry.budget_range) {
        const match = inquiry.budget_range.match(/(\d+)/);
        return match ? parseInt(match[1]) : 200;
      }
      return 200;

    case 'business_partnership':
      return 5000; // Potential high-value partnership

    default:
      return null;
  }
}

// Check if inquiry requires immediate attention
export function requiresImmediateAttention(inquiry: ContactInquiry): boolean {
  // High priority always requires attention
  if (inquiry.priority === 'urgent' || inquiry.priority === 'high') {
    return true;
  }

  // Large groups
  if (inquiry.group_size && inquiry.group_size > 20) {
    return true;
  }

  // Press inquiries are time-sensitive
  if (inquiry.inquiry_type === 'press_media') {
    return true;
  }

  // Overdue follow-ups
  if (inquiry.follow_up_required && inquiry.follow_up_date) {
    const followUpDate = new Date(inquiry.follow_up_date);
    const now = new Date();
    if (followUpDate < now) {
      return true;
    }
  }

  return false;
}

// Sort inquiries by priority and date
export function sortInquiriesByPriority(inquiries: ContactInquiry[]): ContactInquiry[] {
  const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

  return [...inquiries].sort((a, b) => {
    // First sort by priority
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Then by creation date (newer first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// Filter inquiries by various criteria
export function filterInquiries(
  inquiries: ContactInquiry[],
  filters: {
    status?: string[];
    inquiryType?: string[];
    priority?: string[];
    assignedTo?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    requiresAttention?: boolean;
    isOverdue?: boolean;
  }
): ContactInquiry[] {
  return inquiries.filter(inquiry => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(inquiry.status)) {
        return false;
      }
    }

    // Inquiry type filter
    if (filters.inquiryType && filters.inquiryType.length > 0) {
      if (!filters.inquiryType.includes(inquiry.inquiry_type)) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(inquiry.priority)) {
        return false;
      }
    }

    // Assigned to filter
    if (filters.assignedTo) {
      if (inquiry.assigned_to !== filters.assignedTo) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchFields = [
        inquiry.first_name,
        inquiry.last_name,
        inquiry.email,
        inquiry.company,
        inquiry.message
      ].filter(Boolean).map(field => field?.toLowerCase());

      if (!searchFields.some(field => field?.includes(searchTerm))) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateFrom) {
      const createdDate = new Date(inquiry.created_at);
      if (createdDate < filters.dateFrom) {
        return false;
      }
    }

    if (filters.dateTo) {
      const createdDate = new Date(inquiry.created_at);
      if (createdDate > filters.dateTo) {
        return false;
      }
    }

    // Requires attention filter
    if (filters.requiresAttention) {
      if (!requiresImmediateAttention(inquiry)) {
        return false;
      }
    }

    // Overdue filter
    if (filters.isOverdue) {
      if (!inquiry.follow_up_required || !inquiry.follow_up_date) {
        return false;
      }
      const followUpDate = new Date(inquiry.follow_up_date);
      const now = new Date();
      if (followUpDate >= now) {
        return false;
      }
    }

    return true;
  });
}

// Export default summary function
export function getInquirySummary(inquiry: ContactInquiry, language: 'fr' | 'en' = 'fr') {
  return {
    ...formatInquiryForDisplay(inquiry, language),
    summary: generateInquirySummary(inquiry, language),
    estimated_revenue: estimateInquiryRevenue(inquiry),
    requires_attention: requiresImmediateAttention(inquiry),
    response_time_hours: calculateResponseTime(inquiry),
    time_since_creation: getTimeSinceCreation(inquiry, language)
  };
}