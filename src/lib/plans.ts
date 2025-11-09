
export interface Plan {
    id: 'starter' | 'pro' | 'premium' | 'addon-ia' | string; // Allow dynamic IDs
    name: string;
    description: string;
    price: number;
    priceDetails: string;
    features: string[];
    isFeatured?: boolean;
    priceId?: string; // Stripe Price ID
    metadata?: Record<string, any>;
}
