<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Servicio incluido en una cita, con precio y duración vigentes al agendar. */
class CitaDetalle extends Model
{
    protected $table = 'cita_detalles';

    protected $fillable = [
        'cita_id',
        'servicio_id',
        'precio_aplicado',
        'duracion_aplicada',
    ];

    protected function casts(): array
    {
        return [
            'precio_aplicado' => 'decimal:2',
        ];
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class);
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class);
    }
}
