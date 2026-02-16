<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(Request $request, string $event, ?User $user = null, array $meta = []): void
    {
        AuditLog::query()->create([
            'user_id' => $user?->getKey(),
            'event' => $event,
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'meta' => $meta,
        ]);
    }
}
