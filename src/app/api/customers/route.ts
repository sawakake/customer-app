import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Server-side validation can be added here
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        furigana: data.furigana || '',
        gender: data.gender || '',
        dob: new Date(data.dob || new Date()),
        postalCode: data.postalCode || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || null,
        emergencyPhone: data.emergencyPhone || '',
        emergencyName: data.emergencyName || '',
        emergencyRelation: data.emergencyRelation || '',
        plan: data.plan || '未設定',
        complaint: data.complaint || '',
        idealState: data.idealState || '',
        desiredServices: data.desiredServices || '',
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ error: 'Failed to create customer record.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        furigana: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { sessions: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers.' }, { status: 500 });
  }
}
