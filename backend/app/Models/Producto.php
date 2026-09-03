<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Producto cosmético o insumo de trabajo controlado por inventario (RF-09). */
class Producto extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'categoria',
        'precio',
        'existencia',
        'existencia_minima',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class);
    }

    /** true cuando la existencia llegó o cayó por debajo del mínimo definido. */
    public function getEnNivelCriticoAttribute(): bool
    {
        return $this->existencia <= $this->existencia_minima;
    }
}
