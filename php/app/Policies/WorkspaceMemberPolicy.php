<?php

namespace App\Policies;

use App\Enums\WorkspaceMemberStatus;
use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;

class WorkspaceMemberPolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $this->hasRole($user, $workspace) !== null;
    }

    public function invite(User $user, Workspace $workspace): bool
    {
        return in_array($this->hasRole($user, $workspace), [
            WorkspaceRole::OWNER,
            WorkspaceRole::ADMIN,
            WorkspaceRole::MANAGER,
        ], true);
    }

    public function changeRole(User $user, Workspace $workspace): bool
    {
        return in_array($this->hasRole($user, $workspace), [
            WorkspaceRole::OWNER,
            WorkspaceRole::ADMIN,
        ], true);
    }

    public function remove(User $user, Workspace $workspace): bool
    {
        return in_array($this->hasRole($user, $workspace), [
            WorkspaceRole::OWNER,
            WorkspaceRole::ADMIN,
        ], true);
    }

    private function hasRole(User $user, Workspace $workspace): ?WorkspaceRole
    {
        $membership = $workspace->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->first();

        if (!$membership instanceof WorkspaceMembership) {
            return null;
        }

        return $membership->role;
    }
}
