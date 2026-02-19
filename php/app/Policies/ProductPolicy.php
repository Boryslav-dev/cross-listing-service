<?php

namespace App\Policies;

use App\Enums\WorkspaceMemberStatus;
use App\Models\Product;
use App\Models\User;
use App\Models\Workspace;
use App\Support\WorkspacePermissions;

class ProductPolicy
{
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $this->isMember($user, $workspace);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->isMember($user, $product->workspace);
    }

    public function create(User $user, Workspace $workspace): bool
    {
        return $this->hasPermission($user, $workspace, 'products.write');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->hasPermission($user, $product->workspace, 'products.write');
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->hasPermission($user, $product->workspace, 'products.write');
    }

    private function isMember(User $user, Workspace $workspace): bool
    {
        return $workspace->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->exists();
    }

    private function hasPermission(User $user, Workspace $workspace, string $permission): bool
    {
        $membership = $workspace->memberships()
            ->where('user_id', $user->getKey())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->first();

        if (! $membership) {
            return false;
        }

        $role = $membership->role?->value ?? $membership->role;
        $permissions = WorkspacePermissions::forRole($role);

        return in_array($permission, $permissions, true);
    }
}
