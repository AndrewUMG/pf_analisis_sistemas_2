<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Calificación y comentario del cliente sobre el servicio recibido (RF-10). */
class Valoracion extends Model
{
    // Se fija explícito: Eloquent adivinaría "valoracions" (plural en inglés).
    protected $table = 'valoraciones';

    protected $fillable = [
        'cita_id',
        'cliente_id',
        'barbero_id',
        'calificacion',
        'comentario',
        'visible',
    ];

    protected function casts(): array
    {
        return [
            'visible' => 'boolean',
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

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }
}
