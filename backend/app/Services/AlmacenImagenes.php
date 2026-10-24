<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Guarda las fotos subidas desde el panel.
 *
 * Con las variables CLOUDINARY_* configuradas las sube a Cloudinary (persistente, ideal para
 * hostings con disco efímero como Render gratis). Sin ellas usa el disco "public" local.
 */
class AlmacenImagenes
{
    public function subir(UploadedFile $archivo, string $carpeta): string
    {
        if (! $this->usaCloudinary()) {
            $ruta = $archivo->store($carpeta, 'public');

            return Storage::disk('public')->url($ruta);
        }

        $parametros = ['folder' => 'studio-la-barber/'.$carpeta, 'timestamp' => time()];

        $respuesta = Http::asMultipart()
            ->attach('file', fopen($archivo->getRealPath(), 'r'), $archivo->getClientOriginalName())
            ->post($this->url('image/upload'), $this->firmar($parametros) + $parametros);

        if (! $respuesta->successful() || ! $respuesta->json('secure_url')) {
            throw new RuntimeException('No se pudo subir la imagen al almacenamiento externo.');
        }

        return $respuesta->json('secure_url');
    }

    public function eliminar(?string $url): void
    {
        if (! $url) {
            return;
        }

        if ($this->usaCloudinary() && str_contains($url, 'res.cloudinary.com')) {
            $parametros = ['public_id' => $this->publicIdDesdeUrl($url), 'timestamp' => time()];
            Http::asForm()->post($this->url('image/destroy'), $this->firmar($parametros) + $parametros);

            return;
        }

        Storage::disk('public')->delete(Str::after(parse_url($url, PHP_URL_PATH) ?? '', '/storage/'));
    }

    private function usaCloudinary(): bool
    {
        return (bool) config('services.cloudinary.cloud_name');
    }

    private function url(string $accion): string
    {
        return 'https://api.cloudinary.com/v1_1/'.config('services.cloudinary.cloud_name').'/'.$accion;
    }

    /** Firma SHA-1 exigida por Cloudinary: parámetros ordenados + secreto. */
    private function firmar(array $parametros): array
    {
        ksort($parametros);
        $texto = collect($parametros)->map(fn ($v, $k) => "$k=$v")->implode('&');

        return [
            'api_key' => config('services.cloudinary.api_key'),
            'signature' => sha1($texto.config('services.cloudinary.api_secret')),
        ];
    }

    /** https://res.cloudinary.com/x/image/upload/v123/carpeta/archivo.jpg -> carpeta/archivo */
    private function publicIdDesdeUrl(string $url): string
    {
        $despues = Str::after(parse_url($url, PHP_URL_PATH) ?? '', '/upload/');
        $despues = preg_replace('#^v\d+/#', '', $despues);

        return preg_replace('#\.[A-Za-z0-9]+$#', '', $despues);
    }
}
