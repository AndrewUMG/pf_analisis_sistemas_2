<?php

namespace App\Providers;

use App\Services\Mensajeria\LogProveedorMensajeria;
use App\Services\Mensajeria\ProveedorMensajeria;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Punto único de sustitución del proveedor de mensajería real
        // (WhatsApp/correo) cuando el negocio contrate esas APIs (RF-04).
        $this->app->bind(ProveedorMensajeria::class, LogProveedorMensajeria::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
