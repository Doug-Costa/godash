import pool from '../src/lib/db';
import prisma from '../src/lib/prisma';

async function syncCustomers() {
  console.log('=== SYNCING CUSTOMER NAMES & CONTACTS FROM MYSQL PEOPLE ===\n');

  try {
    // 1. Find all Persons in Prisma with externalPersonId and missing fullName/email/phoneNumber
    const incompletePersons = await prisma.person.findMany({
      where: {
        externalPersonId: { not: null },
        OR: [
          { fullName: null },
          { email: null },
          { phoneNumber: null }
        ]
      },
      select: {
        id: true,
        externalPersonId: true,
        fullName: true,
        email: true,
        phoneNumber: true
      }
    });

    console.log(`Found ${incompletePersons.length} incomplete Person records in Prisma CDP.`);

    if (incompletePersons.length > 0) {
      const extIds = incompletePersons
        .map(p => p.externalPersonId)
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
      for (const person of incompletePersons) {
        if (person.externalPersonId && peopleMap.has(person.externalPersonId)) {
          const p = peopleMap.get(person.externalPersonId);
          const newName = p.fullName || person.fullName || (p.email ? p.email.split('@')[0] : null);
          const newEmail = p.email || person.email || null;
          const newPhone = p.phone || person.phoneNumber || null;

          if (newName || newEmail || newPhone) {
            await prisma.person.update({
              where: { id: person.id },
              data: {
                fullName: newName,
                email: newEmail,
                phoneNumber: newPhone
              }
            });
            updatedCount++;
          }
        }
      }

      console.log(`✅ Successfully updated ${updatedCount} Person records in PostgreSQL!`);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }

  process.exit(0);
}

syncCustomers();
