<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Données de démonstration de la maquette : 15 demandes, factures, messages, avis, documents, notifications.
// ATTENTION : efface d'abord les demandes, factures, messages, avis, notifications et journal existants.
class DemoDataSeeder extends Seeder
{
    private function ago(float $days): string
    {
        return now()->subSeconds((int) ($days * 86400))->toDateTimeString();
    }

    private function user(string $email, string $role, string $first, string $last, string $country, string $phone, int $days, bool $verified = true): int
    {
        $u = User::where('email', $email)->first() ?? new User();
        $u->fill(['first_name' => $first, 'last_name' => $last, 'email' => $email, 'phone' => $phone, 'country' => $country]);
        if (! $u->exists) {
            $u->password = 'Demo1234';
            $u->notification_prefs = array_fill_keys(['received', 'quote', 'started', 'report', 'done', 'payment'], true);
        }
        $u->role = $role;
        $u->email_verified_at = $verified ? now() : null;
        if (! $u->referral_code) {
            $u->referral_code = 'KW-'.strtoupper(substr(preg_replace('/[^A-Za-z]/', '', \Illuminate\Support\Str::ascii($first)), 0, 4)).str_pad((string) random_int(0, 99), 2, '0', STR_PAD_LEFT);
        }
        if (! $u->exists) {
            $u->created_at = $this->ago($days);
        }
        $u->save();

        return $u->id;
    }

    public function run(): void
    {
        $U = [
            'u01' => $this->user('client@kwabo.demo', 'user', 'Aïcha', 'Sossa', 'France', '+33 6 12 34 56 78', 90),
            'u02' => $this->user('romuald@exemple.com', 'user', 'Romuald', 'Agbo', 'Belgique', '+32 470 12 34 56', 40),
            'u03' => $this->user('clarisse@exemple.com', 'user', 'Clarisse', 'Houngbo', 'Canada', '+1 514 555 0147', 12),
            'u04' => $this->user('edwige@exemple.com', 'user', 'Edwige', 'Tossou', 'France', '+33 7 22 33 44 55', 170),
            'u05' => $this->user('fabrice@exemple.com', 'user', 'Fabrice', 'Akpovi', 'États-Unis', '+1 202 555 0183', 150),
            'u06' => $this->user('gisele@exemple.com', 'user', 'Gisèle', 'Ahouansou', 'Allemagne', '+49 170 555 0192', 120),
            'u07' => $this->user('herve@exemple.com', 'user', 'Hervé', 'Gbaguidi', 'Suisse', '+41 79 555 01 74', 75),
            'u08' => $this->user('ines@exemple.com', 'user', 'Inès', 'Dossa', 'Gabon', '+241 06 55 01 23', 25),
            'u09' => $this->user('jules@exemple.com', 'user', 'Jules', 'Zinsou', 'Canada', '+1 438 555 0166', 2, false),
            'u10' => $this->user('admin@kwabo.demo', 'admin', 'Équipe', 'KWABO', 'Bénin', '+229 01 00 00 00 00', 90),
            'u11' => $this->user('agent@kwabo.demo', 'operator', 'Maxime', 'Dossou', 'Bénin', '+229 01 00 00 00 01', 90),
            'u12' => $this->user('senan@kwabo.demo', 'operator', 'Sènan', 'Kpadé', 'Bénin', '+229 01 00 00 00 02', 90),
        ];

        // Parrainage : Aïcha a parrainé Romuald et Clarisse ; Edwige a parrainé Gisèle et Hervé.
        foreach ([['u02', 'u01'], ['u03', 'u01'], ['u06', 'u04'], ['u07', 'u04']] as [$child, $sponsor]) {
            User::where('id', $U[$child])->update(['referred_by' => $U[$sponsor]]);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach (['reviews', 'invoices', 'messages', 'documents', 'request_notes', 'request_histories', 'service_requests', 'app_notifications', 'audit_logs', 'payment_methods'] as $t) {
            DB::table($t)->delete();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $svc = fn (string $slug) => DB::table('services')->where('slug', $slug)->value('id') ?? throw new \RuntimeException("Service introuvable : {$slug}. Lance d'abord ServiceSeeder.");
        $json = fn ($v) => json_encode($v, JSON_UNESCAPED_UNICODE);

        // [id, user, service, status, title, city, age(j), extra]
        $requests = [
            [1, 'u01', 'suivi-chantier', 'active', 'Suivi de ma villa à Abomey-Calavi', 'Abomey-Calavi', 30, [
                'budget' => '160 €/mois', 'description' => "Construction d'une villa en cours. Je veux une visite chaque semaine et un contrôle des matériaux livrés.",
                'details' => ['adresse' => 'Quartier Tankpè, von face école', 'macon' => 'M. Zannou, +229 01 00 00 00 10', 'stade' => 'Élévation des murs', 'visite' => 'Le vendredi matin'],
                'op' => 'u11', 'quote' => [160, 'Suivi de chantier, 1 mois'],
                'history' => [[30, 'Demande reçue'], [29, 'Devis envoyé : 160 €'], [28, 'Mission démarrée après paiement'], [3, 'Rapport hebdomadaire disponible']]]],
            [2, 'u01', 'sante', 'pending', 'Médicaments de ma mère', 'Cotonou', 1, [
                'urgency' => 'urgent', 'budget' => '50 €/mois', 'description' => 'Ma mère a besoin de son traitement chaque mois, livré à domicile.',
                'details' => ['patient' => 'Mme Sossa', 'etablissement' => 'CNHU de Cotonou'], 'quote' => [45, 'Santé de vos proches, 1 mois'],
                'history' => [[1, 'Demande reçue'], [0.2, 'Devis envoyé : 45 €']]]],
            [3, 'u01', 'administratif', 'done', 'Acte de naissance de mon fils', 'Porto-Novo', 70, [
                'budget' => '60 €', 'description' => "Obtenir une copie intégrale de l'acte de naissance.", 'details' => ['document' => 'Acte de naissance', 'pourQui' => 'Mon fils'],
                'op' => 'u12', 'quote' => [55, 'Assistance administrative'],
                'history' => [[70, 'Demande reçue'], [69, 'Devis envoyé : 55 €'], [68, 'Mission démarrée après paiement'], [60, 'Mission terminée']]]],
            [4, 'u02', 'fret', 'pending', 'Colis de Bruxelles vers Cotonou', 'Cotonou', 0.2, [
                'description' => 'Deux cartons de vêtements et du petit électroménager.', 'details' => ['villeEnvoi' => 'Bruxelles', 'poids' => '45', 'mode' => 'Maritime']]],
            [5, 'u03', 'faire-venir', 'active', 'Visa études pour ma nièce', 'Parakou', 12, [
                'budget' => '300 €', 'description' => 'Dossier de visa études vers le Canada.', 'details' => ['parente' => 'Nièce', 'visa' => 'Études', 'destination' => 'Canada'],
                'op' => 'u12', 'quote' => [250, 'Faire venir un proche'],
                'history' => [[12, 'Demande reçue'], [11, 'Devis envoyé : 250 €'], [10, 'Mission démarrée après paiement']]]],
        ];
        // Demandes « de remplissage » : [id, user, service, status, title, city, age, operator, amount, rating]
        foreach ([
            [6, 'u04', 'foncier', 'done', 'Vérification du titre à Ouidah', 'Ouidah', 160, 'u12', 500, 4],
            [7, 'u05', 'transfert', 'done', 'Transfert pour les travaux de mes parents', 'Cotonou', 130, 'u11', 90, 5],
            [8, 'u06', 'evenements', 'done', 'Funérailles de ma tante', 'Abomey', 100, 'u11', 650, 5],
            [9, 'u04', 'suivi-chantier', 'active', 'Suivi de la maison de Fidjrossè', 'Cotonou', 95, 'u11', 180, null],
            [10, 'u07', 'comptabilite', 'active', 'Création de ma société à Cotonou', 'Cotonou', 60, 'u12', 320, null],
            [11, 'u06', 'soutien-famille', 'active', 'Factures et visites à mes parents', 'Bohicon', 45, 'u11', 45, null],
            [12, 'u05', 'cadeaux', 'done', 'Sodabi et wax pour un mariage', 'Cotonou', 35, 'u12', 120, 2],
            [13, 'u08', 'investissement', 'pending', "Recherche d'un terrain à Calavi", 'Abomey-Calavi', 3, null, null, null],
            [14, 'u07', 'fret', 'pending', 'Colis de Genève vers Cotonou', 'Cotonou', 1.5, null, null, null],
            [15, 'u08', 'administratif', 'cancelled', 'Casier judiciaire', 'Porto-Novo', 20, null, null, null],
        ] as [$id, $u, $s, $st, $title, $city, $age, $op, $amount, $rating]) {
            $requests[] = [$id, $u, $s, $st, $title, $city, $age, [
                'urgency' => $id === 14 ? 'urgent' : 'normal', 'description' => 'Demande de démonstration.', 'op' => $op,
                'rating' => $rating, 'quote' => $amount ? [$amount, DB::table('services')->where('slug', $s)->value('name')] : null,
            ]];
        }

        foreach ($requests as [$id, $u, $s, $st, $title, $city, $age, $x]) {
            DB::table('service_requests')->insert([
                'id' => $id, 'tracking' => sprintf('KW-2026-%04d', $id), 'user_id' => $U[$u], 'service_id' => $svc($s),
                'operator_id' => isset($x['op']) ? $U[$x['op']] : null, 'status' => $st, 'title' => $title, 'city' => $city,
                'urgency' => $x['urgency'] ?? 'normal', 'budget' => $x['budget'] ?? null, 'description' => $x['description'] ?? null,
                'details' => $json($x['details'] ?? []), 'quote_amount' => $x['quote'][0] ?? null, 'quote_label' => $x['quote'][1] ?? null,
                'rating' => $x['rating'] ?? null, 'created_at' => $this->ago($age), 'updated_at' => $this->ago($age),
            ]);
            foreach (($x['history'] ?? [[$age, 'Demande reçue']]) as [$d, $text]) {
                DB::table('request_histories')->insert(['service_request_id' => $id, 'text' => $text, 'created_at' => $this->ago($d), 'updated_at' => $this->ago($d)]);
            }
        }

        // Documents (avec un petit fichier d'exemple pour que le téléchargement fonctionne).
        $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
        foreach ([
            [1, 1, 'contract', 'Contrat de mission signé.pdf', 28], [2, 1, 'report', 'Rapport semaine 3.pdf', 10],
            [3, 1, 'report', 'Rapport semaine 4.pdf', 3], [4, 1, 'video', 'Vidéo 360° du chantier.mp4', 3],
            [5, 1, 'photo', 'Livraison de ciment.jpg', 4], [6, 1, 'receipt', 'Reçu ciment et fer.pdf', 4],
            [7, 3, 'contract', 'Contrat de mission signé.pdf', 68], [8, 3, 'receipt', 'Reçu mairie de Porto-Novo.pdf', 62],
            [9, 5, 'contract', 'Contrat de mission signé.pdf', 10],
        ] as [$id, $rid, $type, $name, $age]) {
            $path = "demo/document-{$id}-".preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
            Storage::put($path, str_ends_with($name, '.pdf') ? $pdf : "Fichier de démonstration : {$name}");
            DB::table('documents')->insert([
                'id' => $id, 'service_request_id' => $rid, 'uploaded_by' => $U[$rid === 3 ? 'u12' : ($rid === 5 ? 'u12' : 'u11')],
                'type' => $type, 'name' => $name, 'path' => $path, 'created_at' => $this->ago($age), 'updated_at' => $this->ago($age),
            ]);
        }

        // Messages : [request, sender, author, text, hours ago, lu]
        foreach ([
            [1, 'team', 'u11', 'Bonjour Aïcha, le rapport de la semaine est disponible dans vos documents.', 72, true],
            [1, 'client', 'u01', 'Merci. Le ciment livré correspond bien à ce qui était prévu ?', 50, true],
            [1, 'team', 'u11', 'Oui, nous avons vérifié la livraison. Le reçu et la photo sont dans vos documents.', 48, false],
            [2, 'team', 'u10', 'Votre devis est prêt. Dès le paiement reçu, nous organisons la première livraison.', 5, false],
            [4, 'client', 'u02', 'Quelle est la date du prochain groupage maritime ?', 4, false],
        ] as [$rid, $sender, $author, $text, $hours, $read]) {
            $at = now()->subHours($hours)->toDateTimeString();
            DB::table('messages')->insert([
                'service_request_id' => $rid, 'sender' => $sender, 'author_id' => $U[$author], 'text' => $text,
                'read_at' => $read ? $at : null, 'created_at' => $at, 'updated_at' => $at,
            ]);
        }

        // Factures : [numéro, demande, user, objet, montant, statut, moyen, âge création, âge paiement]
        foreach ([
            ['F-2026-0041', 3, 'u01', 'Assistance administrative', 55, 'paid', 'card', 69, 68],
            ['F-2026-0042', 1, 'u01', 'Suivi de chantier, 1 mois', 160, 'paid', 'wise', 29, 28],
            ['F-2026-0051', 5, 'u03', 'Faire venir un proche', 250, 'paid', 'momo', 11, 10],
            ['F-2026-0058', 2, 'u01', 'Santé de vos proches, 1 mois', 45, 'due', null, 0.2, null],
            ['F-2026-0011', 6, 'u04', 'Accompagnement foncier', 500, 'paid', 'wise', 159, 158],
            ['F-2026-0017', 7, 'u05', "Transfert d'argent optimisé", 90, 'paid', 'card', 129, 128],
            ['F-2026-0021', 9, 'u04', 'Suivi de chantier, 1 mois', 180, 'paid', 'card', 93, 92],
            ['F-2026-0023', 8, 'u06', 'Événements à distance', 650, 'paid', 'card', 99, 98],
            ['F-2026-0031', 9, 'u04', 'Suivi de chantier, 1 mois', 180, 'paid', 'card', 63, 62],
            ['F-2026-0033', 10, 'u07', 'Comptabilité & Entreprise', 320, 'paid', 'momo', 59, 58],
            ['F-2026-0037', 11, 'u06', 'Soutien famille, 1 mois', 45, 'paid', 'momo', 45, 44],
            ['F-2026-0039', 12, 'u05', 'Cadeaux & produits locaux', 120, 'paid', 'card', 34, 33],
            ['F-2026-0045', 9, 'u04', 'Suivi de chantier, 1 mois', 180, 'paid', 'card', 31, 30],
            ['F-2026-0049', 11, 'u06', 'Soutien famille, 1 mois', 45, 'paid', 'momo', 15, 14],
            ['F-2026-0055', 9, 'u04', 'Suivi de chantier, 1 mois', 180, 'paid', 'card', 3, 2],
            ['F-2026-0056', 10, 'u07', 'Comptabilité & Entreprise', 80, 'paid', 'wise', 2, 1],
        ] as [$number, $rid, $u, $label, $amount, $status, $method, $created, $paid]) {
            DB::table('invoices')->insert([
                'number' => $number, 'service_request_id' => $rid, 'user_id' => $U[$u], 'label' => $label, 'amount' => $amount,
                'status' => $status, 'method' => $method, 'paid_at' => $paid !== null ? $this->ago($paid) : null,
                'created_at' => $this->ago($created), 'updated_at' => $this->ago($created),
            ]);
        }

        // Avis : [demande, user, note, commentaire, statut, âge]
        foreach ([
            [6, 'u04', 4, 'Titre vérifié rapidement, le rapport était très clair.', 'published', 120],
            [7, 'u05', 5, 'Argent arrivé en moins de 24 h, sans surprise.', 'published', 125],
            [8, 'u06', 5, "Grâce à la diffusion en direct, j'ai pu suivre toute la cérémonie.", 'pending', 6],
            [12, 'u05', 2, 'Colis arrivé avec une semaine de retard, et personne pour me prévenir.', 'pending', 4],
        ] as [$rid, $u, $rating, $comment, $status, $age]) {
            DB::table('reviews')->insert(['service_request_id' => $rid, 'user_id' => $U[$u], 'rating' => $rating, 'comment' => $comment,
                'status' => $status, 'created_at' => $this->ago($age), 'updated_at' => $this->ago($age)]);
        }

        // Notifications : [user ou null = équipe, texte, lien, âge (h), lu]
        foreach ([
            ['u01', 'Devis reçu pour « Médicaments de ma mère » : 45 €', '/requests/2', 5, false],
            ['u01', 'Rapport hebdomadaire disponible pour « Suivi de ma villa à Abomey-Calavi »', '/requests/1', 72, false],
            ['u01', 'Mission terminée : « Acte de naissance de mon fils »', '/requests/3', 1440, true],
            [null, 'Nouvelle demande urgente : « Colis de Genève vers Cotonou »', '/admin/requests/14', 36, false],
            [null, "Nouvelle demande : « Recherche d'un terrain à Calavi »", '/admin/requests/13', 72, false],
            [null, 'Message de Romuald Agbo sur « Colis de Bruxelles vers Cotonou »', '/admin/requests/4', 4, false],
            ['u11', 'Rapport attendu cette semaine : « Suivi de ma villa à Abomey-Calavi »', '/admin/requests/1', 20, false],
        ] as [$u, $text, $link, $hours, $read]) {
            $at = now()->subHours($hours)->toDateTimeString();
            DB::table('app_notifications')->insert(['user_id' => $u ? $U[$u] : null, 'text' => $text, 'link' => $link,
                'read_at' => $read ? $at : null, 'created_at' => $at, 'updated_at' => $at]);
        }

        DB::table('payment_methods')->insert(['user_id' => $U['u01'], 'type' => 'card', 'label' => 'Visa se terminant par 4242', 'provider_token' => null, 'created_at' => now(), 'updated_at' => now()]);

        foreach ([[4, 'Avis reçu sur « Sodabi et wax pour un mariage »'], [10, 'Mission démarrée : « Visa études pour ma nièce »'], [12, 'Attribution de « Visa études pour ma nièce » à Sènan Kpadé']] as [$d, $text]) {
            DB::table('audit_logs')->insert(['actor_id' => $U['u10'], 'text' => $text, 'created_at' => $this->ago($d), 'updated_at' => $this->ago($d)]);
        }

        $this->command?->info('Données de démonstration créées : 15 demandes, 16 factures, 5 messages, 4 avis.');
    }
}
