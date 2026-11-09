<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /* ---------- Utilisateurs : on adapte la table créée par Laravel ---------- */
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->string('role', 20)->default('user')->after('password')->index(); // user | operator | admin
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('country', 80)->nullable()->after('phone');
            $table->boolean('two_factor_enabled')->default(false);
            $table->timestamp('suspended_at')->nullable();
            $table->string('referral_code', 20)->nullable()->unique();
            $table->foreignId('referred_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('notification_prefs')->nullable();
        });

        /* ---------- Catalogue ---------- */
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('short');
            $table->text('blurb')->nullable();
            $table->string('icon')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('price_label')->nullable();
            $table->text('short')->nullable();
            $table->json('included')->nullable();
            $table->json('form_fields')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('popular')->default(false);
            $table->boolean('available')->default(true);
            $table->timestamps();
        });

        /* ---------- Demandes ---------- */
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->string('tracking', 30)->nullable()->unique(); // ex. KW-2026-0001
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained();
            $table->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('pending')->index(); // pending | active | done | cancelled
            $table->string('title');
            $table->string('city')->nullable();
            $table->string('urgency', 20)->default('normal');
            $table->string('budget')->nullable();
            $table->text('description')->nullable();
            $table->json('details')->nullable();
            $table->decimal('quote_amount', 10, 2)->nullable();
            $table->string('quote_label')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->timestamps();
        });

        Schema::create('request_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->string('text');
            $table->timestamps();
        });

        Schema::create('request_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('text');
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 20); // report | photo | video | receipt | contract
            $table->string('name');
            $table->string('path')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->string('sender', 10); // team | client
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('text')->nullable();
            $table->string('attachment_name')->nullable(); // pièce jointe (nom du fichier)
            $table->string('attachment_path')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        /* ---------- Paiements ---------- */
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number', 30)->unique(); // ex. F-2026-0041
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->decimal('amount', 10, 2);
            $table->string('status', 20)->default('due')->index(); // due | paid | refunded | cancelled
            $table->string('method', 20)->nullable(); // card | momo | wise
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('label'); // ex. « Visa se terminant par 4242 » (jamais le numéro complet)
            $table->string('provider_token')->nullable(); // jeton du prestataire de paiement
            $table->timestamps();
        });

        /* ---------- Avis, notifications, journal ---------- */
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending | published | hidden
            $table->timestamps();
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete(); // null = équipe
            $table->string('text');
            $table->string('link')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('text');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('request_notes');
        Schema::dropIfExists('request_histories');
        Schema::dropIfExists('service_requests');
        Schema::dropIfExists('services');
        Schema::dropIfExists('categories');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referred_by']);
            $table->dropColumn([
                'first_name', 'last_name', 'role', 'phone', 'country', 'two_factor_enabled',
                'suspended_at', 'referral_code', 'referred_by', 'notification_prefs',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->after('id');
        });
    }
};
