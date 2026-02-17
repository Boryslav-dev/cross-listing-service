<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('role', ['owner', 'admin', 'manager', 'content', 'viewer'])->default('viewer');
            $table->enum('status', ['active', 'invited'])->default('invited');
            $table->string('invited_email')->nullable();
            $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'role']);
            $table->index(['workspace_id', 'invited_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_memberships');
    }
};
