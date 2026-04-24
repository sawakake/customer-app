import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        furigana: data.furigana,
        gender: data.gender,
        dob: new Date(data.dob),
        phone: data.phone,
        plan: data.plan,
        complaint: data.complaint,
        idealState: data.idealState,
        emergencyName: data.emergencyName,
        emergencyRelation: data.emergencyRelation,
        emergencyPhone: data.emergencyPhone,
        // 必要に応じて他のフィールドも追加
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        metrics: true,
        sessions: true,
        goals: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}
