import { supabase } from '@/lib/supabase/server.supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: { contactId: string } }) {
  const { contactId } = await context.params;
  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('phone', contactId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = data?.messages?.map((msg: any, i: number) => ({
    id: `${contactId}-${i}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString(),
  })) || [];

  return NextResponse.json(messages);
}
