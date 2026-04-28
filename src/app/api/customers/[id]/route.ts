import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
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
        email: data.email,
        postalCode: data.postalCode,
        address: data.address,
        desiredServices: data.desiredServices,
        status: data.status,
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
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    // 画面遷移を「スッと」させるため、ここでは基本情報のみ取得
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            sessions: true,
            metrics: true,
            goals: true
          }
        }
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

// 部分更新（プラン変更など）に対応したPATCHを追加
export async function PATCH(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: data, // 受け取ったデータのみ更新
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Failed to patch customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    await prisma.customer.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
