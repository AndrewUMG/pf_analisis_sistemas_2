<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarberoController;
use App\Http\Controllers\Api\CitaController;
use App\Http\Controllers\Api\ParametroController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\ServicioController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\VentaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas de la API — Studio La Barber (RF-01 a RF-11)
|--------------------------------------------------------------------------
| Toda ruta bajo "auth:sanctum" exige el header "Authorization: Bearer
| {token}" entregado por /login o /registro. Las rutas con "rol:..." además
| exigen que el usuario autenticado tenga uno de esos roles (EnsureRole).
*/

// --- Autenticación (RF-05) ---------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('/registro', [AuthController::class, 'registro']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/olvide-password', [AuthController::class, 'olvidePassword']);
    Route::post('/restablecer-password', [AuthController::class, 'restablecerPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/perfil', [AuthController::class, 'perfil']);
        Route::put('/perfil', [AuthController::class, 'actualizarPerfil']);
    });
});

// --- Catálogo público (RF-01) --------------------------------------------
// index/show son públicos a propósito: el visitante debe poder ver el
// catálogo y los barberos disponibles antes de registrarse (PANT-01).
Route::get('/servicios', [ServicioController::class, 'index']);
Route::get('/servicios/{servicio}', [ServicioController::class, 'show']);
Route::get('/barberos', [BarberoController::class, 'index']);
Route::get('/barberos/{barbero}', [BarberoController::class, 'show']);
Route::get('/barberos/{barbero}/disponibilidad', [BarberoController::class, 'disponibilidad']);
Route::get('/productos', [ProductoController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {

    // --- Gestión del catálogo (RF-01) — administrador -----------------
    Route::middleware('rol:administrador')->group(function () {
        Route::post('/servicios', [ServicioController::class, 'store']);
        Route::put('/servicios/{servicio}', [ServicioController::class, 'update']);
        Route::delete('/servicios/{servicio}', [ServicioController::class, 'destroy']);
        Route::post('/servicios/{servicio}/imagen', [ServicioController::class, 'subirImagen']);

        Route::post('/barberos', [BarberoController::class, 'store']);
        Route::put('/barberos/{barbero}', [BarberoController::class, 'update']);

        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::get('/usuarios/{usuario}', [UsuarioController::class, 'show']);
        Route::post('/usuarios', [UsuarioController::class, 'store']);
        Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{usuario}', [UsuarioController::class, 'destroy']);

        Route::get('/parametros', [ParametroController::class, 'index']);
        Route::put('/parametros/{clave}', [ParametroController::class, 'update']);

        Route::get('/reportes/ingresos', [ReporteController::class, 'ingresos']);
        Route::get('/reportes/servicios-mas-demandados', [ReporteController::class, 'serviciosMasDemandados']);
        Route::get('/reportes/comisiones-por-barbero', [ReporteController::class, 'comisionesPorBarbero']);
        Route::get('/reportes/cancelaciones-ausentismo', [ReporteController::class, 'cancelacionesAusentismo']);

        Route::post('/ventas/{venta}/anular', [VentaController::class, 'anular']);
    });

    // --- Horario y agenda del barbero (RF-03) — admin o el propio barbero ---
    Route::middleware('rol:administrador,barbero')->group(function () {
        Route::put('/barberos/{barbero}/horarios', [BarberoController::class, 'actualizarHorarios']);
        Route::post('/barberos/{barbero}/excepciones', [BarberoController::class, 'registrarExcepcion']);
        Route::get('/barberos/{barbero}/agenda', [BarberoController::class, 'agendaDelDia']);
        Route::post('/barberos/{barbero}/foto', [BarberoController::class, 'subirFoto']);

        Route::post('/citas/{cita}/iniciar', [CitaController::class, 'iniciar']);
        Route::post('/citas/{cita}/finalizar', [CitaController::class, 'finalizar']);
        Route::post('/citas/{cita}/marcar-ausente', [CitaController::class, 'marcarAusente']);
    });

    // --- Inventario de productos (RF-09) — admin o recepcionista ------
    Route::middleware('rol:administrador,recepcionista')->group(function () {
        Route::post('/productos', [ProductoController::class, 'store']);
        Route::put('/productos/{producto}', [ProductoController::class, 'update']);
        Route::delete('/productos/{producto}', [ProductoController::class, 'destroy']);
        Route::post('/productos/{producto}/movimientos', [ProductoController::class, 'registrarMovimiento']);
    });
    Route::get('/productos/{producto}', [ProductoController::class, 'show'])->middleware('rol:administrador,recepcionista,barbero');

    // --- Registro presencial y cobro en caja (RF-08, RF-11) -----------
    Route::middleware('rol:administrador,recepcionista')->group(function () {
        Route::post('/citas/walkin', [CitaController::class, 'walkin']);
        Route::post('/ventas', [VentaController::class, 'store']);
        Route::get('/ventas', [VentaController::class, 'index']);
        Route::get('/ventas/{venta}', [VentaController::class, 'show']);
    });

    // --- Citas (RF-02, RF-06, RF-10) — cualquier usuario autenticado --
    // Cada método filtra internamente lo que corresponde según el rol
    // (ver CitaController@index): el cliente solo ve/gestiona las suyas.
    Route::get('/citas', [CitaController::class, 'index']);
    Route::get('/citas/{cita}', [CitaController::class, 'show']);
    Route::post('/citas', [CitaController::class, 'store']);
    Route::post('/citas/{cita}/cancelar', [CitaController::class, 'cancelar']);
    Route::post('/citas/{cita}/reagendar', [CitaController::class, 'reagendar']);
    Route::post('/citas/{cita}/valorar', [CitaController::class, 'valorar']);
});
