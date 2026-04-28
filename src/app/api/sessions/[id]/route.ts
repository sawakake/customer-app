import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    
    // 関連データの削除（PrismaのonDelete: Cascadeにより、SessionMenuやSessionPhotoも自動削除されます）
    await prisma.session.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
