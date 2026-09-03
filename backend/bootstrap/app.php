<?php

use App\Exceptions\NegocioException;
use App\Http\Middleware\EnsureRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['rol' => EnsureRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Traduce las violaciones de reglas de negocio (RNF-01: sin fugas de
        // detalle técnico) a una respuesta JSON consistente para el frontend.
        $exceptions->render(function (NegocioException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'mensaje' => $e->getMessage(),
                    'detalles' => $e->detalles(),
                ], 422);
            }
        });

        $exceptions->render(function (ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'mensaje' => 'Los datos enviados no son válidos.',
                    'errores' => $e->errors(),
                ], 422);
            }
        });
    })->create();
