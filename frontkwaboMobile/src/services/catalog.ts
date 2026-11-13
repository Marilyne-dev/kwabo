import { api } from './api';
import { mapService } from './mappers';
import type { ServiceItem } from '@/data/services';

/** GET /catalog (public) : 4 univers contenant les services. */
export async function fetchCatalog(): Promise<ServiceItem[]> {
  const res = await api('/catalog', { skipAuthRedirect: true });
  const out: ServiceItem[] = [];
  (res.data ?? []).forEach((cat: any) => {
    (cat.services ?? []).forEach((s: any) => out.push(mapService(s, cat.slug)));
  });
  return out;
}
