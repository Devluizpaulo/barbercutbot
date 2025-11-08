
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/server';
import { authorize } from '@/app/api/_authz';

async function ensureAuthorized(uid: string, shopId: string, claims: any) {
  if (claims?.admin === true) return true;
  const shopSnap = await firestore.doc(`barberShops/${shopId}`).get();
  if (!shopSnap.exists) return false;
  const data = shopSnap.data() as any;
  return data?.ownerId === uid;
}

export async function GET(req: NextRequest, { params }: { params: { shopId: string } }) {
  try {
    const shopId = params.shopId;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await auth.verifyIdToken(token);
    const authz = await authorize(shopId, decoded, ['owner', 'manager']);
    if (!authz) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const colRef = firestore.collection(`barberShops/${shopId}/financialRecords`);
    const snap = await colRef.where('barberShopId', '==', shopId).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
