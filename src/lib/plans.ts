
export interface Plan {
    id: 'free' | 'lite' | 'business' | 'pro';
    name: string;
    description: string;
    price: number;
    features: string[];
}

export const PLANS: Plan[] = [
    {
        id: 'lite',
        name: 'Plano Lite',
        description: 'Ideal para negócios individuais e equipes pequenas começando a se organizar.',
        price: 39.90,
        features: [
            'Até 3 profissionais',
            'Agenda Online Completa',
            'Cadastro de Clientes',
            'Controle de Caixa Básico'
        ]
    },
    {
        id: 'business',
        name: 'Plano Business',
        description: 'Para negócios em crescimento que buscam mais controle e automação.',
        price: 79.90,
        features: [
            'Até 10 profissionais',
            'Tudo do Plano Lite',
            'Controle Financeiro Completo',
            'Relatórios de Desempenho',
            'Gestão de Produtos',
        ]
    },
    {
        id: 'pro',
        name: 'Plano Pro',
        description: 'A solução definitiva para escalar seu negócio com o máximo de automação.',
        price: 129.90,
        features: [
            'Profissionais Ilimitados',
            'Tudo do Plano Business',
            'Assistente IA no WhatsApp',
            'Lembretes Automáticos',
            'Marketing e Fidelização (em breve)',
        ]
    }
];
