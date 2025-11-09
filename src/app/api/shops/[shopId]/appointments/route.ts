
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
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

    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const barberIdsParam = url.searchParams.get('barberIds');
    const barberIds = barberIdsParam ? barberIdsParam.split(',').filter(Boolean) : [];
    const customerId = url.searchParams.get('customerId');

    let q: FirebaseFirestore.Query = firestore.collection(`barberShops/${shopId}/appointments`);
    q = q.where('barberShopId', '==', shopId); // Defensive query

    if (start) q = q.where('startTime', '>=', Timestamp.fromDate(new Date(start)));
    if (end) q = q.where('startTime', '<=', Timestamp.fromDate(new Date(end)));
    if (barberIds.length > 0) q = q.where('barberIds', 'array-contains-any', barberIds);
    if (customerId) q = q.where('customerId', '==', customerId);

    // Role-based filtering
    if (authz.role === 'barber') {
      q = q.where('barberIds', 'array-contains', decoded.uid);
    }
    
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('Error fetching appointments:', e);
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}
