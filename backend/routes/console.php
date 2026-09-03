<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// RF-04: revisa cada 5 minutos si hay confirmaciones o recordatorios de
// citas listos para enviarse (ver App\Console\Commands\EnviarNotificacionesPendientes).
Schedule::command('notificaciones:procesar-pendientes')->everyFiveMinutes();
