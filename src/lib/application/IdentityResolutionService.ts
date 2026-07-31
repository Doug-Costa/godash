import prisma from '@/lib/prisma';
import { Customer } from '@prisma/client';

export class IdentityResolutionService {
  /**
   * Resolve an identity based on externalPersonId, phoneNumber, or email.
   * Prioritizes externalPersonId, then phoneNumber, then email.
   * Does NOT check journeyId here, as identity spans across campaigns.
   */
  static async resolveIdentity(params: {
    externalPersonId?: number | null;
    phoneNumber?: string | null;
    email?: string | null;
  }): Promise<Customer | null> {
    const { externalPersonId, phoneNumber, email } = params;

    // 1. Try by externalPersonId
    if (externalPersonId && !isNaN(externalPersonId)) {
      const match = await prisma.customer.findFirst({
        where: { externalPersonId: Number(externalPersonId) },
        orderBy: { createdAt: 'desc' }
      });
      if (match) return match;
    }

    // 2. Try by phoneNumber
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        // Prisma JSON filtering for Postgres
        const match = await prisma.customer.findFirst({
          where: {
            metadata: {
              path: ['phoneNumber'],
              string_contains: cleanPhone,
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (match) return match;
        
        // As a fallback, in case string_contains doesn't work perfectly for JSON in Prisma,
        // we can also do a raw query or just use Prisma's `equals` if we standardize the phone in metadata.
        const matchEquals = await prisma.customer.findFirst({
          where: {
            metadata: {
              path: ['phoneNumber'],
              equals: cleanPhone,
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (matchEquals) return matchEquals;
      }
    }

    // 3. Try by email
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail.length > 5) {
        const match = await prisma.customer.findFirst({
          where: {
            metadata: {
              path: ['email'],
              equals: cleanEmail,
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (match) return match;
      }
    }

    return null;
  }
}
