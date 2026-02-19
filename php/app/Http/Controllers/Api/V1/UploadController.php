<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function uploadProductImage(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('create', [\App\Models\Product::class, $workspace]);

        $request->validate([
            'image' => ['required', 'image', 'max:5120', 'mimes:jpeg,jpg,png,webp'],
        ]);

        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40).'.'.$extension;

        $path = Storage::disk('public')->putFileAs('products', $file, $filename);
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'url' => $url,
            'path' => $path,
        ]);
    }
}
