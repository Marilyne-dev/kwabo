Set-Location $PSScriptRoot
$base = "http://127.0.0.1:8010/api"
$logFile = Join-Path $PSScriptRoot "storage\logs\laravel.log"
$script:pass = 0
$script:fail = 0

function Short($s) {
  if ($s -and $s.Length -gt 300) { return $s.Substring(0, 300) }
  return $s
}

function Check($name, $ok, $detail = "") {
  if ($ok) {
    Write-Host ("[OK]   " + $name) -ForegroundColor Green
    $script:pass++
  } else {
    Write-Host ("[FAIL] " + $name) -ForegroundColor Red
    if ($detail) { Write-Host ("       " + $detail) -ForegroundColor DarkGray }
    $script:fail++
  }
}

function Req($method, $path, $body = $null, $token = $null) {
  while ($true) {
    $headers = @{ Accept = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Method = $method; Uri = ($base + $path); Headers = $headers; UseBasicParsing = $true }
    if ($body -ne $null) {
      $params["ContentType"] = "application/json; charset=utf-8"
      $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 6))
    }
    $status = 0
    $content = ""
    try {
      $resp = Invoke-WebRequest @params
      $status = [int]$resp.StatusCode
      $content = $resp.Content
    } catch {
      $r = $_.Exception.Response
      if ($r -eq $null) { throw }
      $status = [int]$r.StatusCode
      $content = $_.ErrorDetails.Message
      if (-not $content -and ($r | Get-Member -Name GetResponseStream -ErrorAction SilentlyContinue)) {
        $reader = New-Object System.IO.StreamReader($r.GetResponseStream())
        $content = $reader.ReadToEnd()
      }
    }
    if ($status -eq 429) {
      Write-Host "   (limite de 10 requetes par minute atteinte, pause de 62 secondes...)" -ForegroundColor DarkYellow
      Start-Sleep -Seconds 62
      continue
    }
    $json = $null
    try { $json = $content | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ Status = $status; Json = $json; Raw = $content }
  }
}

function LastCode {
  $line = Select-String -Path $logFile -Pattern "Votre code KWABO" | Select-Object -Last 1
  if (-not $line) { return "" }
  return [regex]::Match($line.Line, '\d{6}').Value
}

function Tinker($php) {
  php artisan tinker --execute="$php" 2>$null | Out-Null
}

# ---------- Test 1 : connexion client ----------
Write-Host ""
Write-Host "== Test 1 : connexion client =="
$r = Req "Post" "/login" @{ email = "client@kwabo.demo"; password = "Demo1234" }
Check "login client demo : jeton recu" ($r.Status -eq 200 -and $r.Json.token) (Short $r.Raw)
$token = $r.Json.token
if (-not $token) {
  Write-Host "Impossible de continuer sans jeton (serveur lance sur le port 8010 ?)." -ForegroundColor Red
  exit 1
}

# ---------- Test 2 : inscription et mot de passe ----------
Write-Host ""
Write-Host "== Test 2 : inscription et mot de passe =="
$email = "test" + (Get-Random) + "@exemple.com"
$regBase = @{ first_name = "Test"; last_name = "Client"; email = $email; phone = "+229 01 00 00 00 99"; country = "Benin" }
function Reg($password) {
  $b = $regBase.Clone()
  $b["password"] = $password
  return (Req "Post" "/register" $b)
}
$r = Reg "Motdepasse"
Check "2a. mot de passe sans chiffre refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.password) (Short $r.Raw)
$r = Reg "motdepasse1"
Check "2b. mot de passe sans majuscule refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.password) (Short $r.Raw)
$r = Reg "Motdepasse1"
Check "2c. inscription correcte : needs_verification et pas de jeton" ($r.Status -eq 201 -and $r.Json.needs_verification -eq $true -and -not $r.Json.token) (Short $r.Raw)
$r = Reg "Motdepasse1"
Check "2d. meme e-mail refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.email) (Short $r.Raw)

# ---------- Test 3 : confirmation de l'e-mail ----------
Write-Host ""
Write-Host "== Test 3 : confirmation de l'e-mail =="
$r = Req "Post" "/login" @{ email = $email; password = "Motdepasse1" }
Check "3a. connexion avant confirmation refusee (403)" ($r.Status -eq 403 -and $r.Json.needs_verification -eq $true) (Short $r.Raw)
$r = Req "Post" "/email/verify" @{ email = $email; code = "000000" }
Check "3b. mauvais code refuse (422)" ($r.Status -eq 422) (Short $r.Raw)
$code = LastCode
Write-Host ("   code lu dans le journal : " + $code)
$v = Req "Post" "/email/verify" @{ email = $email; code = $code }
Check "3c. bon code : jeton recu" ($v.Status -eq 200 -and $v.Json.token) (Short $v.Raw)
Check "3c. email_verified vaut true" ($v.Json.user.email_verified -eq $true)
$tokenNew = $v.Json.token
$me = Req "Get" "/me" $null $tokenNew
Check "3c. /me avec le nouveau jeton" ($me.Status -eq 200 -and $me.Json.data.email -eq $email) (Short $me.Raw)
$r = Req "Post" "/login" @{ email = $email; password = "Motdepasse1" }
Check "3d. connexion normale apres confirmation" ($r.Status -eq 200 -and $r.Json.token) (Short $r.Raw)

# ---------- Test 4 : creer une demande et lire son detail ----------
Write-Host ""
Write-Host "== Test 4 : creation et detail d'une demande =="
$c = Req "Post" "/requests" @{ service = "suivi-chantier"; city = "Cotonou"; urgency = "urgent"; details = @{ adresse = "Quartier Fidjrosse" } } $token
Check "4a. creation (201) avec numero de suivi" ($c.Status -eq 201 -and $c.Json.data.tracking -match '^KW-\d{4}-\d{4}$') (Short $c.Raw)
$id = $c.Json.data.id
$tracking = $c.Json.data.tracking
$d = Req "Get" "/requests/$id" $null $token
$names = @($d.Json.data.PSObject.Properties.Name)
foreach ($f in @("history", "documents", "invoice_due", "invoices", "review", "rating", "quote")) {
  Check ("4b. le detail contient " + $f) ($names -contains $f)
}

# ---------- Test 5 : liste, recherche, filtre ----------
Write-Host ""
Write-Host "== Test 5 : liste, recherche et filtre =="
$r = Req "Get" "/requests" $null $token
Check "5a. liste (au moins 1 demande)" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/requests?status=pending" $null $token
Check "5b. filtre status=pending" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1 -and @($r.Json.data | Where-Object { $_.status -ne "pending" }).Count -eq 0) (Short $r.Raw)
$r = Req "Get" "/requests?search=chantier" $null $token
Check "5c. recherche par mot (chantier)" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/requests?search=$tracking" $null $token
Check "5d. recherche par numero de suivi" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/requests?search=zzzintrouvable" $null $token
Check "5e. recherche sans resultat" ($r.Status -eq 200 -and $r.Raw -match '"data"\s*:\s*\[\s*\]') (Short $r.Raw)
$r = Req "Get" "/requests?status=nimporte" $null $token
Check "5f. statut inconnu refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

# ---------- Test 6 : envoi et telechargement de fichier ----------
Write-Host ""
Write-Host "== Test 6 : fichier (ordonnance du service Sante) =="
$tmpPdf = Join-Path $env:TEMP "ordonnance.pdf"
Set-Content -Path $tmpPdf -Value ("%PDF-1.4`n% test ordonnance`n%%EOF") -Encoding Ascii
$tmpExe = Join-Path $env:TEMP "virus.exe"
Set-Content -Path $tmpExe -Value "MZ faux programme" -Encoding Ascii
$outFile = Join-Path $env:TEMP "kwabo_upload.json"

$curlArgs = @("-s", "-o", $outFile, "-w", "%{http_code}", "-X", "POST", "$base/requests",
  "-H", "Accept: application/json", "-H", "Authorization: Bearer $token",
  "-F", "service=sante", "-F", "city=Cotonou", "-F", "details[patient]=Test Patient",
  "-F", "files[ordonnance]=@$tmpPdf")
$http = & curl.exe @curlArgs
$raw = Get-Content $outFile -Raw
Check "6a. envoi d'un PDF (201)" ("$http".Trim() -eq "201") (Short $raw)
$docId = $null
try {
  $up = $raw | ConvertFrom-Json
  Check "6a. le document apparait dans la demande" (@($up.data.documents).Count -ge 1)
  $docId = $up.data.documents[0].id
} catch { Check "6a. reponse lisible" $false (Short $raw) }

$curlArgs = @("-s", "-o", $outFile, "-w", "%{http_code}", "-X", "POST", "$base/requests",
  "-H", "Accept: application/json", "-H", "Authorization: Bearer $token",
  "-F", "service=sante", "-F", "details[patient]=Test Patient",
  "-F", "files[ordonnance]=@$tmpExe")
$http = & curl.exe @curlArgs
Check "6b. fichier .exe refuse (422)" ("$http".Trim() -eq "422") (Short (Get-Content $outFile -Raw))

if ($docId) {
  $dl = Join-Path $env:TEMP "kwabo_copie.pdf"
  $http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $token" "$base/documents/$docId/download"
  Check "6c. telechargement par le proprietaire (200, bon contenu)" ("$http".Trim() -eq "200" -and (Get-Content $dl -Raw) -match "test ordonnance")
  $http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" "$base/documents/$docId/download"
  Check "6d. telechargement sans jeton refuse (401)" ("$http".Trim() -eq "401")
  $http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $tokenNew" "$base/documents/$docId/download"
  Check "6e. telechargement par un autre client refuse (403)" ("$http".Trim() -eq "403")
}

# ---------- Test 7 : double authentification ----------
# ---------- Test 7 : double authentification (application d'authentification) ----------
Write-Host ""
Write-Host "== Test 7 : double authentification =="

function Totp($secret) {
  $out = php artisan tinker --execute="echo (new \PragmaRX\Google2FA\Google2FA())->getCurrentOtp('$secret');" 2>$null
  return [regex]::Match(($out -join " "), '\d{6}').Value
}

try {
  $r = Req "Post" "/two-factor/setup" $null $token
  Check "7a. preparation : cle secrete et QR code recus" ($r.Status -eq 200 -and $r.Json.secret -and $r.Json.qr_svg -match "<svg") (Short $r.Raw)
  $secret = $r.Json.secret

  $r = Req "Post" "/two-factor/enable" @{ code = "000000" } $token
  Check "7b. activation avec un mauvais code refusee (422)" ($r.Status -eq 422) (Short $r.Raw)

  $r = Req "Post" "/two-factor/enable" @{ code = (Totp $secret) } $token
  Check "7c. activation avec le bon code" ($r.Status -eq 200 -and $r.Json.data.two_factor_enabled -eq $true) (Short $r.Raw)

  $r = Req "Post" "/login" @{ email = "client@kwabo.demo"; password = "Demo1234" }
  Check "7d. connexion sans code : needs_code et pas de jeton" ($r.Status -eq 200 -and $r.Json.needs_code -eq $true -and -not $r.Json.token) (Short $r.Raw)

  $r = Req "Post" "/login" @{ email = "client@kwabo.demo"; password = "Demo1234"; code = "000000" }
  Check "7e. mauvais code refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

  $r = Req "Post" "/login" @{ email = "client@kwabo.demo"; password = "Demo1234"; code = (Totp $secret) }
  Check "7f. bon code : jeton recu" ($r.Status -eq 200 -and $r.Json.token) (Short $r.Raw)

  $r = Req "Post" "/two-factor/disable" @{ password = "mauvais" } $token
  Check "7g. desactivation avec un mauvais mot de passe refusee (422)" ($r.Status -eq 422) (Short $r.Raw)

  $r = Req "Post" "/two-factor/disable" @{ password = "Demo1234" } $token
  Check "7h. desactivation avec le bon mot de passe" ($r.Status -eq 200 -and $r.Json.data.two_factor_enabled -eq $false) (Short $r.Raw)
}
finally {
  Tinker "App\Models\User::where('email','client@kwabo.demo')->update(['two_factor_enabled'=>false,'two_factor_secret'=>null]);"
}

# ---------- Test 8 : securite ----------
Write-Host ""
Write-Host "== Test 8 : securite =="
$r = Req "Post" "/login" @{ email = "admin@kwabo.demo"; password = "Demo1234" }
Check "8a. admin refuse sur la connexion client" ($r.Status -eq 422 -and $r.Json.errors.email -match "administration") (Short $r.Raw)
$r = Req "Post" "/admin/login" @{ email = "client@kwabo.demo"; password = "Demo1234" }
Check "8b. client refuse sur la connexion admin" ($r.Status -eq 422 -and $r.Json.errors.email -match "KWABO") (Short $r.Raw)
$r = Req "Get" "/requests"
Check "8c. sans jeton : 401" ($r.Status -eq 401) (Short $r.Raw)
$r = Req "Get" "/requests/$id" $null $tokenNew
Check "8d. la demande d'un autre client est interdite (403)" ($r.Status -eq 403) (Short $r.Raw)

# ---------- Annulation ----------
Write-Host ""
Write-Host "== Annulation =="
$r = Req "Post" "/requests/$id/cancel" $null $token
Check "annulation (200, statut cancelled)" ($r.Status -eq 200 -and $r.Json.data.status -eq "cancelled") (Short $r.Raw)
$r = Req "Post" "/requests/$id/cancel" $null $token
Check "deuxieme annulation refusee (422)" ($r.Status -eq 422) (Short $r.Raw)

# ---------- Nettoyage et resultat ----------
Tinker "App\Models\User::where('email','like','test%@exemple.com')->delete();"
Write-Host ""
Write-Host ("RESULTAT : " + $script:pass + " OK, " + $script:fail + " FAIL")
if ($script:fail -gt 0) { exit 1 }