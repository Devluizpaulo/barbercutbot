
import { NextResponse } from 'next/server';

// This webhook is deprecated and is no longer in use.
// It is kept to avoid breaking type validation from Next.js caching.
export async function POST(req: Request) {
  return NextResponse.json({ message: "This webhook is inactive." });
}
