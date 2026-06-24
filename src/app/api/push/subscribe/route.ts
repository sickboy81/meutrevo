import { NextResponse } from 'next/server';

// In-memory store for push subscriptions (replace with DB in production)
const subscriptions = new Set<string>();

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json();
    if (subscription?.endpoint) {
      subscriptions.add(JSON.stringify(subscription));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) {
      // Remove matching subscriptions
      for (const sub of subscriptions) {
        const parsed = JSON.parse(sub);
        if (parsed.endpoint === endpoint) {
          subscriptions.delete(sub);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ count: subscriptions.size });
}
