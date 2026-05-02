import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { query, lenses } = await request.json();
  
  const response = await fetch(`${process.env.BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      lenses,
      user_id: (session.user as any).id,
      privacy_budget: 2.0
    })
  });
  
  const result = await response.json();
  
  await fetch(`${process.env.BACKEND_URL}/usage/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: (session.user as any).id,
      analysis_id: result.analysis_id,
      tokens_used: result.tokens_used
    })
  });
  
  return NextResponse.json(result);
}
