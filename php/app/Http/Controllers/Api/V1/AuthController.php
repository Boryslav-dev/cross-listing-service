<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $payload = $request->validated();

        $user = User::query()->create([
            'name' => $payload['name'] ?? null,
            'email' => $payload['email'],
            'password' => $payload['password'],
            'role' => UserRole::MEMBER,
        ]);

        event(new Registered($user));

        Auth::login($user);
        $this->regenerateSession($request);

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        AuditLogger::log($request, 'auth.register', $user);
        AuditLogger::log($request, 'auth.login', $user, ['source' => 'register']);

        return response()->json([
            'user' => UserResource::make($user),
            'requires_email_verification' => ! $user->hasVerifiedEmail(),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ])) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        $this->regenerateSession($request);

        /** @var User $user */
        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->save();

        AuditLogger::log($request, 'auth.login', $user);

        return response()->json([
            'user' => UserResource::make($user),
        ]);
    }

    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->away($this->frontendUrl('/login?oauth=error'));
        }

        $email = Str::lower($googleUser->getEmail());
        $googleId = $googleUser->getId();
        $displayName = ($googleUser->getName() ?: $googleUser->getNickname());

        if ($googleId === '' || $email === '') {
            return redirect()->away($this->frontendUrl('/login?oauth=missing_data'));
        }

        $user = User::query()
            ->where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        $created = false;

        if (!$user) {
            $created = true;

            $user = User::query()->create([
                'name' => $displayName ?: null,
                'email' => $email,
                'google_id' => $googleId,
                'email_verified_at' => now(),
                'password' => Str::password(32),
                'role' => UserRole::MEMBER,
            ]);
        } else {
            $payload = [];

            if (!$user->google_id) {
                $payload['google_id'] = $googleId;
            }

            if (!$user->email_verified_at) {
                $payload['email_verified_at'] = now();
            }

            if (!$user->name && $displayName !== '') {
                $payload['name'] = $displayName;
            }

            if ($payload !== []) {
                $user->forceFill($payload)->save();
            }
        }

        Auth::login($user);
        $this->regenerateSession($request);

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        if ($created) {
            AuditLogger::log($request, 'auth.register', $user, ['source' => 'google']);
        }

        AuditLogger::log($request, 'auth.login', $user, ['source' => 'google']);
        AuditLogger::log($request, 'auth.oauth.google.login', $user);

        return redirect()->away($this->frontendUrl('/app?oauth=google'));
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        AuditLogger::log($request, 'auth.logout', $user);

        Auth::guard('web')->logout();
        $this->invalidateSession($request);

        return response()->json([
            'ok' => true,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => UserResource::make($user),
        ]);
    }

    public function sendEmailVerificationNotification(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
            AuditLogger::log($request, 'auth.email_verification_requested', $user);
        }

        return response()->json([
            'ok' => true,
        ]);
    }

    public function verifyEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            AuditLogger::log($request, 'auth.email_verified', $user);
        }

        $redirectUrl = rtrim(config('app.frontend_url'), '/').'/email-verified?verified=1';

        return redirect()->away($redirectUrl);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        Password::sendResetLink(['email' => $email]);

        AuditLogger::log($request, 'auth.password_reset_requested', null, [
            'email_hash' => sha1(Str::lower($email)),
        ]);

        return response()->json([
            'ok' => true,
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $payload = $request->validated();

        $status = Password::reset(
            [
                'email' => $payload['email'],
                'password' => $payload['password'],
                'password_confirmation' => $payload['password_confirmation'],
                'token' => $payload['token'],
            ],
            function (User $user, string $password) use ($request): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                AuditLogger::log($request, 'auth.password_reset_completed', $user);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
        }

        return response()->json([
            'ok' => true,
        ]);
    }

    private function regenerateSession(Request $request): void
    {
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
    }

    private function invalidateSession(Request $request): void
    {
        if (! $request->hasSession()) {
            return;
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function frontendUrl(string $path): string
    {
        return rtrim(config('app.frontend_url'), '/').$path;
    }
}
