<?php

namespace App\Http\Resources\AuditLog;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AuditLog */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'action' => $this->action,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'meta' => $this->meta ?? new \stdClass(),
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at,
            'actor' => $this->whenLoaded('actor', function (): ?array {
                if (!$this->actor) {
                    return null;
                }

                return [
                    'id' => $this->actor->id,
                    'name' => $this->actor->name,
                    'email' => $this->actor->email,
                ];
            }),
        ];
    }
}
