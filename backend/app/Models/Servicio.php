<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Catálogo de servicios y combos promocionales (RF-01). */
class Servicio extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'categoria',
        'descripcion',
        'duracion_minutos',
        'precio',
        'imagen',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function barberos(): BelongsToMany
    {
        return $this->belongsToMany(Barbero::class, 'barbero_servicio');
    }

    public function citaDetalles(): HasMany
    {
        return $this->hasMany(CitaDetalle::class);
    }

    /** Solo el catálogo activo se ofrece en el motor de reservas (CU-001). */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
