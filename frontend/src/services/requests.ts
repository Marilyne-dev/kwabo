import { api } from './api';
import { mapRequest } from './mappers';
import { RequestItem, UrgencyLevel } from '../types';

export interface CreateRequestInput {
  service: string;
  title?: string;
  city?: string;
  urgency?: UrgencyLevel;
  budget?: string;
  description?: string;
  details: Record<string, any>;
  files?: Record<string, File | null | undefined>;
}

export async function createServiceRequest(input: CreateRequestInput): Promise<RequestItem> {
  const fileEntries = Object.entries(input.files || {}).filter(
    (entry): entry is [string, File] => Boolean(entry[1])
  );

  if (fileEntries.length > 0) {
    const formData = new FormData();
    formData.append('service', input.service);
    if (input.title) formData.append('title', input.title);
    if (input.city) formData.append('city', input.city);
    if (input.urgency) formData.append('urgency', input.urgency);
    if (input.budget) formData.append('budget', input.budget);
    if (input.description) formData.append('description', input.description);

    Object.entries(input.details || {}).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        formData.append(`details[${key}]`, String(val));
      }
    });

    fileEntries.forEach(([fieldName, file]) => {
      formData.append(`files[${fieldName}]`, file);
    });

    const res = await api<{ data: any }>('/requests', {
      method: 'POST',
      body: formData,
    });
    return mapRequest(res?.data ?? res);
  }

  const res = await api<{ data: any }>('/requests', {
    method: 'POST',
    body: {
      service: input.service,
      title: input.title || undefined,
      city: input.city || undefined,
      urgency: input.urgency || 'normal',
      budget: input.budget || undefined,
      description: input.description || undefined,
      details: input.details || {},
    },
  });
  return mapRequest(res?.data ?? res);
}

