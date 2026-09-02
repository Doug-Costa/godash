import prisma from '@/lib/prisma';

export class ImportDuplicateInspectionService {
  static async purchaseExists(personId: string, productId: string, occurredAt?: string): Promise<boolean> {
    const parsedDate = occurredAt ? new Date(occurredAt) : null;
    const startDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
    if (!startDate) return false;

    const purchase = await prisma.customerProduct.findFirst({
      where: {
        productId,
        startDate,
        customer: { personId }
      },
      select: { id: true }
    });
    return Boolean(purchase);
  }
}
