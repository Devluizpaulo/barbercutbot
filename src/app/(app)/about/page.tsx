'use client';

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sobre</h1>
      <p className="text-sm text-muted-foreground text-justify">
        Este software é de propriedade de <strong>Nexus Systems LPJ</strong> (CNPJ 62.618.880/0001-11).
        Razão Social: LUIZ PAULO GONCALVES MIGUEL DE JESUS DESENVOLVIMENTO DE SOFTWARE LTDA. Abertura: 08/09/2025 · Porte: ME.
      </p>
      <p className="text-sm text-muted-foreground text-justify">
        Atividade Principal: 62.04-0-00 - Consultoria em tecnologia da informação.
        Atividades Secundárias: 62.01-5-01; 62.01-5-02; 62.02-3-00; 63.11-9-00; 63.19-4-00.
      </p>
    </div>
  );
}
