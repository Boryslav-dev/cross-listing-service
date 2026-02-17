<?php

namespace App\Support;

use App\Enums\WorkspaceRole;

class WorkspacePermissions
{
    public static function hasPermission(WorkspaceRole|string $role, string $permission): bool
    {
        $roleKey = $role instanceof WorkspaceRole ? $role->value : (string) $role;
        $rolePermissions = config("permissions.roles.$roleKey", []);

        return in_array($permission, $rolePermissions, true);
    }

    /**
     * @return list<string>
     */
    public static function forRole(WorkspaceRole|string $role): array
    {
        $roleKey = $role instanceof WorkspaceRole ? $role->value : (string) $role;

        return array_values(config("permissions.roles.$roleKey", []));
    }
}
