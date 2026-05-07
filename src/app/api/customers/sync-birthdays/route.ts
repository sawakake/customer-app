import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncBirthdayToCalendar } from '@/lib/googleCalendar';

export async function POST() {
  try {
    const customers = await prisma.customer.findMany();

    console.log(`Starting bulk sync for ${customers.length} customers...`);

    for (const customer of customers) {
      if (customer.dob) {
        await syncBirthdayToCalendar(customer.name, new Date(customer.dob));
      }
    }

    return NextResponse.json({ message: `Successfully synced ${customers.length} birthdays.` });
  } catch (error) {
    console.error('Bulk sync error:', error);
    return NextResponse.json({ error: 'Failed to sync birthdays.' }, { status: 500 });
  }
}
