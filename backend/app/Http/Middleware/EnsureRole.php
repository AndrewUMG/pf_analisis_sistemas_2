<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Control estricto de roles y permisos (RF-05). Uso en rutas:
 * ->middleware('rol:administrador,recepcionista')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        if (! $usuario || ! in_array($usuario->rol, $roles, true)) {
            return response()->json([
                'mensaje' => 'No tienes permisos para realizar esta acción.',
            ], 403);
        }

        return $next($request);
    }
}
