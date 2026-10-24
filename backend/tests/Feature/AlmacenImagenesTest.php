<?php

namespace Tests\Feature;

use App\Models\Servicio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Las fotos se suben a Cloudinary cuando está configurado y se borran la anterior al reemplazar. */
class AlmacenImagenesTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_foto_del_servicio_se_sube_a_cloudinary_y_reemplaza_la_anterior(): void
    {
        config(['services.cloudinary' => ['cloud_name' => 'demo', 'api_key' => 'k', 'api_secret' => 's']]);
        Http::fake([
            'api.cloudinary.com/v1_1/demo/image/upload' => Http::response(['secure_url' => 'https://res.cloudinary.com/demo/image/upload/v2/studio-la-barber/servicios/nueva.jpg']),
            'api.cloudinary.com/v1_1/demo/image/destroy' => Http::response(['result' => 'ok']),
        ]);

        $admin = User::create(['nombres' => 'A', 'apellidos' => 'B', 'email' => 'a@t.local', 'password' => 'password123', 'rol' => 'administrador']);
        $servicio = Servicio::create([
            'nombre' => 'Corte', 'categoria' => 'corte', 'duracion_minutos' => 30, 'precio' => 8, 'activo' => true,
            'imagen' => 'https://res.cloudinary.com/demo/image/upload/v1/studio-la-barber/servicios/vieja.jpg',
        ]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/servicios/{$servicio->id}/imagen", ['imagen' => UploadedFile::fake()->createWithContent('foto.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))])
            ->assertOk()
            ->assertJsonPath('imagen', 'https://res.cloudinary.com/demo/image/upload/v2/studio-la-barber/servicios/nueva.jpg');

        Http::assertSent(fn ($r) => str_ends_with($r->url(), '/image/destroy') && $r['public_id'] === 'studio-la-barber/servicios/vieja');
        Http::assertSent(fn ($r) => str_ends_with($r->url(), '/image/upload'));
    }
}
