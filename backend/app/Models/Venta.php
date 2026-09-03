<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Transacción de cobro de una cita completada o de una venta directa (RF-08). */
class Venta extends Model
{
    protected $fillable = [
        'cita_id',
        'cliente_id',
        'usuario_id',
        'numero_recibo',
        'subtotal',
        'descuento',
        'total',
        'metodo_pago',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'descuento' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cliente_id');
    }

    /** Usuario que efectuó el cobro (cajero/recepcionista/barbero/admin). */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(VentaDetalle::class);
    }
}
