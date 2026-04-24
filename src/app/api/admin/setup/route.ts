import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 【警告】このAPIは初期設定用です。
// 本番デプロイ直後に自分のアカウントを1つだけ作り、その後は削除するかアクセス制限をかけてください。
export async function POST(request: Request) {
  try {
    const { email, password, name, secretCode } = await request.json();

    // 簡易的な認証（誰でも登録できないようにするための秘密のコード）
    // 適宜 .env に移すか、一時的なものとして使ってください
    if (secretCode !== "gym-setup-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "admin",
      },
    });

    return NextResponse.json({ 
      message: "管理者アカウントを作成しました。",
      email: staff.email 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
