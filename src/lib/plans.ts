
export interface Plan {
    id: 'lite' | 'business' | 'pro';
    name: string;
    description: string;
    price: number;
    features: string[];
    isFeatured?: boolean;
    preapprovalPlanId?: string; // ID do plano de assinatura do Mercado Pago
}

// ATENÇÃO: Substitua os valores de preapprovalPlanId pelos IDs reais gerados no seu painel do Mercado Pago.
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
        preapprovalPlanId: '2b790d6143164a769b2aae7da183ca07' // ID de exemplo que você forneceu.
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
        preapprovalPlanId: 'SUBSTITUIR_PELO_ID_DO_PLANO_BUSINESS' // ID fictício
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
        preapprovalPlanId: 'SUBSTITUIR_PELO_ID_DO_PLANO_PRO' // ID fictício
    }
];
