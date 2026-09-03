<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Perfil profesional del barbero (RF-03): comisión, especialidad, horario y
 * servicios que puede prestar. Siempre está ligado 1 a 1 con un User cuyo
 * rol es 'barbero'.
 */
class Barbero extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'especialidad',
        'comision_porcentaje',
    ];

    protected function casts(): array
    {
        return [
            'comision_porcentaje' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(HorarioBarbero::class);
    }

    public function excepciones(): HasMany
    {
        return $this->hasMany(ExcepcionHorario::class);
    }

    public function servicios(): BelongsToMany
    {
        return $this->belongsToMany(Servicio::class, 'barbero_servicio');
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class);
    }

    /** Calcula la comisión de un monto de servicios según su porcentaje configurado. */
    public function calcularComision(float $montoServicios): float
    {
        return round($montoServicios * ((float) $this->comision_porcentaje / 100), 2);
    }
}
