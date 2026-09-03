<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Representa a la entidad "usuario" del modelo DERCAS (RF-05).
 * Agrupa a los cuatro roles del sistema: cliente, barbero, recepcionista y
 * administrador. El rol específico de barbero se extiende en el modelo Barbero.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nombres',
        'apellidos',
        'email',
        'telefono',
        'password',
        'rol',
        'estado',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'bloqueado_hasta' => 'datetime',
        ];
    }

    /** Nombre completo, usado en comprobantes, agendas y notificaciones. */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function esAdministrador(): bool
    {
        return $this->rol === 'administrador';
    }

    public function esBarbero(): bool
    {
        return $this->rol === 'barbero';
    }

    public function esRecepcionista(): bool
    {
        return $this->rol === 'recepcionista';
    }

    public function esCliente(): bool
    {
        return $this->rol === 'cliente';
    }

    /** Perfil profesional, solo presente cuando rol = 'barbero'. */
    public function barbero(): HasOne
    {
        return $this->hasOne(Barbero::class);
    }

    /** Citas donde este usuario participa como cliente. */
    public function citasComoCliente(): HasMany
    {
        return $this->hasMany(Cita::class, 'cliente_id');
    }

    public function valoraciones(): HasMany
    {
        return $this->hasMany(Valoracion::class, 'cliente_id');
    }
}
