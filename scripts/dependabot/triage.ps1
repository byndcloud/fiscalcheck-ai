<#
.SYNOPSIS
  Triagem em batch dos PRs abertos pelo dependabot.

.DESCRIPTION
  Lista PRs com label "dependencies", classifica cada um pelo delta
  de major version (parseado do titulo) e aplica:

    A (auto-merge): bump de patch/minor ou grupo. Aprova e habilita
                    auto-merge squash com --delete-branch.
    C (close):      bump de major (single ou multi). Fecha com
                    comentario padronizado direcionando para a issue
                    de tracking de majors pendentes.
    U (unknown):    titulo nao bate o regex esperado. Ignora e lista
                    para revisao manual.

  Premissas:
    - A nova .github/dependabot.yml ja ignora majors, entao a longo
      prazo nao deve aparecer mais nenhum "C". Este script existe
      principalmente para limpar o backlog atual.
    - Roda DRY-RUN por padrao. Use -Execute para aplicar.

.PARAMETER Execute
  Aplica as acoes de verdade. Sem essa flag, so imprime o plano.

.PARAMETER Repo
  Opcional. Override do repositorio (formato owner/repo). Por padrao,
  usa o remote 'origin'.

.EXAMPLE
  ./scripts/dependabot/triage.ps1
  # dry-run: mostra o plano

.EXAMPLE
  ./scripts/dependabot/triage.ps1 -Execute
  # aplica auto-merge + close em batch

.NOTES
  Requer gh CLI autenticado (gh auth status).
  Politica documentada em .github/dependabot.yml e AGENTS.md.
#>

[CmdletBinding()]
param(
  [switch]$Execute,
  [string]$Repo
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) nao encontrado. Instale com: scoop install gh"
}

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "gh nao autenticado. Rode: gh auth login"
}

$DryRun = -not $Execute
$repoArgs = @()
if ($Repo) { $repoArgs += @('--repo', $Repo) }

Write-Host ""
if ($DryRun) {
  Write-Host "MODO: DRY-RUN (nenhuma acao sera executada)" -ForegroundColor Yellow
} else {
  Write-Host "MODO: EXECUCAO REAL" -ForegroundColor Red
}
Write-Host ""

$prsJson = gh pr list @repoArgs --limit 60 --label dependencies --state open `
  --json number,title,headRefName,mergeStateStatus,author
$prs = $prsJson | ConvertFrom-Json

if (-not $prs -or $prs.Count -eq 0) {
  Write-Host "Nenhum PR aberto com label 'dependencies'."
  exit 0
}

Write-Host "PRs encontrados: $($prs.Count)"
Write-Host ""

$closeComment = @"
Fechado pela politica do projeto: dependabot NAO abre PRs de major bump.

Majors sao tratados manualmente em branch dedicada, com revisao humana
e ajustes de codigo necessarios. Ver:
  - .github/dependabot.yml (ignore global de majors)
  - AGENTS.md (sem aprovacao silenciosa de mudancas de runtime)

Este pacote esta listado na issue de tracking de majors pendentes
(label: major-bump-pending). Quando for a hora de migrar, abra um PR
manual em branch dedicada com os ajustes de codigo necessarios.
"@

$plan = @()

foreach ($pr in $prs) {
  $title = $pr.title

  $isGroup = $title -match 'group with \d+ updates?'
  $bumpMatch = [regex]::Match(
    $title,
    'Bump\s+\S+\s+from\s+(\d+)\.\d+(?:\.\d+)?(?:[-+][\w.]+)?\s+to\s+(\d+)\.\d+(?:\.\d+)?(?:[-+][\w.]+)?'
  )

  if ($isGroup) {
    $action = 'A'
    $reason = 'group bump (patch/minor pela config)'
  } elseif ($bumpMatch.Success) {
    $fromMajor = [int]$bumpMatch.Groups[1].Value
    $toMajor   = [int]$bumpMatch.Groups[2].Value
    if ($toMajor -gt $fromMajor) {
      $delta = $toMajor - $fromMajor
      $action = 'C'
      $reason = if ($delta -eq 1) { "major $fromMajor -> $toMajor" } else { "MULTI-major $fromMajor -> $toMajor (delta=$delta)" }
    } else {
      $action = 'A'
      $reason = "patch/minor (v$fromMajor.x)"
    }
  } else {
    $action = 'U'
    $reason = 'titulo nao parseavel; revisar manualmente'
  }

  $plan += [pscustomobject]@{
    PR     = "#$($pr.number)"
    Action = $action
    Reason = $reason
    Title  = if ($title.Length -gt 70) { $title.Substring(0, 67) + '...' } else { $title }
  }
}

$plan | Sort-Object Action, PR | Format-Table -AutoSize

$counts = $plan | Group-Object Action | ForEach-Object { "$($_.Name)=$($_.Count)" }
Write-Host ""
Write-Host "Resumo: $($counts -join ', ')"
Write-Host ""

if ($DryRun) {
  Write-Host "Para aplicar de verdade: ./scripts/dependabot/triage.ps1 -Execute" -ForegroundColor Yellow
  exit 0
}

$errors = 0
foreach ($item in $plan) {
  $num = $item.PR.TrimStart('#')
  try {
    switch ($item.Action) {
      'A' {
        Write-Host "[$($item.PR)] Aprovando + auto-merge: $($item.Title)" -ForegroundColor Green
        gh pr review @repoArgs $num --approve | Out-Null
        gh pr merge @repoArgs $num --squash --auto --delete-branch | Out-Null
      }
      'C' {
        Write-Host "[$($item.PR)] Fechando (major bump): $($item.Title)" -ForegroundColor Red
        gh pr close @repoArgs $num --comment $closeComment | Out-Null
      }
      'U' {
        Write-Host "[$($item.PR)] PULADO (revisar manualmente): $($item.Title)" -ForegroundColor Yellow
      }
    }
  } catch {
    $errors++
    Write-Warning "Falha em $($item.PR): $_"
  }
}

Write-Host ""
Write-Host "Concluido. Verifique: gh pr list --label dependencies --state open"
if ($errors -gt 0) {
  Write-Warning "$errors erro(s) durante execucao. Veja saida acima."
  exit 1
}
