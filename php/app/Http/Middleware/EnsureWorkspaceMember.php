<?php

namespace App\Http\Middleware;

use App\Enums\WorkspaceMemberStatus;
use App\Models\Workspace;
use App\Support\WorkspacePermissions;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->route('workspace');

        if (! $workspace instanceof Workspace) {
            return new JsonResponse([
                'message' => __('messages.workspace_not_found'),
                'errors' => new \stdClass(),
            ], 404);
        }

        $user = $request->user();

        $membership = $workspace->memberships()
            ->where('user_id', $user?->getAuthIdentifier())
            ->where('status', WorkspaceMemberStatus::ACTIVE->value)
            ->first();

        if (! $membership) {
            return new JsonResponse([
                'message' => __('messages.workspace_forbidden'),
                'errors' => new \stdClass(),
            ], 403);
        }

        $request->attributes->set('workspaceMembership', $membership);
        $request->attributes->set('workspaceRole', $membership->role?->value ?? $membership->role);
        $request->attributes->set('workspacePermissions', WorkspacePermissions::forRole($membership->role));

        return $next($request);
    }
}
