import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        menuItems: true,
        photos: true,
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const session = await prisma.session.update({
      where: { id },
      data: {
        date: new Date(data.date),
        type: data.type,
        duration: data.duration,
        conditionSelf: data.conditionSelf,
        conditionObjective: data.conditionObjective,
        routinesText: data.routinesText,
        homework: data.homework,
        aiSummary: data.aiSummary,
        aiAdvice: data.aiAdvice,
        postureAnalysis: data.postureAnalysis,
        clientMotivation: data.clientMotivation,
        menuItems: {
          deleteMany: {},
          create: data.menuItems?.map((m: any) => ({
            name: m.name,
            type: m.type,
            sets: m.sets,
            reps: m.reps,
            weight: m.weight,
            note: m.note,
          })) || []
        },
        photos: {
          deleteMany: {},
          create: data.photos?.map((p: any) => ({
            url: p.url,
            viewType: p.viewType,
            timing: p.timing,
            aiAnalysis: p.aiAnalysis,
          })) || []
        }
      }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
