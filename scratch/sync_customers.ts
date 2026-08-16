import pool from '../src/lib/db';
import prisma from '../src/lib/prisma';

async function syncCustomers() {
  console.log('=== SYNCING CUSTOMER NAMES & CONTACTS FROM MYSQL PEOPLE ===\n');

  try {
    // 1. Find all Customers in Prisma with externalPersonId and missing name/email/phone
    const incompleteCustomers = await prisma.customer.findMany({
      where: {
        externalPersonId: { not: null },
        OR: [
          { name: null },
          { email: null },
          { phone: null }
        ]
      },
      select: {
        id: true,
        externalPersonId: true,
        name: true,
        email: true,
        phone: true
      }
    });

    console.log(`Found ${incompleteCustomers.length} incomplete Customer records in Prisma CDP.`);

    if (incompleteCustomers.length > 0) {
      const extIds = incompleteCustomers
        .map(c => c.externalPersonId)
        .filter((id): id is number => id !== null);

      const idsStr = Array.from(new Set(extIds)).join(',');
      const [peopleRows]: any = await pool.query(`
        SELECT 
          p.id,
          COALESCE(NULLIF(p.fullName, ''), NULLIF(p.name, ''), p.email) AS fullName,
          p.email,
          p.phoneNumber AS phone
        FROM people p
        WHERE p.id IN (${idsStr})
      `);

      console.log(`Retrieved ${peopleRows.length} matching rows from MySQL people table.`);
      const peopleMap = new Map<number, any>();
      for (const r of peopleRows) {
        peopleMap.set(r.id, r);
      }

      let updatedCount = 0;
      for (const cust of incompleteCustomers) {
        if (cust.externalPersonId && peopleMap.has(cust.externalPersonId)) {
          const p = peopleMap.get(cust.externalPersonId);
          const newName = p.fullName || cust.name || (p.email ? p.email.split('@')[0] : null);
          const newEmail = p.email || cust.email || null;
          const newPhone = p.phone || cust.phone || null;

          if (newName || newEmail || newPhone) {
            await prisma.customer.update({
              where: { id: cust.id },
              data: {
                name: newName,
                email: newEmail,
                phone: newPhone
              }
            });
            updatedCount++;
          }
        }
      }

      console.log(`✅ Successfully updated ${updatedCount} Customer records in PostgreSQL!`);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }

  process.exit(0);
}

syncCustomers();
