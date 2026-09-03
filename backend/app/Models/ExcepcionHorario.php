<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Días libres, permisos, vacaciones o bloqueos puntuales de un barbero (RF-03). */
class ExcepcionHorario extends Model
{
    protected $table = 'excepciones_horario';

    protected $fillable = [
        'barbero_id',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'motivo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
        ];
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }
}
