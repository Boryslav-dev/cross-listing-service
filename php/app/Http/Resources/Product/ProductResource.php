<?php

namespace App\Http\Resources\Product;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'sku' => $this->sku,
            'price' => $this->price,
            'currency' => $this->currency,
            'quantity' => $this->quantity,
            'status' => $this->status,
            'condition' => $this->condition,
            'metadata' => $this->metadata,
            'translations' => ProductTranslationResource::collection($this->whenLoaded('translations')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
