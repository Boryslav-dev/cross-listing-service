<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('audit_logs', 'actor_user_id')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // This migration aligns legacy schemas and is intentionally non-destructive on rollback.
    }
};
