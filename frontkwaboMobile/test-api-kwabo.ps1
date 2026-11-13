# Test de bout en bout de l'API KWABO (même API que le site et le mobile)
# Usage :  powershell -ExecutionPolicy Bypass -File .\test-api-kwabo.ps1
#          powershell -ExecutionPolicy Bypass -File .\test-api-kwabo.ps1 -ReadOnly     (aucune écriture)
param(
  [string]$Email,
  [switch]$ReadOnly,
  [string]$Base = 'https://kwabo.alwaysdata.net/api'
)

$ErrorActionPreference = 'Stop'
$script:Token = $null
$script:pass = 0
$script:fail = 0
$script:warn = 0

function Call($Method, $Path, $Body = $null) {
  $h = @{ Accept = 'application/json' }
  if ($script:Token) { $h.Authorization = "Bearer $($script:Token)" }
  $p = @{ Uri = "$Base$Path"; Method = $Method; Headers = $h; TimeoutSec = 30; UseBasicParsing = $true }
  if ($null -ne $Body) {
    $p.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 8))
    $p.ContentType = 'application/json; charset=utf-8'
  }
  try {
    $resp = Invoke-WebRequest @p
    $txt = [Text.Encoding]::UTF8.GetString($resp.RawContentStream.ToArray())
    $d = $null
    if ($txt) { try { $d = $txt | ConvertFrom-Json } catch {} }
    return @{ ok = $true; status = [int]$resp.StatusCode; data = $d; raw = $txt }
  } catch {
    $status = 0; $raw = $null
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $raw = $_.ErrorDetails.Message }
      else { try { $sr = New-Object IO.StreamReader($resp.GetResponseStream(), [Text.Encoding]::UTF8); $raw = $sr.ReadToEnd() } catch {} }
    }
    $json = $null
    if ($raw) { try { $json = $raw | ConvertFrom-Json } catch {} }
    return @{ ok = $false; status = $status; data = $json; raw = $raw; error = $_.Exception.Message }
  }
}

function Step($name, [scriptblock]$test) {
  try {
    $r = & $test
    if ($null -eq $r -or $r -eq $true) {
      Write-Host "  [OK]     $name" -ForegroundColor Green
      $script:pass++
    } else {
      Write-Host "  [ECHEC]  $name -> $r" -ForegroundColor Red
      $script:fail++
    }
  } catch {
    Write-Host "  [ECHEC]  $name -> $($_.Exception.Message)" -ForegroundColor Red
    $script:fail++
  }
}

function Warn($msg) { Write-Host "  [A VOIR] $msg" -ForegroundColor Yellow; $script:warn++ }
function Title($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }
function Expect($r, $status = @(200)) {
  if ($status -contains $r.status) { return $true }
  $m = if ($r.data -and $r.data.message) { $r.data.message } else { $r.error }
  $e = ''
  if ($r.data -and $r.data.errors) { $e = ' | ' + (($r.data.errors.PSObject.Properties | ForEach-Object { "$($_.Name): $($_.Value -join ' / ')" }) -join ' ; ') }
  return "HTTP $($r.status) (attendu $($status -join '/')) : $m$e"
}

# ---------------------------------------------------------------- 1. Public
Title "1. Public"
Step "GET /ping" { $r = Call GET '/ping'; if ($r.data.message -ne 'API KWABO OK') { return "reponse inattendue" }; $true }

$catalog = $null
Step "GET /catalog (4 univers)" {
  $r = Call GET '/catalog'; $x = Expect $r; if ($x -ne $true) { return $x }
  $script:catalog = $r.data.data
  if ($script:catalog.Count -lt 1) { return "catalogue vide" }
  $true
}
$allServices = @()
foreach ($cat in $catalog) { foreach ($s in $cat.services) { $allServices += [pscustomobject]@{ cat = $cat.slug; svc = $s } } }
Write-Host ("         univers : " + (($catalog | ForEach-Object { $_.slug }) -join ', '))
Write-Host ("         services: " + (($allServices | ForEach-Object { $_.svc.slug }) -join ', '))

# Le mobile a des photos et icones par slug : on signale les slugs inconnus
$localSlugs = 'suivi-chantier','investissement','foncier','soutien-famille','sante','evenements','faire-venir','comptabilite','administratif','transfert','fret','cadeaux'
foreach ($s in $allServices) { if ($localSlugs -notcontains $s.svc.slug) { Warn "slug '$($s.svc.slug)' inconnu du mobile (photo par defaut)" } }

Step "GET /services/{slug}" {
  $slug = $allServices[0].svc.slug
  Expect (Call GET "/services/$slug")
}

# ---------------------------------------------------------------- 2. Connexion
Title "2. Authentification"
Step "Login avec mauvais mot de passe -> 422" {
  $r = Call POST '/login' @{ email = 'inconnu@test.com'; password = 'Faux1234' }
  Expect $r @(422)
}

if (-not $Email) { $Email = Read-Host "E-mail du compte de test (compte verifie)" }
$sec = Read-Host "Mot de passe" -AsSecureString
$Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

$loginBody = @{ email = $Email; password = $Password; device_name = 'test-terminal' }
$r = Call POST '/login' $loginBody
if ($r.ok -and $r.data.needs_code) {
  $code = Read-Host "Double authentification activee : code a 6 chiffres"
  $loginBody.code = $code
  $r = Call POST '/login' $loginBody
}
if ($r.status -eq 403 -and $r.data.needs_verification) {
  Write-Host "  [STOP] E-mail non confirme : confirmez-le dans l'app (code a 6 chiffres) puis relancez." -ForegroundColor Red
  return
}
if (-not $r.ok -or -not $r.data.token) {
  Write-Host "  [STOP] Connexion impossible : $($r.data.message)" -ForegroundColor Red
  return
}
$script:Token = $r.data.token
$user = $r.data.user
Write-Host "  [OK]     Connecte : $($user.full_name) (role: $($user.role))" -ForegroundColor Green
$script:pass++
if ($user.role -ne 'user') { Warn "ce compte n'est pas un client : les routes client peuvent refuser" }

Step "GET /me" { $r = Call GET '/me'; $x = Expect $r; if ($x -ne $true) { return $x }; if ($r.data.data.email -ne $user.email) { return "e-mail different" }; $true }
Step "GET /counters" {
  $r = Call GET '/counters'; $x = Expect $r; if ($x -ne $true) { return $x }
  $c = if ($r.data.data) { $r.data.data } else { $r.data }
  Write-Host "         non lus: messages=$($c.unread_messages) notifs=$($c.unread_notifications) factures=$($c.due_invoices)"
  if ($r.data.data) { Warn "/counters est enveloppe dans data : adapter le mobile si besoin" }
  $true
}

# ---------------------------------------------------------------- 3. Demandes
Title "3. Demandes"
$reqs = $null
foreach ($q in '', '?page=1', '?per_page=20', '?per_page=100', '?per_page=200') {
  $r = Call GET "/requests$q"
  $label = if ($q) { $q } else { '(sans parametre)' }
  if ($r.ok) {
    Write-Host "  [OK]     GET /requests$q -> $($r.data.data.Count) demande(s), pages: $($r.data.meta.last_page)" -ForegroundColor Green
    $script:pass++
    if ($null -eq $script:reqs) { $script:reqs = $r.data.data }
  } else {
    Write-Host "  [ECHEC]  GET /requests$q -> $(Expect $r)" -ForegroundColor Red
    if ($r.raw) { Write-Host "           reponse: $($r.raw)" -ForegroundColor DarkGray }
    $script:fail++
  }
}
if ($reqs -and $reqs.Count -gt 0) {
  $first = $reqs[0]
  if (-not $first.service -or -not $first.service.slug) { Warn "requests[].service.slug absent : le mobile ne trouvera pas la photo du service" }
  if ($null -eq $first.PSObject.Properties['tracking']) { Warn "requests[].tracking absent" }
  Step "GET /requests/{id} (detail)" {
    $r = Call GET "/requests/$($first.id)"; $x = Expect $r; if ($x -ne $true) { return $x }
    $d = $r.data.data
    Write-Host "         statut=$($d.status) agent=$(if ($d.operator) { $d.operator.full_name } else { 'aucun' })"
    if ($d.operator -and -not $d.operator.full_name -and -not $d.operator.name) { Warn "operator sans full_name/name" }
    $true
  }
}

$testReqId = $null
if (-not $ReadOnly) {
  # Choisit un service sans champ fichier obligatoire
  $pick = $allServices | Where-Object {
    $svc = $_.svc; $svc.available -ne $false -and -not ($svc.form_fields | Where-Object { $_.type -eq 'file' -and $_.required })
  } | Select-Object -First 1
  $details = @{}
  foreach ($f in $pick.svc.form_fields) {
    if ($f.type -eq 'file') { continue }
    if (-not $f.required) { continue }
    $v = switch ($f.type) {
      'select' { if ($f.options -and $f.options.Count) { $o = $f.options[0]; if ($o -is [string]) { $o } else { $o.value } } else { 'Test' } }
      'number' { '10' }
      'date'   { (Get-Date).AddDays(7).ToString('yyyy-MM-dd') }
      'tel'    { '+22900000000' }
      default  { 'Test API terminal' }
    }
    $details[$f.name] = $v
  }
  Step "POST /requests (creer une demande de test)" {
    $r = Call POST '/requests' @{ service = $pick.svc.slug; title = 'TEST API terminal - a ignorer'; city = 'Cotonou'; urgency = 'normal'; description = 'Demande creee par le script de test.'; details = $details }
    $x = Expect $r @(200,201); if ($x -ne $true) { return "$x | $($r.raw)" }
    $script:testReqId = $r.data.data.id
    Write-Host "         creee : $($r.data.data.tracking) (id $($script:testReqId))"; $true
  }
  Step "POST /requests sans description -> 422" {
    $r = Call POST '/requests' @{ service = $pick.svc.slug; title = 'x' }
    Expect $r @(422)
  }
} else { Write-Host "  (mode lecture seule : creation ignoree)" -ForegroundColor DarkGray }

# ---------------------------------------------------------------- 4. Messages
Title "4. Messagerie"
$threadReq = if ($testReqId) { $testReqId } elseif ($reqs -and $reqs.Count) { $reqs[0].id } else { $null }
Step "GET /messages (fils)" {
  $r = Call GET '/messages'; $x = Expect $r; if ($x -ne $true) { return $x }
  $t = $r.data.data | Select-Object -First 1
  if ($t) {
    $lm = $t.last_message
    $kind = if ($null -eq $lm) { 'null' } elseif ($lm -is [string]) { 'texte' } else { 'objet (' + (($lm.PSObject.Properties.Name) -join ', ') + ')' }
    Write-Host "         last_message = $kind"
  }
  Write-Host "         non lus total = $($r.data.meta.unread_total)"; $true
}
if ($threadReq) {
  if (-not $ReadOnly) {
    Step "POST /requests/{id}/messages (texte)" {
      $r = Call POST "/requests/$threadReq/messages" @{ text = 'Message de test depuis le terminal.' }
      Expect $r @(200,201)
    }
  }
  Step "GET /requests/{id}/messages" {
    $r = Call GET "/requests/$threadReq/messages"; $x = Expect $r; if ($x -ne $true) { return $x }
    $m = $r.data.data | Select-Object -First 1
    if ($m) {
      foreach ($k in 'id','from','author','text','at') { if ($null -eq $m.PSObject.Properties[$k]) { return "champ '$k' absent des messages" } }
      Write-Host "         $($r.data.data.Count) message(s), from=$($m.from)"
    }
    $true
  }
  Step "POST /requests/{id}/messages/read" { Expect (Call POST "/requests/$threadReq/messages/read") }
}

# ---------------------------------------------------------------- 5. Documents / Paiements / Notifs / Parrainage
Title "5. Documents, paiements, notifications, parrainage"
Step "GET /documents" {
  $r = Call GET '/documents'; $x = Expect $r; if ($x -ne $true) { return $x }
  $n = 0; foreach ($g in $r.data.data) { $n += $g.documents.Count }; Write-Host "         $n document(s) dans $($r.data.data.Count) demande(s)"; $true
}
Step "GET /invoices" {
  $r = Call GET '/invoices'; $x = Expect $r; if ($x -ne $true) { return $x }
  Write-Host "         a payer=$($r.data.meta.due_total) EUR, paye=$($r.data.meta.paid_total) EUR, total=$($r.data.meta.count)"; $true
}
Step "GET /payment-methods" { Expect (Call GET '/payment-methods') }
Step "GET /notifications" {
  $r = Call GET '/notifications'; $x = Expect $r; if ($x -ne $true) { return $x }
  $n = $r.data.data | Select-Object -First 1
  if ($n) { foreach ($k in 'id','text','link','read','at') { if ($null -eq $n.PSObject.Properties[$k]) { return "champ '$k' absent" } }; Write-Host "         ex: $($n.text)" }
  $true
}
Step "GET /referrals" {
  $r = Call GET '/referrals'; $x = Expect $r; if ($x -ne $true) { return $x }
  $d = $r.data.data; Write-Host "         code=$($d.code) filleuls=$($d.stats.referrals) gains=$($d.stats.rewards)"; $true
}

# ---------------------------------------------------------------- 6. Profil
Title "6. Profil"
if (-not $ReadOnly) {
  Step "PATCH /profile (memes valeurs)" {
    $r = Call PATCH '/profile' @{ first_name = $user.first_name; last_name = $user.last_name; phone = $user.phone; country = $user.country }
    Expect $r
  }
  Step "PUT /profile/notifications (memes preferences)" {
    $prefs = @{}
    if ($user.notification_prefs) { $user.notification_prefs.PSObject.Properties | ForEach-Object { $prefs[$_.Name] = [bool]$_.Value } }
    foreach ($k in 'received','quote','started','report','done','payment') { if (-not $prefs.ContainsKey($k)) { $prefs[$k] = $true } }
    Expect (Call PUT '/profile/notifications' @{ prefs = $prefs })
  }
} else { Write-Host "  (mode lecture seule : ecritures profil ignorees)" -ForegroundColor DarkGray }

# ---------------------------------------------------------------- 7. Nettoyage
Title "7. Nettoyage"
if (-not $ReadOnly) {
  $all = Call GET '/requests'
  if ($all.ok) {
    $leftovers = $all.data.data | Where-Object { $_.title -like 'TEST API terminal*' -and $_.status -in 'pending','active' }
    foreach ($l in $leftovers) {
      Step "Annule la demande de test $($l.tracking)" { Expect (Call POST "/requests/$($l.id)/cancel") }
    }
  } else { Warn "impossible de lister les demandes pour nettoyer les tests" }
}
Step "Token invalide -> 401" {
  $save = $script:Token; $script:Token = 'faux-token'
  $r = Call GET '/me'; $script:Token = $save
  Expect $r @(401)
}
Step "POST /logout" { Expect (Call POST '/logout') }

# ---------------------------------------------------------------- Bilan
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host (" Bilan : {0} OK, {1} echec(s), {2} point(s) a voir" -f $script:pass, $script:fail, $script:warn) -ForegroundColor $(if ($script:fail -eq 0) { 'Green' } else { 'Red' })
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Non teste ici : envoi de fichiers (multipart), paiement d'une facture, double authentification." -ForegroundColor DarkGray
