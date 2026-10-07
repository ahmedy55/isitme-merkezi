import { NextResponse } from 'next/server';

/**
 * The former QA login endpoint could create or reset accounts without a
 * verified session. Keep a JSON tombstone so API clients get a clear 404
 * instead of Next.js's HTML fallback, without restoring that unsafe behavior.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Bu uç nokta kullanımdan kaldırılmıştır.' },
    { status: 404 },
  );
}
