import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    const sessions = await prisma.session.findMany({
      where: { customerId: id },
      orderBy: { date: "desc" },
      include: { menuItems: true }
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
