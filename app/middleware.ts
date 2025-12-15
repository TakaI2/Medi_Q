import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_NAME = 'medi_q_token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'default-secret-change-in-production'
);

// 認証が必要なパス
const protectedPaths = ['/admin'];

// 認証不要なパス（protectedPaths内でも除外）
const publicPaths = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 保護されたパスかチェック
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  // トークンを確認
  const token = request.cookies.get(TOKEN_NAME);

  if (!token?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    await jwtVerify(token.value, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // トークンが無効な場合はログインページへリダイレクト
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(TOKEN_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
