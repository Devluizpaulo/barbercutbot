# =============================================
# SCRIPT DE INICIALIZAÇÃO AUTOMÁTICA
# Plataforma SaaS WhatsApp + Firebase
# =============================================

Write-Host ""
Write-Host "🚀 ======================================" -ForegroundColor Cyan
Write-Host "🚀   PLATAFORMA SAAS WHATSAPP + FIREBASE" -ForegroundColor Cyan
Write-Host "🚀 ======================================" -ForegroundColor Cyan
Write-Host ""

# Função para verificar se comando existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# =============================================
# 1. VERIFICAR PRÉ-REQUISITOS
# =============================================
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Docker
if (Test-Command "docker") {
    $dockerVersion = docker --version
    Write-Host "  ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Docker não encontrado" -ForegroundColor Red
    Write-Host "     Instale em: https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
    $allGood = $false
}

# Docker Compose
if (Test-Command "docker-compose") {
    $composeVersion = docker-compose --version
    Write-Host "  ✅ Docker Compose instalado: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Docker Compose não encontrado" -ForegroundColor Red
    $allGood = $false
}

# Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Node.js não encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "     Instale em: https://nodejs.org/" -ForegroundColor Gray
}

Write-Host ""

if (-not $allGood) {
    Write-Host "❌ Instale os pré-requisitos e tente novamente." -ForegroundColor Red
    exit 1
}

# =============================================
# 2. VERIFICAR SE DOCKER ESTÁ RODANDO
# =============================================
Write-Host "🐋 Verificando se Docker está rodando..." -ForegroundColor Yellow

try {
    docker ps | Out-Null
    Write-Host "  ✅ Docker está rodando" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  ❌ Docker não está rodando" -ForegroundColor Red
    Write-Host "     Inicie o Docker Desktop e tente novamente." -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# =============================================
# 3. PARAR CONTAINERS EXISTENTES
# =============================================
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow

$existingContainers = docker-compose ps -q
if ($existingContainers) {
    docker-compose down | Out-Null
    Write-Host "  ✅ Containers anteriores parados" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Nenhum container rodando" -ForegroundColor Gray
}
Write-Host ""

# =============================================
# 4. INICIAR SERVIÇOS
# =============================================
Write-Host "🚀 Iniciando serviços Docker..." -ForegroundColor Yellow
Write-Host "   (Isso pode levar alguns minutos na primeira vez)" -ForegroundColor Gray
Write-Host ""

docker-compose up -d

Write-Host ""
Write-Host "  ✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""

# =============================================
# 5. AGUARDAR SERVIÇOS FICAREM SAUDÁVEIS
# =============================================
Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow

$maxWait = 60  # segundos
$waited = 0
$interval = 5

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $waited += $interval
    
    Write-Host "   Aguardando... ($waited/$maxWait segundos)" -ForegroundColor Gray
    
    # Verificar se Evolution está respondendo
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/manager" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Evolution API pronto!" -ForegroundColor Green
            break
        }
    } catch {
        # Continua esperando
    }
}

Write-Host ""

# =============================================
# 6. VERIFICAR STATUS DOS SERVIÇOS
# =============================================
Write-Host "📊 Status dos serviços:" -ForegroundColor Yellow
Write-Host ""

docker-compose ps

Write-Host ""

# =============================================
# 7. TESTAR CONECTIVIDADE
# =============================================
Write-Host "🔍 Testando conectividade..." -ForegroundColor Yellow
Write-Host ""

$services = @(
    @{Name="Evolution API"; URL="http://localhost:8081/manager"; Essential=$true},
    @{Name="N8N Automation"; URL="http://localhost:5678"; Essential=$true},
    @{Name="PostgreSQL Evolution"; Host="localhost"; Port=5432; Essential=$true},
    @{Name="PostgreSQL N8N"; Host="localhost"; Port=5433; Essential=$true}
)

foreach ($service in $services) {
    if ($service.URL) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✅ $($service.Name) - OK" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $($service.Name) - Indisponível" -ForegroundColor Red
        }
    } elseif ($service.Host -and $service.Port) {
        try {
            $connection = New-Object System.Net.Sockets.TcpClient($service.Host, $service.Port)
            $connection.Close()
            Write-Host "  ✅ $($service.Name) - OK" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $($service.Name) - Indisponível" -ForegroundColor Red
        }
    }
}

Write-Host ""

# =============================================
# 8. MOSTRAR INFORMAÇÕES DE ACESSO
# =============================================
Write-Host "🌐 ======================================" -ForegroundColor Cyan
Write-Host "🌐   URLs DE ACESSO" -ForegroundColor Cyan
Write-Host "🌐 ======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 Evolution Manager:" -ForegroundColor White
Write-Host "   http://localhost:8081/manager" -ForegroundColor Gray
Write-Host "   (Conecte seu WhatsApp aqui)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "🤖 N8N Automation:" -ForegroundColor White
Write-Host "   http://localhost:5678" -ForegroundColor Gray
Write-Host "   Usuário: admin" -ForegroundColor DarkGray
Write-Host "   Senha: n8n_admin_2024" -ForegroundColor DarkGray
Write-Host ""

Write-Host "🗄️ Bancos de Dados:" -ForegroundColor White
Write-Host "   PostgreSQL Evolution: localhost:5432" -ForegroundColor Gray
Write-Host "   PostgreSQL N8N: localhost:5433" -ForegroundColor Gray
Write-Host ""

# =============================================
# 9. PRÓXIMOS PASSOS
# =============================================
Write-Host "📋 ======================================" -ForegroundColor Cyan
Write-Host "📋   PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "📋 ======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Conectar WhatsApp:" -ForegroundColor Yellow
Write-Host "   • Acesse: http://localhost:8081/manager" -ForegroundColor Gray
Write-Host "   • Crie uma instância" -ForegroundColor Gray
Write-Host "   • Escaneie o QR Code" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Testar automação:" -ForegroundColor Yellow
Write-Host "   • Envie 'oi' para o WhatsApp conectado" -ForegroundColor Gray
Write-Host "   • Deve receber resposta automática" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  Configurar Firebase:" -ForegroundColor Yellow
Write-Host "   • cd firebase" -ForegroundColor Gray
Write-Host "   • firebase login" -ForegroundColor Gray
Write-Host "   • firebase init" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  Personalizar workflows:" -ForegroundColor Yellow
Write-Host "   • Acesse N8N: http://localhost:5678" -ForegroundColor Gray
Write-Host "   • Edite workflows visualmente" -ForegroundColor Gray
Write-Host ""

# =============================================
# 10. COMANDOS ÚTEIS
# =============================================
Write-Host "💡 ======================================" -ForegroundColor Cyan
Write-Host "💡   COMANDOS ÚTEIS" -ForegroundColor Cyan
Write-Host "💡 ======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ver logs em tempo real:" -ForegroundColor White
Write-Host "  docker-compose logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "Parar todos os serviços:" -ForegroundColor White
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""

Write-Host "Reiniciar um serviço específico:" -ForegroundColor White
Write-Host "  docker-compose restart evolution-api" -ForegroundColor Gray
Write-Host ""

Write-Host "Ver status dos containers:" -ForegroundColor White
Write-Host "  docker-compose ps" -ForegroundColor Gray
Write-Host ""

# =============================================
# 11. ABRIR NAVEGADOR (OPCIONAL)
# =============================================
$openBrowser = Read-Host "`nDeseja abrir Evolution Manager no navegador? (Y/n)"

if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Write-Host ""
    Write-Host "🌐 Abrindo Evolution Manager..." -ForegroundColor Green
    Start-Process "http://localhost:8081/manager"
}

Write-Host ""
Write-Host "✅ ======================================" -ForegroundColor Green
Write-Host "✅   PLATAFORMA INICIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "✅ ======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Veja o guia completo: QUICK_START.md" -ForegroundColor Cyan
Write-Host ""
