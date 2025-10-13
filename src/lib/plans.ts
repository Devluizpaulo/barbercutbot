
export interface Plan {
    id: 'lite' | 'business' | 'pro';
    name: string;
    description: string;
    price: number;
    features: string[];
    isFeatured?: boolean;
    priceId?: string; // Stripe Price ID
}

// ATENÇÃO: Substitua os valores de priceId pelos IDs reais gerados no seu painel da Stripe.
// Você pode encontrá-los na seção "Produtos" do seu dashboard Stripe.
export const PLANS: Plan[] = [
    {
        id: 'lite',
        name: 'Plano Essencial',
        description: 'Perfeito para organizar a agenda, clientes e o caixa do dia a dia.',
        price: 89.90,
        features: [
            'Agenda Online Completa',
            'Cadastro de Clientes (CRM)',
            'Controle de Caixa Simplificado',
            'Perfil de Divulgação Online',
            'Suporte via Ticket',
        ],
        priceId: 'price_...' // <-- COLE AQUI O ID DO PREÇO DO PLANO ESSENCIAL (LITE)
    },
    {
        id: 'business',
        name: 'Plano Business',
        description: 'Gestão completa com relatórios financeiros e controle de estoque.',
        price: 139.90,
        isFeatured: true,
        features: [
            'Tudo do Plano Essencial',
            'Controle Financeiro Avançado',
            'Gestão de Produtos e Estoque',
            'Relatórios de Desempenho',
            'Gestão de Equipe e Comissões',
            'Assistente IA (Opcional)',
        ],
        priceId: 'price_...' // <-- COLE AQUI O ID DO PREÇO DO PLANO BUSINESS
    },
    {
        id: 'pro',
        name: 'Plano Pro',
        description: 'A solução definitiva com automação total e funcionalidades exclusivas.',
        price: 189.90,
        features: [
            'Tudo do Plano Business',
            'Assistente IA no WhatsApp Incluído',
            'Lembretes de Agendamento Automáticos',
            'Campanhas de Marketing (em breve)',
            'Suporte Prioritário',
        ],
        priceId: 'price_...' // <-- COLE AQUI O ID DO PREÇO DO PLANO PRO
    }
];
