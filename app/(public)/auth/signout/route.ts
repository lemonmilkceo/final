import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { origin } = new URL(request.url);

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/`);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { origin } = new URL(request.url);

  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/`);
}
