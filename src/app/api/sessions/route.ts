import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { customerId, weight, bloodPressure, ...sessionData } = data;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // 1. Create the session
    const session = await prisma.session.create({
      data: {
        customerId,
        duration: sessionData.duration || 60,
        type: sessionData.type || "通常",
        conditionSelf: sessionData.conditionSelf,
        conditionObjective: sessionData.conditionObjective,
        routines: sessionData.routines,
        homework: sessionData.homework,
        conversation: sessionData.summary,
        aiSummary: sessionData.summary,
        aiAdvice: sessionData.advice,
        clientMotivation: sessionData.motivation,
      }
    });

    // 2. Create metrics if physical data is provided
    if (weight || bloodPressure || data.waist || data.belly || data.armL || data.armR || data.thighL || data.thighR || data.calfL || data.calfR) {
      await prisma.metric.create({
        data: {
          customerId,
          weight: weight ? parseFloat(weight) : null,
          bloodPressure: bloodPressure || null,
          waist: data.waist ? parseFloat(data.waist) : null,
          belly: data.belly ? parseFloat(data.belly) : null,
          armL: data.armL ? parseFloat(data.armL) : null,
          armR: data.armR ? parseFloat(data.armR) : null,
          thighL: data.thighL ? parseFloat(data.thighL) : null,
          thighR: data.thighR ? parseFloat(data.thighR) : null,
          calfL: data.calfL ? parseFloat(data.calfL) : null,
          calfR: data.calfR ? parseFloat(data.calfR) : null,
        }
      });
    }

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Failed to save session:', error);
    return NextResponse.json({ error: 'Failed to save session record.' }, { status: 500 });
  }
}
