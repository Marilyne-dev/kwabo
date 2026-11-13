import type { User } from '@/data/mockData';

/** Réponse Laravel (snake_case) -> objet du front mobile. */
export function mapUser(u: any): User {
  return {
    id: String(u.id),
    role: String(u.role || 'user').toUpperCase() as User['role'],
    firstName: u.first_name ?? '',
    lastName: u.last_name ?? '',
    email: u.email ?? '',
    country: u.country ?? '',
    phone: u.phone ?? '',
    referralCode: u.referral_code ?? '',
    emailVerified: !!u.email_verified,
    twoFactorEnabled: !!u.two_factor_enabled,
  };
}
