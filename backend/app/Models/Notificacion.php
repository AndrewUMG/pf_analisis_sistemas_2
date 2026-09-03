<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Registro y trazabilidad de confirmaciones y recordatorios (RF-04). */
class Notificacion extends Model
{
    // Se fija explícito: Eloquent adivinaría "notificacions" (plural en inglés).
    protected $table = 'notificaciones';

    protected $fillable = [
        'cita_id',
        'tipo',
        'canal',
        'estado',
        'intentos',
        'enviado_at',
    ];

    protected function casts(): array
    {
        return [
            'enviado_at' => 'datetime',
        ];
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class);
    }
}
