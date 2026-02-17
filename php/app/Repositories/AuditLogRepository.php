<?php

namespace App\Repositories;

use App\Models\AuditLog;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AuditLogRepository
{
    /**
     * @param array<string, mixed> $payload
     */
    public function paginateForWorkspace(Workspace $workspace, array $payload, int $perPage): LengthAwarePaginator
    {
        $filterPayload = array_filter([
            'action' => $payload['action'] ?? null,
            'actor_user_id' => $payload['actor_user_id'] ?? null,
            'target_type' => $payload['target_type'] ?? null,
            'date_from' => $payload['date_from'] ?? null,
            'date_to' => $payload['date_to'] ?? null,
        ], static fn (mixed $value): bool => $value !== null && $value !== '');

        $queryRequest = Request::create('/', 'GET', [
            'filter' => $filterPayload,
        ]);

        return QueryBuilder::for(
            AuditLog::query()
                ->where('workspace_id', $workspace->getKey())
                ->with('actor'),
            $queryRequest,
        )
            ->allowedFilters([
                AllowedFilter::exact('action'),
                AllowedFilter::exact('actor_user_id'),
                AllowedFilter::exact('target_type'),
                AllowedFilter::callback('date_from', function (Builder $query, mixed $value): void {
                    $query->where('created_at', '>=', Carbon::parse((string) $value)->startOfDay());
                }),
                AllowedFilter::callback('date_to', function (Builder $query, mixed $value): void {
                    $query->where('created_at', '<=', Carbon::parse((string) $value)->endOfDay());
                }),
            ])
            ->orderByDesc('id')
            ->paginate($perPage);
    }
}
