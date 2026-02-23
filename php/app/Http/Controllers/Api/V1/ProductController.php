<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\Product\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductTranslation;
use App\Models\Workspace;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request, Workspace $workspace)
    {
        $this->authorize('viewAny', [Product::class, $workspace]);

        $query = Product::query()
            ->where('workspace_id', $workspace->getKey())
            ->with(['translations', 'images']);

        // Search by name or SKU
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                    ->orWhereHas('translations', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Sorting
        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $allowed = ['created_at', 'price', 'quantity', 'sku'];

        if ($sortBy === 'name') {
            $query->leftJoin('product_translations as pt_sort', function ($join) {
                $join->on('pt_sort.product_id', '=', 'products.id')
                    ->where('pt_sort.locale', '=', 'uk');
            })->orderBy('pt_sort.name', $sortDir)->select('products.*');
        } elseif (in_array($sortBy, $allowed, true)) {
            $query->orderBy("products.{$sortBy}", $sortDir);
        } else {
            $query->latest('products.id');
        }

        $products = $query->paginate($request->input('per_page', 20));

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('create', [Product::class, $workspace]);

        $payload = $request->validated();

        DB::beginTransaction();

        try {
            $product = Product::query()->create([
                'workspace_id' => $workspace->getKey(),
                'sku' => $payload['sku'] ?? null,
                'price' => $payload['price'],
                'currency' => $payload['currency'],
                'quantity' => $payload['quantity'],
                'status' => $payload['status'],
                'condition' => $payload['condition'] ?? null,
                'metadata' => $payload['metadata'] ?? null,
            ]);

            // Create translations
            foreach ($payload['translations'] as $translation) {
                ProductTranslation::query()->create([
                    'product_id' => $product->getKey(),
                    'locale' => $translation['locale'],
                    'name' => $translation['name'],
                    'description' => $translation['description'] ?? null,
                ]);
            }

            // Create images
            if (! empty($payload['images'])) {
                foreach ($payload['images'] as $image) {
                    ProductImage::query()->create([
                        'product_id' => $product->getKey(),
                        'url' => $image['url'],
                        'path' => $image['path'],
                        'sort_order' => $image['sort_order'] ?? 0,
                    ]);
                }
            }

            $product->load(['translations', 'images']);

            AuditLogger::log(
                $request,
                'product.created',
                $request->user(),
                ['sku' => $product->sku, 'price' => $product->price],
                $workspace,
                'product',
                $product->getKey(),
            );

            DB::commit();

            return response()->json([
                'product' => ProductResource::make($product),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            throw $e;
        }
    }

    public function show(Request $request, Workspace $workspace, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        if ($product->workspace_id !== $workspace->getKey()) {
            abort(404);
        }

        $product->load(['translations', 'images']);

        return response()->json([
            'product' => ProductResource::make($product),
        ]);
    }

    public function update(UpdateProductRequest $request, Workspace $workspace, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        if ($product->workspace_id !== $workspace->getKey()) {
            abort(404);
        }

        $payload = $request->validated();

        DB::beginTransaction();

        try {
            $product->fill([
                'sku' => $payload['sku'] ?? $product->sku,
                'price' => $payload['price'] ?? $product->price,
                'currency' => $payload['currency'] ?? $product->currency,
                'quantity' => $payload['quantity'] ?? $product->quantity,
                'status' => $payload['status'] ?? $product->status,
                'condition' => array_key_exists('condition', $payload) ? $payload['condition'] : $product->condition,
                'metadata' => $payload['metadata'] ?? $product->metadata,
            ])->save();

            // Update translations
            if (isset($payload['translations'])) {
                // Delete existing translations
                $product->translations()->delete();

                // Create new translations
                foreach ($payload['translations'] as $translation) {
                    ProductTranslation::query()->create([
                        'product_id' => $product->getKey(),
                        'locale' => $translation['locale'],
                        'name' => $translation['name'],
                        'description' => $translation['description'] ?? null,
                    ]);
                }
            }

            // Update images
            if (isset($payload['images'])) {
                // Delete existing images
                $product->images()->delete();

                // Create new images
                foreach ($payload['images'] as $image) {
                    ProductImage::query()->create([
                        'product_id' => $product->getKey(),
                        'url' => $image['url'],
                        'path' => $image['path'],
                        'sort_order' => $image['sort_order'] ?? 0,
                    ]);
                }
            }

            $product->load(['translations', 'images']);

            AuditLogger::log(
                $request,
                'product.updated',
                $request->user(),
                ['sku' => $product->sku, 'price' => $product->price],
                $workspace,
                'product',
                $product->getKey(),
            );

            DB::commit();

            return response()->json([
                'product' => ProductResource::make($product),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            throw $e;
        }
    }

    public function destroy(Request $request, Workspace $workspace, Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        if ($product->workspace_id !== $workspace->getKey()) {
            abort(404);
        }

        AuditLogger::log(
            $request,
            'product.deleted',
            $request->user(),
            ['sku' => $product->sku, 'name' => $product->translations->first()?->name],
            $workspace,
            'product',
            $product->getKey(),
        );

        $product->delete();

        return response()->json(['ok' => true]);
    }
}
