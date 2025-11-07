
'use client';

import { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
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
    const { user } = useUser();

    // Query for all shops, but only if the user is a confirmed admin.
    const shopsQuery = useMemoFirebase(() => {
        if (user?.role === 'admin') {
            return collection(firestore, 'barberShops');
        }
        return null; 
    }, [firestore, user]);
    const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);

    // Query for ALL users, only if the user is an admin.
    const usersQuery = useMemoFirebase(() => {
        if (user?.role === 'admin') {
            return collection(firestore, 'users');
        }
        return null;
    }, [firestore, user]);
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
