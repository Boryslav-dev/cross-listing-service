<?php

namespace App\Http\Resources\Workspace;

use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Support\WorkspacePermissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Workspace */
class WorkspaceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var WorkspaceMembership|null $membership */
        $membership = $this->relationLoaded('currentMembership')
            ? $this->getRelation('currentMembership')
            : ($this->relationLoaded('memberships') ? $this->memberships->first() : null);

        $role = $membership?->role?->value ?? $membership?->role;
        $status = $membership?->status?->value ?? $membership?->status;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'members_count' => $this->when(isset($this->members_count), (int)$this->members_count),
            'current_role' => $role,
            'current_role_label' => $role ? __('roles.' . $role) : null,
            'current_status' => $status,
            'current_status_label' => $status ? __('statuses.' . $status) : null,
            'permissions' => $role ? WorkspacePermissions::forRole($role) : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
