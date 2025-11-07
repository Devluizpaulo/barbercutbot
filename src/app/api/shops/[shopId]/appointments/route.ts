import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { authorize } from '@/app/api/_authz';

async function ensureAuthorized(uid: string, shopId: string, claims: any) {
  if (claims?.admin === true) return true;
  const shopSnap = await firestore.doc(`barberShops/${shopId}`).get();
  if (!shopSnap.exists) return false;
  const data = shopSnap.data() as any;
  return data?.ownerId === uid;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;
    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const barberIdsParam = url.searchParams.get('barberIds');
    const barberIds = barberIdsParam ? barberIdsParam.split(',').filter(Boolean) : [];
    const customerId = url.searchParams.get('customerId');
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await auth.verifyIdToken(token);
    // Check member role (owner/manager/barber/staff)
    const authz = await authorize(shopId, decoded, 'any');
    if (!authz) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let q: FirebaseFirestore.Query = firestore.collection(`barberShops/${shopId}/appointments`);
    // Always constrain to this shop (defensive)
    q = q.where('barberShopId', '==', shopId);
    if (start) {
      const ts = Timestamp.fromDate(new Date(start));
      q = q.where('startTime', '>=', ts);
    }
    if (end) {
      const te = Timestamp.fromDate(new Date(end));
      q = q.where('startTime', '<=', te);
    }
    if (barberIds.length > 0) {
      q = q.where('barberIds', 'array-contains-any', barberIds);
    }
    if (customerId) {
      q = q.where('customerId', '==', customerId);
    }
    // Role-based narrowing: barbers only see their own appointments
    if (authz.role === 'barber') {
      q = q.where('barberIds', 'array-contains', decoded.uid);
    }
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
