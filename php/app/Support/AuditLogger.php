<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
class AuditLogger
{
    public static function log(
        Request $request,
        string $action,
        ?User $actor = null,
        array $meta = [],
        Workspace|int|null $workspace = null,
        ?string $targetType = null,
        string|int|null $targetId = null,
    ): void {
        $workspaceId = $workspace instanceof Workspace ? $workspace->getKey() : $workspace;

        AuditLog::query()->create([
            'workspace_id' => $workspaceId,
            'actor_user_id' => $actor?->getKey(),
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId !== null ? (string) $targetId : null,
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'meta' => $meta,
        ]);
    }
}
