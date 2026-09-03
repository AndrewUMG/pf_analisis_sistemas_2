<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Reglas de negocio configurables sin tocar código (RF-02, PANT-16): holgura
 * entre servicios, anticipación mínima para cancelar/reagendar, tolerancia
 * de ausencia, etc. Se guardan como pares clave/valor de texto.
 */
class ParametroSistema extends Model
{
    protected $table = 'parametros_sistema';

    protected $fillable = ['clave', 'valor', 'descripcion'];

    public const HOLGURA_MINUTOS = 'holgura_entre_servicios_minutos';

    public const ANTICIPACION_MINIMA_HORAS = 'anticipacion_minima_horas';

    public const TOLERANCIA_AUSENCIA_MINUTOS = 'tolerancia_ausencia_minutos';

    /** Lee un parámetro por su clave, con caché de 10 minutos y un valor por defecto. */
    public static function obtener(string $clave, mixed $defecto = null): mixed
    {
        return Cache::remember("parametro:{$clave}", 600, function () use ($clave, $defecto) {
            return static::where('clave', $clave)->value('valor') ?? $defecto;
        });
    }

    public static function obtenerEntero(string $clave, int $defecto): int
    {
        return (int) static::obtener($clave, $defecto);
    }

    /** Guarda o actualiza un parámetro e invalida su caché. */
    public static function establecer(string $clave, string $valor, ?string $descripcion = null): void
    {
        static::updateOrCreate(['clave' => $clave], ['valor' => $valor, 'descripcion' => $descripcion]);
        Cache::forget("parametro:{$clave}");
    }
}
