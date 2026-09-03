<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Entidad central del sistema (RF-02): la reserva de un cliente con un
 * barbero para uno o varios servicios, en una fecha y franja horaria.
 */
class Cita extends Model
{
    use HasFactory;

    protected $fillable = [
        'cliente_id',
        'barbero_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'estado',
        'canal_origen',
        'notas',
        'motivo_cambio',
        'inicio_atencion_at',
        'fin_atencion_at',
        'monto_estimado',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'monto_estimado' => 'decimal:2',
            'inicio_atencion_at' => 'datetime',
            'fin_atencion_at' => 'datetime',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cliente_id');
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(CitaDetalle::class);
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }

    public function valoracion(): HasOne
    {
        return $this->hasOne(Valoracion::class);
    }

    public function venta(): HasOne
    {
        return $this->hasOne(Venta::class);
    }

    /** Citas que todavía ocupan un espacio en la agenda (bloquean disponibilidad). */
    public function scopeActivas($query)
    {
        return $query->whereIn('estado', ['confirmada', 'en_atencion']);
    }
}
