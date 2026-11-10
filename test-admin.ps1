Set-Location $PSScriptRoot
$base = "http://127.0.0.1:8010/api"
$script:pass = 0
$script:fail = 0
function Short($s) { if ($s -and $s.Length -gt 300) { return $s.Substring(0, 300) }; return $s }
function Check($name, $ok, $detail = "") {
  if ($ok) { Write-Host ("[OK]   " + $name) -ForegroundColor Green; $script:pass++ }
  else { Write-Host ("[FAIL] " + $name) -ForegroundColor Red; if ($detail) { Write-Host ("       " + $detail) -ForegroundColor DarkGray }; $script:fail++ }
}
function Req($method, $path, $body = $null, $token = $null) {
  while ($true) {
    $headers = @{ Accept = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Method = $method; Uri = ($base + $path); Headers = $headers; UseBasicParsing = $true }
    if ($body -ne $null) { $params["ContentType"] = "application/json; charset=utf-8"; $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 6)) }
    $status = 0; $content = ""
    try { $resp = Invoke-WebRequest @params; $status = [int]$resp.StatusCode; $content = $resp.Content }
    catch {
      $r = $_.Exception.Response
      if ($r -eq $null) { throw }
      $status = [int]$r.StatusCode
      $content = $_.ErrorDetails.Message
      if (-not $content -and ($r | Get-Member -Name GetResponseStream -ErrorAction SilentlyContinue)) { $reader = New-Object System.IO.StreamReader($r.GetResponseStream()); $content = $reader.ReadToEnd() }
    }
    if ($status -eq 429) { Write-Host "   (limite atteinte, pause de 62 secondes...)" -ForegroundColor DarkYellow; Start-Sleep -Seconds 62; continue }
    $json = $null
    try { $json = $content | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ Status = $status; Json = $json; Raw = $content }
  }
}

Write-Host "== Pre-requis : php artisan db:seed --class=DemoDataSeeder =="

$ra = Req "Post" "/admin/login" @{ email = "admin@kwabo.demo"; password = "Demo1234" }
$tokA = $ra.Json.token
$ro = Req "Post" "/admin/login" @{ email = "agent@kwabo.demo"; password = "Demo1234" }
$tokO = $ro.Json.token
$rc = Req "Post" "/login" @{ email = "client@kwabo.demo"; password = "Demo1234" }
$tokC = $rc.Json.token
Check "connexions admin, agent et client" ($tokA -and $tokO -and $tokC) (Short $ra.Raw)

Write-Host ""; Write-Host "== Test 20 : droits =="
$r = Req "Get" "/admin/dashboard" $null $tokC
Check "20a. un client n'entre pas au back-office (403)" ($r.Status -eq 403)
$r = Req "Get" "/admin/clients" $null $tokO
Check "20b. un agent ne voit pas les clients (403)" ($r.Status -eq 403)
$r = Req "Get" "/admin/kpis" $null $tokO
Check "20c. un agent ne voit pas les indicateurs (403)" ($r.Status -eq 403)
$r = Req "Get" "/admin/requests"
Check "20d. sans jeton : 401" ($r.Status -eq 401)

Write-Host ""; Write-Host "== Test 21 : tableaux de bord =="
$r = Req "Get" "/admin/dashboard" $null $tokA
Check "21a. tableau de bord admin : chiffres, encaissements sur 6 mois, univers, charge des agents" ($r.Status -eq 200 -and $r.Json.data.stats.active_missions -ge 1 -and @($r.Json.data.revenue).Count -eq 6 -and @($r.Json.data.by_category).Count -eq 4 -and @($r.Json.data.operator_load).Count -ge 2 -and @($r.Json.data.work).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/admin/dashboard" $null $tokO
Check "21b. tableau de bord agent : 3 missions attribuees" ($r.Status -eq 200 -and $r.Json.data.role -eq "operator" -and $r.Json.data.stats.assigned -ge 1) (Short $r.Raw)
$r = Req "Get" "/admin/kpis" $null $tokA
Check "21c. indicateurs : 5 lignes avec objectifs" ($r.Status -eq 200 -and @($r.Json.data.indicators).Count -eq 5 -and $r.Json.data.indicators[0].target_m6 -eq 150) (Short $r.Raw)
$r = Req "Get" "/dashboard" $null $tokC
Check "21d. tableau de bord client : mission en cours, facture a payer, services populaires" ($r.Status -eq 200 -and $r.Json.data.active_mission -and @($r.Json.data.due_invoices).Count -ge 1 -and @($r.Json.data.popular_services).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/counters" $null $tokC
Check "21e. compteurs client" ($r.Status -eq 200 -and $r.Json.data.due_invoices -ge 1 -and $r.Json.data.unread_messages -ge 1) (Short $r.Raw)

Write-Host ""; Write-Host "== Test 22 : demandes (admin et agent) =="
$r = Req "Get" "/admin/requests?per_page=100" $null $tokA
Check "22a. admin : 15 demandes de demonstration au moins" ($r.Status -eq 200 -and $r.Json.meta.total -ge 15 -and $r.Json.data[0].customer.full_name) (Short $r.Raw)
$r = Req "Get" "/admin/requests?status=pending" $null $tokA
Check "22b. filtre statut" ($r.Status -eq 200 -and @($r.Json.data | Where-Object { $_.status -ne "pending" }).Count -eq 0)
$r = Req "Get" "/admin/requests?operator=none" $null $tokA
Check "22c. filtre : sans agent" ($r.Status -eq 200 -and @($r.Json.data | Where-Object { $_.operator -ne $null }).Count -eq 0 -and @($r.Json.data).Count -ge 1)
$r = Req "Get" "/admin/requests?category=immobilier" $null $tokA
Check "22d. filtre univers" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1 -and @($r.Json.data | Where-Object { $_.service.category.slug -ne "immobilier" }).Count -eq 0)
$r = Req "Get" "/admin/requests?urgency=urgent" $null $tokA
Check "22e. filtre urgence" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1 -and @($r.Json.data | Where-Object { $_.urgency -ne "urgent" }).Count -eq 0)
$r = Req "Get" "/admin/requests?q=Sossa" $null $tokA
Check "22f. recherche par nom du client" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 3)
$r = Req "Get" "/admin/requests" $null $tokO
$mine = @($r.Json.data)
Check "22g. l'agent ne voit que ses demandes" ($r.Status -eq 200 -and $mine.Count -ge 1 -and @($mine | Where-Object { $_.operator.full_name -ne "Maxime Dossou" }).Count -eq 0) (Short $r.Raw)
$r = Req "Get" "/admin/requests/1" $null $tokA
Check "22h. detail : historique, documents, factures, notes, avis" ($r.Status -eq 200 -and @($r.Json.data.history).Count -ge 3 -and @($r.Json.data.documents).Count -eq 6 -and @($r.Json.data.invoices).Count -ge 1) (Short $r.Raw)
$r = Req "Get" "/admin/requests/5" $null $tokO
Check "22i. l'agent ne voit pas la demande d'un autre agent (403)" ($r.Status -eq 403)

$team = (Req "Get" "/admin/team" $null $tokA).Json.data
$maximeId = @($team | Where-Object { $_.email -eq "agent@kwabo.demo" })[0].id
$adminId = @($team | Where-Object { $_.email -eq "admin@kwabo.demo" })[0].id
Write-Host ""; Write-Host "== Test 23 : devis, attribution, statut, notes =="
$r = Req "Post" "/admin/requests/13/quote" @{ amount = 0 } $tokA
Check "23a. devis a 0 refuse (422)" ($r.Status -eq 422)
$r = Req "Post" "/admin/requests/13/quote" @{ amount = 300; label = "Recherche de terrain" } $tokA
Check "23b. devis envoye : demande avec devis de 300" ($r.Status -eq 201 -and $r.Json.data.quote.amount -eq 300 -and @($r.Json.data.invoices | Where-Object { $_.status -eq "due" }).Count -eq 1) (Short $r.Raw)
$r = Req "Post" "/admin/requests/13/quote" @{ amount = 320 } $tokA
$due = @($r.Json.data.invoices | Where-Object { $_.status -eq "due" })
Check "23c. un second devis remplace le premier (1 seule facture a payer)" ($due.Count -eq 1 -and $due[0].amount -eq 320 -and $due[0].number -match '^F-\d{4}-\d{4}$') (Short $r.Raw)
$r = Req "Post" "/admin/requests/13/quote" @{ amount = 100 } $tokO
Check "23d. un agent ne peut pas envoyer de devis (403)" ($r.Status -eq 403)
$r = Req "Patch" "/admin/requests/13/assign" @{ operator_id = 99999 } $tokA
Check "23e. attribuer a un inconnu refuse (422)" ($r.Status -eq 422)
$r = Req "Patch" "/admin/requests/13/assign" @{ operator_id = $maximeId } $tokA
Check "23f. attribution a un agent" ($r.Status -eq 200 -and $r.Json.data.operator.id -eq $maximeId) (Short $r.Raw)
$r = Req "Patch" "/admin/requests/13/status" @{ status = "nimporte" } $tokA
Check "23g. statut invalide refuse (422)" ($r.Status -eq 422)
$r = Req "Patch" "/admin/requests/13/status" @{ status = "active" } $tokO
Check "23h. l'agent attribue change le statut" ($r.Status -eq 200 -and $r.Json.data.status -eq "active") (Short $r.Raw)
$r = Req "Patch" "/admin/requests/5/status" @{ status = "done" } $tokO
Check "23i. l'agent ne change pas le statut d'une demande d'un autre (403)" ($r.Status -eq 403)
$r = Req "Post" "/admin/requests/13/notes" @{ text = "Appeler le client demain" } $tokO
Check "23j. note interne" ($r.Status -eq 201 -and $r.Json.data.text -eq "Appeler le client demain") (Short $r.Raw)
$r = Req "Post" "/admin/requests/13/notes" @{ text = "" } $tokO
Check "23k. note vide refusee (422)" ($r.Status -eq 422)

$tmpPdf = Join-Path $env:TEMP "rapport-test.pdf"
Set-Content -Path $tmpPdf -Value ("%PDF-1.4`n% rapport test`n%%EOF") -Encoding Ascii
$tmpExe = Join-Path $env:TEMP "virus-test.exe"
Set-Content -Path $tmpExe -Value "MZ faux" -Encoding Ascii
$out = Join-Path $env:TEMP "kwabo_admin.json"
$http = & curl.exe -s -o $out -w "%{http_code}" -X POST "$base/admin/requests/13/documents" -H "Accept: application/json" -H "Authorization: Bearer $tokO" -F "type=report" -F "file=@$tmpPdf"
$raw = Get-Content $out -Raw
$doc = $null; try { $doc = $raw | ConvertFrom-Json } catch { }
Check "23l. l'agent depose un rapport (201)" ("$http".Trim() -eq "201" -and $doc.data.type -eq "report") (Short $raw)
$http = & curl.exe -s -o $out -w "%{http_code}" -X POST "$base/admin/requests/13/documents" -H "Accept: application/json" -H "Authorization: Bearer $tokO" -F "type=report" -F "file=@$tmpExe"
Check "23m. fichier .exe refuse (422)" ("$http".Trim() -eq "422")
$http = & curl.exe -s -o $out -w "%{http_code}" -X POST "$base/admin/requests/5/documents" -H "Accept: application/json" -H "Authorization: Bearer $tokO" -F "type=report" -F "file=@$tmpPdf"
Check "23n. l'agent ne depose pas sur la demande d'un autre (403)" ("$http".Trim() -eq "403")
$dl = Join-Path $env:TEMP "kwabo_rapport.pdf"
$http = & curl.exe -s -o $dl -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $tokA" "$base/documents/$($doc.data.id)/download"
Check "23o. l'admin telecharge le rapport (200, bon contenu)" ("$http".Trim() -eq "200" -and (Get-Content $dl -Raw) -match "rapport test")

Write-Host ""; Write-Host "== Test 24 : factures =="
$r = Req "Get" "/admin/invoices?per_page=100" $null $tokA
Check "24a. liste des factures avec totaux" ($r.Status -eq 200 -and $r.Json.meta.total -ge 16 -and $r.Json.meta.paid_total -gt 0 -and $r.Json.meta.due_total -gt 0) (Short $r.Raw)
$r = Req "Get" "/admin/invoices?status=paid&q=Edwige" $null $tokA
Check "24b. filtre statut + recherche par client" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 3 -and @($r.Json.data | Where-Object { $_.status -ne "paid" }).Count -eq 0)
$allInv = (Req "Get" "/admin/invoices?per_page=100" $null $tokA).Json.data
$dueId = @($allInv | Where-Object { $_.number -eq "F-2026-0058" })[0].id
$paidId = @($allInv | Where-Object { $_.number -eq "F-2026-0011" })[0].id
$r = Req "Post" "/admin/invoices/$dueId/refund" $null $tokA
Check "24c. rembourser une facture a payer refuse (422)" ($r.Status -eq 422)
$r = Req "Post" "/admin/invoices/$paidId/refund" $null $tokA
Check "24d. remboursement d'une facture payee" ($r.Status -eq 200 -and $r.Json.data.status -eq "refunded") (Short $r.Raw)

Write-Host ""; Write-Host "== Test 25 : clients =="
$r = Req "Get" "/admin/clients" $null $tokA
Check "25a. liste des clients avec nombre de demandes et total paye" ($r.Status -eq 200 -and $r.Json.meta.total -ge 9 -and $r.Json.data[0].requests_count -ne $null) (Short $r.Raw)
$r = Req "Get" "/admin/clients?state=unverified" $null $tokA
Check "25b. filtre : e-mail a confirmer (Jules)" ($r.Status -eq 200 -and @($r.Json.data | Where-Object { $_.email -eq "jules@exemple.com" }).Count -eq 1)
$aicha = (Req "Get" "/admin/clients?q=client@kwabo.demo" $null $tokA).Json.data[0].id
$r = Req "Get" "/admin/clients/$aicha" $null $tokA
Check "25c. fiche client : statistiques, demandes, factures" ($r.Status -eq 200 -and $r.Json.data.stats.requests -eq 3 -and @($r.Json.data.invoices).Count -ge 3) (Short $r.Raw)
$r = Req "Get" "/admin/clients/$adminId" $null $tokA
Check "25d. un agent n'est pas un client (404)" ($r.Status -eq 404)
$ru = Req "Post" "/register" @{ first_name = "Susp"; last_name = "Test"; email = ("susp" + (Get-Random) + "@exemple.com"); phone = "+229 01 44 44 44 44"; country = "Benin"; password = "Motdepasse1" }
$suspId = $ru.Json.user.id
$r = Req "Post" "/admin/clients/$suspId/suspend" @{ suspended = $true } $tokA
Check "25e. suspension d'un compte" ($r.Status -eq 200 -and $r.Json.data.state -eq "suspended") (Short $r.Raw)
$r = Req "Post" "/admin/clients/$suspId/suspend" @{ suspended = $false } $tokA
Check "25f. reactivation" ($r.Status -eq 200 -and $r.Json.data.state -ne "suspended")
$r = Req "Post" "/admin/clients/$suspId/reset-link" $null $tokA
Check "25g. lien de mot de passe envoye" ($r.Status -eq 200)
$r = Req "Delete" "/admin/clients/$suspId" $null $tokA
Check "25h. effacement du compte de test" ($r.Status -eq 200)
$r = Req "Get" "/admin/referrals" $null $tokA
Check "25i. parrainage : 2 parrains, 4 filleuls" ($r.Status -eq 200 -and $r.Json.data.stats.sponsors -ge 2 -and $r.Json.data.stats.referrals -ge 4) (Short $r.Raw)

Write-Host ""; Write-Host "== Test 26 : avis, catalogue, equipe, journal, recherche =="
$r = Req "Get" "/admin/reviews" $null $tokA
$pend = @($r.Json.data)
Check "26a. avis en attente (2) avec compteurs" ($r.Status -eq 200 -and $pend.Count -ge 2 -and $r.Json.meta.counts.published -ge 2) (Short $r.Raw)
$r = Req "Patch" "/admin/reviews/$($pend[0].id)" @{ status = "published" } $tokA
Check "26b. publier un avis" ($r.Status -eq 200 -and $r.Json.data.status -eq "published")
$r = Req "Patch" "/admin/reviews/$($pend[0].id)" @{ status = "nimporte" } $tokA
Check "26c. statut d'avis invalide refuse (422)" ($r.Status -eq 422)
$r = Req "Get" "/admin/services" $null $tokA
Check "26d. catalogue complet (4 univers)" ($r.Status -eq 200 -and @($r.Json.data).Count -eq 4)
$sid = $r.Json.data[0].services[0].id
$r = Req "Patch" "/admin/services/$sid" @{ available = $false } $tokA
Check "26e. service rendu indisponible" ($r.Status -eq 200 -and $r.Json.data.available -eq $false)
$cat = Req "Get" "/catalog"
$allSlugs = @($cat.Json.data | ForEach-Object { $_.services } | ForEach-Object { $_.id })
Check "26f. il disparait du catalogue public" ($allSlugs -notcontains $sid)
$r = Req "Patch" "/admin/services/$sid" @{ available = $true; price_label = "120-200 EUR/mois" } $tokA
Check "26g. remis disponible, prix modifie" ($r.Status -eq 200 -and $r.Json.data.available -eq $true -and $r.Json.data.price_label -eq "120-200 EUR/mois")
$r = Req "Get" "/admin/team" $null $tokA
Check "26h. equipe : admin et 2 agents avec leur charge" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 3)
$opMail = "agent" + (Get-Random) + "@kwabo.demo"
$r = Req "Post" "/admin/operators" @{ first_name = "Nouvel"; last_name = "Agent"; email = $opMail; phone = "+229 01 55 55 55 55" } $tokA
Check "26i. ajout d'un agent (201)" ($r.Status -eq 201 -and $r.Json.data.role -eq "operator") (Short $r.Raw)
$r = Req "Post" "/admin/operators" @{ first_name = "Nouvel"; last_name = "Agent"; email = $opMail; phone = "+229 01 55 55 55 55" } $tokA
Check "26j. e-mail deja utilise refuse (422)" ($r.Status -eq 422)
$r = Req "Get" "/admin/audit?q=Devis" $null $tokA
Check "26k. journal d'audit filtre (le devis y figure)" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 1)
$r = Req "Get" "/admin/search?q=Sossa" $null $tokA
Check "26l. recherche globale : demandes et clients" ($r.Status -eq 200 -and @($r.Json.data.clients).Count -ge 1)

Write-Host ""; Write-Host "== Test 27 : notifications et parrainage (client) =="
$r = Req "Get" "/notifications" $null $tokC
Check "27a. notifications du client avec compteur de non lues" ($r.Status -eq 200 -and @($r.Json.data).Count -ge 3 -and $r.Json.meta.unread_total -ge 2) (Short $r.Raw)
$nid = @($r.Json.data | Where-Object { $_.read -eq $false })[0].id
$r = Req "Post" "/notifications/$nid/read" $null $tokC
Check "27b. marquer une notification comme lue" ($r.Status -eq 200 -and $r.Json.data.read -eq $true)
$r = Req "Post" "/notifications/$nid/read" $null $tokO
Check "27c. un autre compte ne peut pas la lire (404)" ($r.Status -eq 404)
$r = Req "Get" "/notifications" $null $tokA
Check "27d. l'admin voit aussi les notifications de l'equipe" ($r.Status -eq 200 -and @($r.Json.data | Where-Object { $_.text -match "Nouvelle demande" }).Count -ge 1)
$r = Req "Post" "/notifications/read-all" $null $tokC
$r2 = Req "Get" "/notifications" $null $tokC
Check "27e. tout marquer comme lu" ($r.Status -eq 200 -and $r2.Json.meta.unread_total -eq 0)
$r = Req "Get" "/referrals" $null $tokC
Check "27f. parrainage du client : code, 2 filleuls dont 1 actif" ($r.Status -eq 200 -and $r.Json.data.code -match '^KW-' -and $r.Json.data.stats.referrals -eq 2 -and $r.Json.data.stats.active -eq 1 -and $r.Json.data.stats.rewards -eq 10) (Short $r.Raw)
$r = Req "Get" "/referrals" $null $tokA
Check "27g. l'admin n'a pas de page parrainage client (403)" ($r.Status -eq 403)

Write-Host ""
Write-Host ("RESULTAT : " + $script:pass + " OK, " + $script:fail + " FAIL")
if ($script:fail -gt 0) { exit 1 }
