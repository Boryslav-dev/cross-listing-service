<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromHeader
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = array_values(array_filter(
            (array) config('app.supported_locales', ['en', 'uk']),
            static fn ($locale): bool => is_string($locale) && $locale !== '',
        ));

        $locale = $this->resolveLocale($request, $supportedLocales);

        app()->setLocale($locale);

        return $next($request);
    }

    /**
     * @param  array<int, string>  $supportedLocales
     */
    private function resolveLocale(Request $request, array $supportedLocales): string
    {
        $defaultLocale = (string) config('app.locale', 'en');

        $requestedHeaderLocale = $this->normalizeLocale((string) $request->header('X-Locale'));

        if ($requestedHeaderLocale !== null && in_array($requestedHeaderLocale, $supportedLocales, true)) {
            return $requestedHeaderLocale;
        }

        $preferredLanguage = $request->getPreferredLanguage($supportedLocales);

        if (is_string($preferredLanguage) && $preferredLanguage !== '') {
            return $preferredLanguage;
        }

        return in_array($defaultLocale, $supportedLocales, true)
            ? $defaultLocale
            : ($supportedLocales[0] ?? 'en');
    }

    private function normalizeLocale(string $rawLocale): ?string
    {
        $clean = trim(Str::lower($rawLocale));

        $baseLocale = explode('-', str_replace('_', '-', $clean), 2)[0];

        return $baseLocale !== '' ? $baseLocale : null;
    }
}
