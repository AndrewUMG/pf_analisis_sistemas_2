<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Jornada laboral semanal recurrente de un barbero (RF-03). */
class HorarioBarbero extends Model
{
    protected $table = 'horarios_barbero';

    protected $fillable = [
        'barbero_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
    ];

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }
}
