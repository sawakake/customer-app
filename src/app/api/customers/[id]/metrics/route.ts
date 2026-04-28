import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    const metrics = await prisma.metric.findMany({
      where: { customerId: id },
      orderBy: { date: "asc" }
    });
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
