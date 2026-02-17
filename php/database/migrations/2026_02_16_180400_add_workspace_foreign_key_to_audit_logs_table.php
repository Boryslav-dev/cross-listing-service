<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('audit_logs', 'workspace_id')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->foreignId('workspace_id')->nullable();
            });
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('audit_logs', 'workspace_id')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['workspace_id']);
        });
    }
};
