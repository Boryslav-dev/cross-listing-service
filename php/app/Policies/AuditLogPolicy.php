<?php

namespace App\Policies;

use App\Enums\WorkspaceMemberStatus;
use App\Models\User;
use App\Models\Workspace;
use App\Support\WorkspacePermissions;

class AuditLogPolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        $membership = $workspace->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->first();

        if (!$membership) {
            return false;
        }

        return WorkspacePermissions::hasPermission($membership->role, 'audit.view');
    }
}
