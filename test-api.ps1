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


# ---------- Test 9 : compte (profil, mot de passe, preferences, mot de passe oublie, suppression) ----------
Write-Host ""
Write-Host "== Test 9 : compte =="

$r = Req "Patch" "/profile" @{ first_name = "Testeur"; last_name = "Modifie"; phone = "+229 01 11 11 11 11"; country = "Benin" } $tokenNew
Check "9a. modification du profil" ($r.Status -eq 200 -and $r.Json.data.first_name -eq "Testeur" -and $r.Json.data.country -eq "Benin") (Short $r.Raw)
$r = Req "Patch" "/profile" @{ first_name = "Testeur"; last_name = "Modifie"; phone = "12"; country = "Benin" } $tokenNew
Check "9b. telephone trop court refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.phone) (Short $r.Raw)

$r = Req "Put" "/profile/password" @{ current_password = "mauvais"; password = "Nouveau1234" } $tokenNew
Check "9c. mauvais mot de passe actuel refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.current_password) (Short $r.Raw)
$r = Req "Put" "/profile/password" @{ current_password = "Motdepasse1"; password = "faible" } $tokenNew
Check "9d. nouveau mot de passe trop faible refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.password) (Short $r.Raw)
$rOld = Req "Post" "/login" @{ email = $email; password = "Motdepasse1" }
$oldTok = $rOld.Json.token
$r = Req "Put" "/profile/password" @{ current_password = "Motdepasse1"; password = "Nouveau1234" } $tokenNew
Check "9e. changement de mot de passe" ($r.Status -eq 200) (Short $r.Raw)
$r = Req "Get" "/me" $null $oldTok
Check "9f. les autres appareils sont deconnectes (401)" ($r.Status -eq 401) (Short $r.Raw)
$r = Req "Post" "/login" @{ email = $email; password = "Nouveau1234" }
Check "9g. connexion avec le nouveau mot de passe" ($r.Status -eq 200 -and $r.Json.token) (Short $r.Raw)

$r = Req "Put" "/profile/notifications" @{ prefs = @{ quote = $false; report = $false } } $tokenNew
Check "9h. preferences enregistrees" ($r.Status -eq 200 -and $r.Json.data.notification_prefs.quote -eq $false -and $r.Json.data.notification_prefs.received -eq $true) (Short $r.Raw)
$r = Req "Put" "/profile/notifications" @{ prefs = @{ nimporte = $true } } $tokenNew
Check "9i. cle inconnue ignoree" ($r.Status -eq 200 -and (@($r.Json.data.notification_prefs.PSObject.Properties.Name) -notcontains "nimporte")) (Short $r.Raw)

$r = Req "Post" "/password/forgot" @{ email = $email }
Check "9j. mot de passe oublie : reponse 200" ($r.Status -eq 200) (Short $r.Raw)
$r = Req "Post" "/password/forgot" @{ email = "inconnu@exemple.com" }
Check "9k. e-mail inconnu : meme reponse 200" ($r.Status -eq 200) (Short $r.Raw)
Check "9l. l'e-mail contient le lien de reinitialisation" ([bool](Select-String -Path $logFile -Pattern "reinitialiser-mot-de-passe" -Quiet))

$out = php artisan tinker --execute="echo Illuminate\Support\Facades\Password::broker()->createToken(App\Models\User::where('email','$email')->first());" 2>$null
$resetToken = [regex]::Match(($out -join " "), '[a-f0-9]{64}').Value
$r = Req "Post" "/password/reset" @{ email = $email; token = "pasbon"; password = "Reinit12345" }
Check "9m. mauvais jeton refuse (422)" ($r.Status -eq 422) (Short $r.Raw)
$r = Req "Post" "/password/reset" @{ email = $email; token = $resetToken; password = "faible" }
Check "9n. mot de passe trop faible refuse (422)" ($r.Status -eq 422 -and $r.Json.errors.password) (Short $r.Raw)
$r = Req "Post" "/password/reset" @{ email = $email; token = $resetToken; password = "Reinit12345" }
Check "9o. reinitialisation avec le bon jeton" ($r.Status -eq 200) (Short $r.Raw)
$r = Req "Post" "/login" @{ email = $email; password = "Reinit12345" }
Check "9p. connexion avec le mot de passe reinitialise" ($r.Status -eq 200 -and $r.Json.token) (Short $r.Raw)
$tokDel = $r.Json.token
$uid = $r.Json.user.id
$r = Req "Post" "/password/reset" @{ email = $email; token = $resetToken; password = "Autre12345" }
Check "9q. jeton deja utilise refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

$r = Req "Post" "/requests" @{ service = "suivi-chantier"; city = "Cotonou"; details = @{ adresse = "Test suppression" } } $tokDel
Write-Host ("   demande creee avant suppression : " + $r.Json.data.tracking)
$r = Req "Delete" "/account" @{ password = "mauvais" } $tokDel
Check "9r. suppression avec un mauvais mot de passe refusee (422)" ($r.Status -eq 422) (Short $r.Raw)
$r = Req "Delete" "/account" @{ password = "Reinit12345" } $tokDel
Check "9s. suppression du compte" ($r.Status -eq 200) (Short $r.Raw)
$r = Req "Post" "/login" @{ email = $email; password = "Reinit12345" }
Check "9t. connexion impossible apres suppression" ($r.Status -eq 422) (Short $r.Raw)
$out = php artisan tinker --execute="echo App\Models\ServiceRequest::where('user_id',$uid)->count().'/'.App\Models\User::where('id',$uid)->count();" 2>$null
Check "9u. demandes et compte effaces de la base" ([regex]::Match(($out -join " "), '\d+/\d+').Value -eq "0/0") ("lu : " + ($out -join " "))


# ---------- Test 10 : messages, documents et notation ----------
Write-Host ""
Write-Host "== Test 10 : messages, documents et notation =="

$email2 = "test" + (Get-Random) + "@exemple.com"
$r = Req "Post" "/register" @{ first_name = "Bea"; last_name = "Messages"; email = $email2; phone = "+229 01 22 22 22 22"; country = "Benin"; password = "Motdepasse1" }
$v2 = Req "Post" "/email/verify" @{ email = $email2; code = (LastCode) }
$tokB = $v2.Json.token
Check "10-01 inscription et confirmation d'un second client" ($r.Status -eq 201 -and $v2.Status -eq 200 -and $tokB) (Short $v2.Raw)

$c = Req "Post" "/requests" @{ service = "suivi-chantier"; city = "Cotonou"; details = @{ adresse = "Test messages" } } $tokB
$rid = $c.Json.data.id
Check "10-02 creation d'une demande" ($c.Status -eq 201 -and $rid) (Short $c.Raw)

$r = Req "Get" "/messages" $null $tokB
$t = @($r.Json.data | Where-Object { $_.request_id -eq $rid })[0]
Check "10-03 liste des discussions : la demande est la, 0 non lu" ($r.Status -eq 200 -and $t -and $t.unread -eq 0 -and $r.Json.meta.unread_total -eq 0) (Short $r.Raw)

$r = Req "Post" "/requests/$rid/messages" @{} $tokB
Check "10-04 message vide refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

$r = Req "Post" "/requests/$rid/messages" @{ text = "Bonjour, une question sur ma demande" } $tokB
Check "10-05 message texte (201, de la part du client)" ($r.Status -eq 201 -and $r.Json.data.from -eq "client" -and $r.Json.data.text -eq "Bonjour, une question sur ma demande") (Short $r.Raw)

$http = & curl.exe -s -o $outFile -w "%{http_code}" -X POST "$base/requests/$rid/messages" -H "Accept: application/json" -H "Authorization: Bearer $tokB" -F "text=Voici la piece" -F "attachment=@$tmpPdf"
$raw = Get-Content $outFile -Raw
$m = $null
try { $m = $raw | ConvertFrom-Json } catch { }
Check "10-06 message avec PDF (201, piece jointe)" ("$http".Trim() -eq "201" -and $m.data.attachment.name -eq "ordonnance.pdf") (Short $raw)
$msgId = $m.data.id

$http = & curl.exe -s -o $outFile -w "%{http_code}" -X POST "$base/requests/$rid/messages" -H "Accept: application/json" -H "Authorization: Bearer $tokB" -F "text=Piege" -F "attachment=@$tmpExe"
Check "10-07 fichier .exe refuse (422)" ("$http".Trim() -eq "422") (Short (Get-Content $outFile -Raw))

$dl = Join-Path $env:TEMP "kwabo_msg.pdf"
$http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $tokB" "$base/messages/$msgId/attachment"
Check "10-08 telechargement de la piece jointe par son auteur (200, bon contenu)" ("$http".Trim() -eq "200" -and (Get-Content $dl -Raw) -match "test ordonnance")
$http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" "$base/messages/$msgId/attachment"
Check "10-09 telechargement sans jeton refuse (401)" ("$http".Trim() -eq "401")
$http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $token" "$base/messages/$msgId/attachment"
Check "10-10 telechargement par un autre client refuse (403)" ("$http".Trim() -eq "403")

$r = Req "Get" "/requests/$rid/messages" $null $tokB
$list = @($r.Json.data)
Check "10-11 lecture du fil : 2 messages dans l'ordre" ($r.Status -eq 200 -and $list.Count -eq 2 -and $list[0].from -eq "client" -and $list[1].attachment.name -eq "ordonnance.pdf") (Short $r.Raw)

$ra = Req "Post" "/admin/login" @{ email = "admin@kwabo.demo"; password = "Demo1234" }
$tokA = $ra.Json.token
$r = Req "Post" "/requests/$rid/messages" @{ text = "Bonjour, nous avons bien recu votre demande." } $tokA
Check "10-12 reponse de l'equipe (201, de la part de l'equipe)" ($r.Status -eq 201 -and $r.Json.data.from -eq "team" -and $r.Json.data.author) (Short $r.Raw)

$r = Req "Get" "/messages" $null $tokA
$t = @($r.Json.data | Where-Object { $_.request_id -eq $rid })[0]
Check "10-13 cote equipe : 2 messages non lus sur cette demande" ($r.Status -eq 200 -and $t.unread -eq 2) (Short $r.Raw)

$r = Req "Get" "/messages" $null $tokB
$t = @($r.Json.data | Where-Object { $_.request_id -eq $rid })[0]
$d = Req "Get" "/requests/$rid" $null $tokB
Check "10-14 cote client : 1 message non lu (liste et detail)" ($t.unread -eq 1 -and $r.Json.meta.unread_total -eq 1 -and $t.last_message.from -eq "team" -and $d.Json.data.unread_messages -eq 1) (Short $r.Raw)

$r = Req "Post" "/requests/$rid/messages/read" $null $tokB
Check "10-15 marquer comme lu (1 message)" ($r.Status -eq 200 -and $r.Json.updated -eq 1) (Short $r.Raw)
$r = Req "Get" "/messages" $null $tokB
Check "10-16 plus aucun message non lu" ($r.Json.meta.unread_total -eq 0) (Short $r.Raw)

$r1 = Req "Get" "/requests/$rid/messages" $null $token
$r2 = Req "Post" "/requests/$rid/messages" @{ text = "intrus" } $token
Check "10-17 un autre client ne peut ni lire ni ecrire (403)" ($r1.Status -eq 403 -and $r2.Status -eq 403)

$c2 = Req "Post" "/requests" @{ service = "suivi-chantier"; city = "Cotonou"; details = @{ adresse = "Test annulee" } } $tokB
$rid2 = $c2.Json.data.id
$null = Req "Post" "/requests/$rid2/cancel" $null $tokB
$r = Req "Post" "/requests/$rid2/messages" @{ text = "encore la ?" } $tokB
Check "10-18 demande annulee : discussion fermee (422)" ($r.Status -eq 422) (Short $r.Raw)

$r = Req "Get" "/documents" $null $tokB
Check "10-19 documents : le second client n'en a aucun" ($r.Status -eq 200 -and $r.Raw -match '"data"\s*:\s*\[\s*\]') (Short $r.Raw)
$r = Req "Get" "/documents" $null $token
$g = @($r.Json.data)
Check "10-20 documents : le client demo voit les siens, groupes par demande" ($r.Status -eq 200 -and $g.Count -ge 1 -and $g[0].request.title -and @($g[0].documents).Count -ge 1 -and $g[0].documents[0].url) (Short $r.Raw)

$r = Req "Put" "/requests/$rid/review" @{ rating = 5 } $tokB
Check "10-21 noter avant la fin de la mission refuse (422)" ($r.Status -eq 422) (Short $r.Raw)
Tinker "App\Models\ServiceRequest::where('id',$rid)->update(['status'=>'done']);"
$r = Req "Put" "/requests/$rid/review" @{ rating = 5 } $tokB
Check "10-22 note 5/5 sans commentaire : avis en attente de moderation" ($r.Status -eq 200 -and $r.Json.data.rating -eq 5 -and $r.Json.data.review.status -eq "pending") (Short $r.Raw)
$r = Req "Put" "/requests/$rid/review" @{ rating = 4; comment = "Tres bien" } $tokB
Check "10-23 note modifiee avec commentaire (4/5, en attente)" ($r.Status -eq 200 -and $r.Json.data.rating -eq 4 -and $r.Json.data.review.comment -eq "Tres bien" -and $r.Json.data.review.status -eq "pending") (Short $r.Raw)
$r = Req "Put" "/requests/$rid/review" @{ rating = 6 } $tokB
Check "10-24 note invalide refusee (422)" ($r.Status -eq 422) (Short $r.Raw)
$r = Req "Put" "/requests/$rid/review" @{ rating = 3 } $token
Check "10-25 un autre client ne peut pas noter (403)" ($r.Status -eq 403) (Short $r.Raw)
$r = Req "Put" "/requests/$rid/review" @{ rating = 3 } $tokA
Check "10-26 l'admin ne peut pas noter a la place du client (403)" ($r.Status -eq 403) (Short $r.Raw)

$r = Req "Delete" "/account" @{ password = "Motdepasse1" } $tokB
Check "10-27 suppression du second client" ($r.Status -eq 200) (Short $r.Raw)
$out = php artisan tinker --execute="echo App\Models\Message::where('service_request_id',$rid)->count().'/'.App\Models\Review::where('service_request_id',$rid)->count().'/'.App\Models\ServiceRequest::where('id',$rid)->count();" 2>$null
Check "10-28 messages, avis et demande effaces de la base" ([regex]::Match(($out -join " "), '\d+/\d+/\d+').Value -eq "0/0/0") ("lu : " + ($out -join " "))

# ---------- Test 11 : factures, paiement et moyens enregistres ----------
Write-Host ""
Write-Host "== Test 11 : paiements =="

$email3 = "test" + (Get-Random) + "@exemple.com"
$r = Req "Post" "/register" @{ first_name = "Cleo"; last_name = "Paiement"; email = $email3; phone = "+229 01 33 33 33 33"; country = "Benin"; password = "Motdepasse1" }
$uidC = $r.Json.user.id
$v3 = Req "Post" "/email/verify" @{ email = $email3; code = (LastCode) }
$tokC = $v3.Json.token
Check "11-01 inscription et confirmation d'un troisieme client" ($r.Status -eq 201 -and $v3.Status -eq 200 -and $tokC) (Short $v3.Raw)

$c = Req "Post" "/requests" @{ service = "suivi-chantier"; city = "Cotonou"; details = @{ adresse = "Test paiement" } } $tokC
$ridC = $c.Json.data.id
Check "11-02 creation d'une demande" ($c.Status -eq 201 -and $ridC) (Short $c.Raw)

$num = Get-Random
Tinker "App\Models\Invoice::create(['number'=>'F-TEST-$num-A','service_request_id'=>$ridC,'user_id'=>$uidC,'label'=>'Devis test','amount'=>150,'status'=>'due']);"
Tinker "App\Models\Invoice::create(['number'=>'F-TEST-$num-B','service_request_id'=>$ridC,'user_id'=>$uidC,'label'=>'Acompte test','amount'=>50,'status'=>'paid','method'=>'card','paid_at'=>now()]);"
Tinker "App\Models\PaymentMethod::create(['user_id'=>$uidC,'type'=>'card','label'=>'Visa se terminant par 4242','provider_token'=>'tok_test']);"

$r = Req "Get" "/invoices" $null $tokC
$list = @($r.Json.data)
$inv = @($list | Where-Object { $_.status -eq "due" })[0]
$invId = $inv.id
Check "11-03 liste des factures : 2 factures, 150 a payer, 50 paye" ($r.Status -eq 200 -and $list.Count -eq 2 -and $r.Json.meta.due_total -eq 150 -and $r.Json.meta.paid_total -eq 50 -and $r.Json.meta.count -eq 2 -and $inv.request.title) (Short $r.Raw)

$r = Req "Post" "/invoices/$invId/pay" @{ method = "card" } $token
Check "11-04 un autre client ne peut pas payer cette facture (404)" ($r.Status -eq 404) (Short $r.Raw)

$r = Req "Post" "/invoices/$invId/pay" @{ method = "cheque" } $tokC
Check "11-05 moyen de paiement inconnu refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

$r = Req "Post" "/invoices/$invId/pay" @{ method = "card"; simulate = "fail" } $tokC
$after = Req "Get" "/invoices" $null $tokC
Check "11-06 echec simule : 402 et facture toujours a payer" ($r.Status -eq 402 -and $after.Json.meta.due_total -eq 150) (Short $r.Raw)

$r = Req "Post" "/invoices/$invId/pay" @{ method = "momo" } $tokC
Check "11-07 paiement reussi (Mobile Money) : facture payee" ($r.Status -eq 200 -and $r.Json.data.status -eq "paid" -and $r.Json.data.method -eq "momo" -and $r.Json.data.paid_at) (Short $r.Raw)

$d = Req "Get" "/requests/$ridC" $null $tokC
$hist = ($d.Json.data.history | ForEach-Object { $_.text }) -join " | "
Check "11-08 la demande est passee en cours apres le paiement" ($d.Json.data.status -eq "active" -and $hist -match "Mission d") ("historique : " + $hist)

$r = Req "Post" "/invoices/$invId/pay" @{ method = "momo" } $tokC
Check "11-09 payer deux fois refuse (422)" ($r.Status -eq 422) (Short $r.Raw)

$out = php artisan tinker --execute="echo 'n='.App\Models\AppNotification::where('user_id',$uidC)->count();" 2>$null
Check "11-10 3 notifications (demande recue, paiement, mission demarree)" ([regex]::Match(($out -join " "), 'n=(\d+)').Groups[1].Value -eq "3") ("lu : " + ($out -join " "))

$r = Req "Get" "/payment-methods" $null $tokC
$pm = @($r.Json.data)
Check "11-11 moyens enregistres : la carte est la, sans jeton prestataire" ($r.Status -eq 200 -and $pm.Count -eq 1 -and $pm[0].type -eq "card" -and $pm[0].label -match "4242" -and $r.Raw -notmatch "provider_token" -and $r.Raw -notmatch "tok_test") (Short $r.Raw)
$pmId = $pm[0].id

$r = Req "Delete" "/payment-methods/$pmId" $null $token
Check "11-12 un autre client ne peut pas supprimer ce moyen (404)" ($r.Status -eq 404) (Short $r.Raw)

$r = Req "Delete" "/payment-methods/$pmId" $null $tokC
$r2 = Req "Get" "/payment-methods" $null $tokC
Check "11-13 suppression de son propre moyen enregistre" ($r.Status -eq 200 -and $r2.Raw -match '"data"\s*:\s*\[\s*\]') (Short $r2.Raw)

$r = Req "Delete" "/account" @{ password = "Motdepasse1" } $tokC
Check "11-14 suppression du client de test" ($r.Status -eq 200) (Short $r.Raw)
$out = php artisan tinker --execute="echo 'n='.App\Models\Invoice::where('user_id',$uidC)->count().'/'.App\Models\PaymentMethod::where('user_id',$uidC)->count().'/'.App\Models\AppNotification::where('user_id',$uidC)->count();" 2>$null
Check "11-15 factures, moyens et notifications effaces" ([regex]::Match(($out -join " "), 'n=(\d+/\d+/\d+)').Groups[1].Value -eq "0/0/0") ("lu : " + ($out -join " "))




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