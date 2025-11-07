import { firestore } from '@/firebase/server';

export type MemberRole = 'owner' | 'manager' | 'barber' | 'staff' | null;

export async function getMemberRole(shopId: string, uid: string): Promise<MemberRole> {
  const snap = await firestore.doc(`barberShops/${shopId}/members/${uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data() as any;
  const role = data?.role as MemberRole;
  return role ?? null;
}

export async function authorize(shopId: string, decoded: any, allowed: MemberRole[] | 'any'): Promise<{ role: MemberRole } | null> {
  if (decoded?.admin === true || decoded?.claims?.admin === true) return { role: 'owner' };
  const role = await getMemberRole(shopId, decoded.uid);
  if (!role) return null;
  if (allowed === 'any' || allowed.includes(role)) return { role };
  return null;
}
