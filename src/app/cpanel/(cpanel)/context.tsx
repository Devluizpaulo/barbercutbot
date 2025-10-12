'use client';

import { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { BarberShop, UserProfile } from "@/lib/types";

interface CPanelContextType {
    shops: BarberShop[] | null;
    users: UserProfile[] | null;
    isLoading: boolean;
}

const CPanelContext = createContext<CPanelContextType | null>(null);

export function CPanelProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const shopsQuery = useMemoFirebase(() => collection(firestore, 'barberShops'), [firestore]);
    const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);

    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('role', '==', 'owner')), [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const value = useMemo(() => ({
        shops,
        users,
        isLoading: isLoadingShops || isLoadingUsers
    }), [shops, users, isLoadingShops, isLoadingUsers]);

    return (
        <CPanelContext.Provider value={value}>
            {children}
        </CPanelContext.Provider>
    );
}

export function useCPanel() {
    const context = useContext(CPanelContext);
    if (!context) {
        throw new Error('useCPanel deve ser usado dentro de um CPanelProvider');
    }
    return context;
}
