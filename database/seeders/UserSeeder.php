<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Comptes de démonstration : jamais en production.
        if (app()->environment('production')) {
            return;
        }

        $prefs = array_fill_keys(['received', 'quote', 'started', 'report', 'done', 'payment'], true);

        // [id, rôle, prénom, nom, e-mail, pays, téléphone, parrain (e-mail), e-mail vérifié]
        $people = [
            ['01', 'user', 'Aïcha', 'Sossa', 'client@kwabo.demo', 'France', '+33 6 12 34 56 78', null, true],
            ['02', 'user', 'Romuald', 'Agbo', 'romuald@exemple.com', 'Belgique', '+32 470 12 34 56', 'client@kwabo.demo', true],
            ['03', 'user', 'Clarisse', 'Houngbo', 'clarisse@exemple.com', 'Canada', '+1 514 555 0147', 'client@kwabo.demo', true],
            ['04', 'user', 'Edwige', 'Tossou', 'edwige@exemple.com', 'France', '+33 7 22 33 44 55', null, true],
            ['05', 'user', 'Fabrice', 'Akpovi', 'fabrice@exemple.com', 'États-Unis', '+1 202 555 0183', null, true],
            ['06', 'user', 'Gisèle', 'Ahouansou', 'gisele@exemple.com', 'Allemagne', '+49 170 555 0192', 'edwige@exemple.com', true],
            ['07', 'user', 'Hervé', 'Gbaguidi', 'herve@exemple.com', 'Suisse', '+41 79 555 01 74', 'edwige@exemple.com', true],
            ['08', 'user', 'Inès', 'Dossa', 'ines@exemple.com', 'Gabon', '+241 06 55 01 23', null, true],
            ['09', 'user', 'Jules', 'Zinsou', 'jules@exemple.com', 'Canada', '+1 438 555 0166', null, false],
            ['10', 'admin', 'Équipe', 'KWABO', 'admin@kwabo.demo', 'Bénin', '+229 01 00 00 00 00', null, true],
            ['11', 'operator', 'Maxime', 'Dossou', 'agent@kwabo.demo', 'Bénin', '+229 01 00 00 00 01', null, true],
            ['12', 'operator', 'Sènan', 'Kpadé', 'senan@kwabo.demo', 'Bénin', '+229 01 00 00 00 02', null, true],
        ];

        foreach ($people as [$number, $role, $first, $last, $email, $country, $phone, $sponsor, $verified]) {
            $user = User::firstOrNew(['email' => $email]);
            $user->forceFill([
                'first_name' => $first,
                'last_name' => $last,
                'role' => $role,
                'phone' => $phone,
                'country' => $country,
                'password' => 'Demo1234',
                'email_verified_at' => $verified ? now() : null,
                'two_factor_enabled' => false,
                'notification_prefs' => $prefs,
                'referral_code' => 'KW-'.mb_strtoupper(mb_substr($first, 0, 4)).$number,
            ])->save();
        }

        // Parrainages : on relie les filleuls à leur parrain une fois tous les comptes créés.
        foreach ($people as [, , , , $email, , , $sponsor]) {
            if ($sponsor) {
                User::where('email', $email)->update([
                    'referred_by' => User::where('email', $sponsor)->value('id'),
                ]);
            }
        }
    }
}