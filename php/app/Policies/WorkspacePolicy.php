<?php

namespace App\Policies;

use App\Enums\WorkspaceMemberStatus;
use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function view(User $user, Workspace $workspace): bool
    {
        return $this->hasRole($user, $workspace) !== null;
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return in_array($this->hasRole($user, $workspace), [
            WorkspaceRole::OWNER,
            WorkspaceRole::ADMIN,
        ], true);
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->hasRole($user, $workspace) === WorkspaceRole::OWNER;
    }

    private function hasRole(User $user, Workspace $workspace): ?WorkspaceRole
    {
        $membership = $workspace->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->first();

        if (!$membership) {
            return null;
        }

        return $membership->role;
    }
}
