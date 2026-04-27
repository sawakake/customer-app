import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const videos = await prisma.videoGuide.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const video = await prisma.videoGuide.create({
      data: {
        title: body.title,
        url: body.url,
        description: body.description,
        category: body.category || 'その他'
      }
    });
    return NextResponse.json(video);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
