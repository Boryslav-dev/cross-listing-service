<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\WorkspaceMemberStatus;
use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\InviteWorkspaceMemberRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceMemberRequest;
use App\Http\Resources\Workspace\WorkspaceMemberResource;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Support\AuditLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceMemberController extends Controller
{
    /**
     * @throws AuthorizationException
     */
    public function index(Request $request, Workspace $workspace)
    {
        $this->authorize('viewAny', [WorkspaceMembership::class, $workspace]);

        $members = $workspace->memberships()
            ->with(['user', 'invitedBy'])
            ->orderBy('id')
            ->paginate(20);

        return WorkspaceMemberResource::collection($members);
    }

    /**
     * @throws AuthorizationException
     */
    public function invite(InviteWorkspaceMemberRequest $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('invite', [WorkspaceMembership::class, $workspace]);

        $payload = $request->validated();
        $requestedRole = WorkspaceRole::from($payload['role']);
        $actorRole = $request->attributes->get('workspaceMembership')?->role;

        if ($actorRole === WorkspaceRole::ADMIN && $requestedRole === WorkspaceRole::OWNER) {
            return $this->forbiddenRoleChangeResponse();
        }

        if (
            $actorRole === WorkspaceRole::MANAGER
            && ! in_array($requestedRole, [WorkspaceRole::CONTENT, WorkspaceRole::VIEWER], true)
        ) {
            return $this->forbiddenRoleChangeResponse();
        }

        $email = mb_strtolower((string) $payload['email']);

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if ($user) {
            $existingMembership = $workspace->memberships()
                ->where('user_id', $user->getKey())
                ->first();

            if ($existingMembership && $existingMembership->status === WorkspaceMemberStatus::ACTIVE) {
                return response()->json([
                    'message' => __('messages.member_already_exists'),
                    'errors' => [
                        'email' => [__('messages.member_already_exists')],
                    ],
                ], 422);
            }
        } else {
            $existingInvite = $workspace->memberships()
                ->whereNull('user_id')
                ->whereRaw('LOWER(invited_email) = ?', [$email])
                ->first();

            if ($existingInvite) {
                return response()->json([
                    'message' => __('messages.member_already_invited'),
                    'errors' => [
                        'email' => [__('messages.member_already_invited')],
                    ],
                ], 422);
            }
        }

        $membership = WorkspaceMembership::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->getKey(),
                'user_id' => $user?->getKey(),
            ],
            [
                'role' => $requestedRole,
                'status' => WorkspaceMemberStatus::INVITED,
                'invited_email' => $user ? null : $email,
                'invited_by_user_id' => $request->user()->getKey(),
            ],
        );

        $membership->load(['user', 'invitedBy']);

        AuditLogger::log(
            $request,
            'workspace.member.invited',
            $request->user(),
            [
                'invited_email' => $email,
                'role' => $membership->role?->value ?? $membership->role,
            ],
            $workspace,
            'workspace_member',
            $membership->getKey(),
        );

        return response()->json([
            'member' => WorkspaceMemberResource::make($membership),
        ], 201);
    }

    /**
     * @throws AuthorizationException
     */
    public function update(
        UpdateWorkspaceMemberRequest $request,
        Workspace $workspace,
        int $memberId,
    ): JsonResponse {
        $this->authorize('changeRole', [WorkspaceMembership::class, $workspace]);

        $membership = $workspace->memberships()->with(['user', 'invitedBy'])->findOrFail($memberId);

        $actorMembership = $request->attributes->get('workspaceMembership');
        $actorRole = $actorMembership?->role;
        $newRole = WorkspaceRole::from($request->validated('role'));

        if ($actorRole === WorkspaceRole::ADMIN && $newRole === WorkspaceRole::OWNER) {
            return $this->forbiddenRoleChangeResponse();
        }

        if ($actorRole === WorkspaceRole::ADMIN && $membership->role === WorkspaceRole::OWNER) {
            return $this->forbiddenRoleChangeResponse();
        }

        if ($membership->user_id === $request->user()->getKey() && $newRole === WorkspaceRole::VIEWER) {
            return response()->json([
                'message' => __('messages.invalid_role_change'),
                'errors' => [
                    'role' => [__('messages.invalid_role_change')],
                ],
            ], 422);
        }

        if (
            $membership->role === WorkspaceRole::OWNER
            && $newRole !== WorkspaceRole::OWNER
            && $workspace->memberships()
                ->where('status', WorkspaceMemberStatus::ACTIVE->value)
                ->where('role', WorkspaceRole::OWNER->value)
                ->count() <= 1
        ) {
            return response()->json([
                'message' => __('messages.last_owner_restriction'),
                'errors' => [
                    'role' => [__('messages.last_owner_restriction')],
                ],
            ], 422);
        }

        $previousRole = $membership->role?->value ?? $membership->role;

        $membership->forceFill([
            'role' => $newRole,
        ])->save();

        AuditLogger::log(
            $request,
            'workspace.member.role_changed',
            $request->user(),
            [
                'from' => $previousRole,
                'to' => $newRole->value,
            ],
            $workspace,
            'workspace_member',
            $membership->getKey(),
        );

        return response()->json([
            'member' => WorkspaceMemberResource::make($membership->fresh(['user', 'invitedBy'])),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(Request $request, Workspace $workspace, int $memberId): JsonResponse
    {
        $this->authorize('remove', [WorkspaceMembership::class, $workspace]);

        $membership = $workspace->memberships()->findOrFail($memberId);
        $actorMembership = $request->attributes->get('workspaceMembership');

        if ($actorMembership?->role === WorkspaceRole::ADMIN && $membership->role === WorkspaceRole::OWNER) {
            return $this->forbiddenRoleChangeResponse();
        }

        if (
            $membership->role === WorkspaceRole::OWNER
            && $workspace->memberships()
                ->where('status', WorkspaceMemberStatus::ACTIVE->value)
                ->where('role', WorkspaceRole::OWNER->value)
                ->count() <= 1
        ) {
            return response()->json([
                'message' => __('messages.last_owner_restriction'),
                'errors' => [
                    'member' => [__('messages.last_owner_restriction')],
                ],
            ], 422);
        }

        AuditLogger::log(
            $request,
            'workspace.member.removed',
            $request->user(),
            [
                'removed_user_id' => $membership->user_id,
                'removed_invited_email' => $membership->invited_email,
                'removed_role' => $membership->role?->value ?? $membership->role,
            ],
            $workspace,
            'workspace_member',
            $membership->getKey(),
        );

        $membership->delete();

        return response()->json([
            'ok' => true,
        ]);
    }

    private function forbiddenRoleChangeResponse(): JsonResponse
    {
        return response()->json([
            'message' => __('messages.forbidden'),
            'errors' => [
                'role' => [__('messages.forbidden')],
            ],
        ], 403);
    }
}
