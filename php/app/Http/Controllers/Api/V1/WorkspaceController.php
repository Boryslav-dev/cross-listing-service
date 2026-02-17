<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\WorkspaceMemberStatus;
use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Http\Resources\Workspace\WorkspaceResource;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $workspaces = Workspace::query()
            ->whereHas('memberships', function ($query) use ($user): void {
                $query
                    ->where('user_id', $user->getKey())
                    ->where('status', WorkspaceMemberStatus::ACTIVE->value);
            })
            ->with(['memberships' => function ($query) use ($user): void {
                $query
                    ->where('user_id', $user->getKey())
                    ->where('status', WorkspaceMemberStatus::ACTIVE->value);
            }])
            ->withCount(['memberships as members_count' => function ($query): void {
                $query->where('status', WorkspaceMemberStatus::ACTIVE->value);
            }])
            ->latest('id')
            ->paginate(15);

        $workspaces->getCollection()->transform(function (Workspace $workspace): Workspace {
            $workspace->setRelation('currentMembership', $workspace->memberships->first());

            return $workspace;
        });

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $user = $request->user();

        $workspace = Workspace::query()->create([
            'name' => $payload['name'],
            'slug' => $payload['slug'] ?? null,
            'created_by_user_id' => $user->getKey(),
        ]);

        $membership = WorkspaceMembership::query()->create([
            'workspace_id' => $workspace->getKey(),
            'user_id' => $user->getKey(),
            'role' => WorkspaceRole::OWNER,
            'status' => WorkspaceMemberStatus::ACTIVE,
            'joined_at' => now(),
        ]);

        $workspace->setAttribute('members_count', 1);
        $workspace->setRelation('currentMembership', $membership);

        AuditLogger::log(
            $request,
            'workspace.created',
            $user,
            ['name' => $workspace->name, 'slug' => $workspace->slug],
            $workspace,
            'workspace',
            $workspace->getKey(),
        );

        return response()->json([
            'workspace' => WorkspaceResource::make($workspace),
        ], 201);
    }

    public function show(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('view', $workspace);

        $membership = $request->attributes->get('workspaceMembership')
            ?? $workspace->memberships()->where('user_id', $request->user()->getKey())->first();

        $workspace->loadCount(['memberships as members_count' => function ($query): void {
            $query->where('status', WorkspaceMemberStatus::ACTIVE->value);
        }]);

        $workspace->setRelation('currentMembership', $membership);

        return response()->json([
            'workspace' => WorkspaceResource::make($workspace),
        ]);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('update', $workspace);

        $workspace->fill($request->validated())->save();

        $workspace->loadCount(['memberships as members_count' => function ($query): void {
            $query->where('status', WorkspaceMemberStatus::ACTIVE->value);
        }]);

        $workspace->setRelation('currentMembership', $request->attributes->get('workspaceMembership'));

        AuditLogger::log(
            $request,
            'workspace.updated',
            $request->user(),
            ['name' => $workspace->name, 'slug' => $workspace->slug],
            $workspace,
            'workspace',
            $workspace->getKey(),
        );

        return response()->json([
            'workspace' => WorkspaceResource::make($workspace),
        ]);
    }

    public function destroy(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('delete', $workspace);

        AuditLogger::log(
            $request,
            'workspace.deleted',
            $request->user(),
            [],
            $workspace,
            'workspace',
            $workspace->getKey(),
        );

        $workspace->delete();

        return response()->json([
            'ok' => true,
        ]);
    }
}
