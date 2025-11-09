
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/server';
import { authorize } from '@/app/api/_authz';

export async function GET(req: NextRequest, { params }: { params: { shopId: string } }) {
  try {
    const { shopId } = params;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await auth.verifyIdToken(token);
    const authz = await authorize(shopId, decoded, 'any');
    if (!authz) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const colRef = firestore.collection(`barberShops/${shopId}/products`);
    const snap = await colRef.where('barberShopId', '==', shopId).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('Error fetching products:', e);
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}
