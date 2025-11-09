'use client';

export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground text-justify">
        Este software é de propriedade de <strong>Nexus Systems LPJ</strong> (CNPJ 62.618.880/0001-11). Este documento é um exemplo de política de privacidade.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground text-justify">
        <li>Coletamos informações necessárias para operar o serviço.</li>
        <li>Utilizamos os dados para autenticação, suporte e melhoria de produto.</li>
        <li>Você pode solicitar a exclusão de dados conforme a legislação aplicável.</li>
        <li>Podemos atualizar esta política periodicamente.</li>
      </ol>
    </div>
  );
}
