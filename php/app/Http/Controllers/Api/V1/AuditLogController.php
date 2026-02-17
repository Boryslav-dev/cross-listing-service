<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuditLog\IndexAuditLogRequest;
use App\Http\Resources\AuditLog\AuditLogResource;
use App\Models\AuditLog;
use App\Models\Workspace;
use App\Repositories\AuditLogRepository;
use Illuminate\Auth\Access\AuthorizationException;

class AuditLogController extends Controller
{
    public function __construct(
        private readonly AuditLogRepository $auditLogRepository,
    ) {
    }

    /**
     * @throws AuthorizationException
     */
    public function index(IndexAuditLogRequest $request, Workspace $workspace)
    {
        $this->authorize('viewAny', [AuditLog::class, $workspace]);

        $payload = $request->validated();
        $perPage = $payload['per_page'] ?? 25;

        $paginator = $this->auditLogRepository->paginateForWorkspace($workspace, $payload, $perPage);

        return AuditLogResource::collection($paginator);
    }
}
