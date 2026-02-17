<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_success_and_validation_errors(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'StrongPass123',
            'password_confirmation' => 'StrongPass123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonPath('requires_email_verification', false);

        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);

        $invalidResponse = $this->postJson('/api/v1/auth/register', [
            'email' => 'not-valid-email',
            'password' => '123',
            'password_confirmation' => '321',
        ]);

        $invalidResponse
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_success_and_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('StrongPass123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'StrongPass123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'login@example.com');

        $this->assertNotNull($user->fresh()->last_login_at);

        $invalidResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'wrong-password',
        ]);

        $invalidResponse
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_locale_header_changes_api_messages(): void
    {
        $this->withHeader('X-Locale', 'uk')
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Неавторизовано.');

        $this->withHeader('X-Locale', 'uk')
            ->postJson('/api/v1/auth/login', [
                'email' => 'missing@example.com',
                'password' => 'wrong-password',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Облікові дані не збігаються з нашими записами.');
    }

    public function test_me_is_protected_and_returns_user_when_authorized(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized();

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_logout_invalidates_authenticated_session(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('ok', true);
    }

    public function test_forgot_password_always_returns_ok(): void
    {
        Notification::fake();

        $existingUser = User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'existing@example.com',
        ])->assertOk()->assertJson(['ok' => true]);

        Notification::assertSentTo($existingUser, ResetPassword::class);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'missing@example.com',
        ])->assertOk()->assertJson(['ok' => true]);
    }

    public function test_google_redirect_returns_provider_redirect(): void
    {
        Socialite::shouldReceive('driver')->with('google')->andReturnSelf();
        Socialite::shouldReceive('scopes')->andReturnSelf();
        Socialite::shouldReceive('redirect')->once()->andReturn(redirect('https://accounts.google.com/o/oauth2/v2/auth'));

        $this->get('/api/v1/auth/google/redirect')
            ->assertRedirect('https://accounts.google.com/o/oauth2/v2/auth');
    }

    public function test_google_callback_creates_user_and_authenticates_session(): void
    {
        $socialiteUser = new SocialiteUser();
        $socialiteUser->id = 'google-account-1';
        $socialiteUser->name = 'Google User';
        $socialiteUser->email = 'google.user@example.com';

        Socialite::shouldReceive('driver')->with('google')->andReturnSelf();
        Socialite::shouldReceive('user')->once()->andReturn($socialiteUser);

        $this->get('/api/v1/auth/google/callback')
            ->assertRedirect('http://127.0.0.1:5173/app?oauth=google');

        $this->assertDatabaseHas('users', [
            'email' => 'google.user@example.com',
            'google_id' => 'google-account-1',
        ]);

        $this->assertAuthenticated();
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }
}
