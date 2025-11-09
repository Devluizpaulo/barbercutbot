
import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/server';
import { Plan } from '@/lib/plans';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const plansRef = firestore.collection('platform').doc('pricing').collection('plans');
    const snapshot = await plansRef.orderBy('price', 'asc').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ plans: [] });
    }
    
    const plans: Plan[] = snapshot.docs.map(doc => doc.data() as Plan);
    
    return NextResponse.json({ plans });

  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
