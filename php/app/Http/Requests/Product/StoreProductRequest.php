<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $workspace = $this->route('workspace');

        return [
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products')->where('workspace_id', $workspace?->getKey()),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'quantity' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['draft', 'active', 'archived'])],
            'metadata' => ['nullable', 'array'],
            'translations' => ['required', 'array', 'min:1'],
            'translations.*.locale' => ['required', 'string', Rule::in(['en', 'uk'])],
            'translations.*.name' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*.url' => ['required', 'string'],
            'images.*.path' => ['required', 'string'],
            'images.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
