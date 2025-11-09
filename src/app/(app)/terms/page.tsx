'use client';

export default function TermsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground text-justify">
        Este software é de propriedade de <strong>Nexus Systems LPJ</strong> (CNPJ 62.618.880/0001-11).
        O uso desta aplicação implica em concordância com estes Termos de Uso de caráter exemplificativo.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground text-justify">
        <li>Você concorda em utilizar o sistema de acordo com a legislação vigente.</li>
        <li>As funcionalidades podem evoluir sem aviso prévio.</li>
        <li>Não é permitida a engenharia reversa, cópia não autorizada ou redistribuição.</li>
        <li>Limitações de responsabilidade: o serviço é fornecido "como está".</li>
      </ol>
    </div>
  );
}
