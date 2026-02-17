<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('audit_logs', 'action')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('action')->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'target_type')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('target_type')->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'target_id')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('target_id')->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'meta')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->json('meta')->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'ip')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('ip', 45)->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'user_agent')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->text('user_agent')->nullable();
            });
        }

        if (!Schema::hasColumn('audit_logs', 'created_at')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        // This migration aligns legacy schemas and is intentionally non-destructive on rollback.
    }
};
