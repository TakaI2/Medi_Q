import * as bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'default-secret-change-in-production'
);
const TOKEN_NAME = 'medi_q_token';
const TOKEN_EXPIRY = '24h';

export interface TokenPayload {
  userId: number;
  username: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
  };
}

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWTトークンを生成
 */
export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * JWTトークンを検証
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * ログイン処理
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
    }

    const token = await createToken({
      userId: admin.id,
      username: admin.username,
    });

    // Cookieにトークンを設定
    const cookieStore = await cookies();
    cookieStore.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24時間
      path: '/',
    });

    return {
      success: true,
      user: { id: admin.id, username: admin.username },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'ログイン処理中にエラーが発生しました' };
  }
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/**
 * 現在のセッションを取得
 */
export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME);

    if (!token?.value) {
      return null;
    }

    return verifyToken(token.value);
  } catch {
    return null;
  }
}

/**
 * パスワード変更
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }

    const isValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isValid) {
      return { success: false, error: '現在のパスワードが正しくありません' };
    }

    const newHash = await hashPassword(newPassword);
    await prisma.admin.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'パスワード変更中にエラーが発生しました' };
  }
}
