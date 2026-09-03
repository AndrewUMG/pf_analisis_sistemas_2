<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Línea de una venta: un servicio o un producto, con su comisión si aplica. */
class VentaDetalle extends Model
{
    protected $table = 'venta_detalles';

    protected $fillable = [
        'venta_id',
        'tipo',
        'servicio_id',
        'producto_id',
        'barbero_id',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'comision',
    ];

    protected function casts(): array
    {
        return [
            'precio_unitario' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'comision' => 'decimal:2',
        ];
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }
}
