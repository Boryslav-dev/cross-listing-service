<?php

namespace Tests\Feature\Workspace;

use App\Enums\WorkspaceMemberStatus;
use App\Enums\WorkspaceRole;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceEpicTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_list_workspaces(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/v1/workspaces', [
            'name' => 'Main Workspace',
            'slug' => 'main-workspace',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('workspace.name', 'Main Workspace')
            ->assertJsonPath('workspace.current_role', WorkspaceRole::OWNER->value);

        $this->assertDatabaseHas('workspace_memberships', [
            'workspace_id' => $createResponse->json('workspace.id'),
            'user_id' => $user->id,
            'role' => WorkspaceRole::OWNER->value,
            'status' => WorkspaceMemberStatus::ACTIVE->value,
        ]);

        $listResponse = $this->getJson('/api/v1/workspaces');

        $listResponse
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Main Workspace')
            ->assertJsonPath('data.0.current_role', WorkspaceRole::OWNER->value);
    }

    public function test_viewer_cannot_invite_or_change_roles(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $workspace = $this->createWorkspaceWithOwner($owner);

        WorkspaceMembership::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $viewer->id,
            'role' => WorkspaceRole::VIEWER,
            'status' => WorkspaceMemberStatus::ACTIVE,
            'joined_at' => now(),
        ]);

        $ownerMembership = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $owner->id)
            ->firstOrFail();

        Sanctum::actingAs($viewer);

        $this->postJson("/api/v1/workspaces/{$workspace->id}/members/invite", [
            'email' => 'invite@example.com',
            'role' => WorkspaceRole::CONTENT->value,
        ])->assertForbidden();

        $this->patchJson("/api/v1/workspaces/{$workspace->id}/members/{$ownerMembership->id}", [
            'role' => WorkspaceRole::ADMIN->value,
        ])->assertForbidden();
    }

    public function test_invite_role_escalation_is_blocked_for_admin_and_manager(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceWithOwner($owner);

        WorkspaceMembership::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $admin->id,
            'role' => WorkspaceRole::ADMIN,
            'status' => WorkspaceMemberStatus::ACTIVE,
            'joined_at' => now(),
        ]);

        WorkspaceMembership::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $manager->id,
            'role' => WorkspaceRole::MANAGER,
            'status' => WorkspaceMemberStatus::ACTIVE,
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/workspaces/{$workspace->id}/members/invite", [
            'email' => 'owner.role@example.com',
            'role' => WorkspaceRole::OWNER->value,
        ])->assertForbidden();

        Sanctum::actingAs($manager);
        $this->postJson("/api/v1/workspaces/{$workspace->id}/members/invite", [
            'email' => 'admin.role@example.com',
            'role' => WorkspaceRole::ADMIN->value,
        ])->assertForbidden();

        $this->postJson("/api/v1/workspaces/{$workspace->id}/members/invite", [
            'email' => 'viewer.role@example.com',
            'role' => WorkspaceRole::VIEWER->value,
        ])->assertCreated();
    }

    public function test_cannot_remove_or_demote_last_owner(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceWithOwner($owner);

        $ownerMembership = WorkspaceMembership::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $owner->id)
            ->firstOrFail();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/workspaces/{$workspace->id}/members/{$ownerMembership->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['member']);

        $this->patchJson("/api/v1/workspaces/{$workspace->id}/members/{$ownerMembership->id}", [
            'role' => WorkspaceRole::ADMIN->value,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_audit_logs_are_filtered_by_query_params(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspaceResponse = $this->postJson('/api/v1/workspaces', [
            'name' => 'Filter Workspace',
        ])->assertCreated();

        $workspaceId = (int) $workspaceResponse->json('workspace.id');

        $this->postJson("/api/v1/workspaces/{$workspaceId}/members/invite", [
            'email' => 'filters@example.com',
            'role' => WorkspaceRole::VIEWER->value,
        ])->assertCreated();

        $response = $this->getJson("/api/v1/workspaces/{$workspaceId}/audit-logs?action=workspace.member.invited&date_from=".now()->toDateString());

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.action', 'workspace.member.invited');
    }

    private function createWorkspaceWithOwner(User $owner): Workspace
    {
        $workspace = Workspace::query()->create([
            'name' => 'Workspace for '. $owner->id,
            'created_by_user_id' => $owner->id,
        ]);

        WorkspaceMembership::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::OWNER,
            'status' => WorkspaceMemberStatus::ACTIVE,
            'joined_at' => now(),
        ]);

        return $workspace;
    }
}
