<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Mensajeria\ProveedorMensajeria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Autenticación y perfiles (RF-05, CU-005). Usa tokens Bearer (Sanctum) en
 * vez de sesiones, porque el frontend consumirá esta API como cliente
 * independiente (SPA o app móvil futura, RNF-05 escalabilidad).
 */
class AuthController extends Controller
{
    private const MAX_INTENTOS_FALLIDOS = 5;

    private const MINUTOS_BLOQUEO = 15;

    /** Alta de cuenta de cliente (PANT-03). Los demás roles los crea el administrador. */
    public function registro(Request $request)
    {
        $datos = $request->validate([
            'nombres' => 'required|string|max:60',
            'apellidos' => 'required|string|max:60',
            'email' => 'required|email|unique:users,email',
            'telefono' => 'nullable|string|max:20|unique:users,telefono',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $usuario = User::create([
            ...$datos,
            'password' => $datos['password'],
            'rol' => 'cliente',
        ]);

        $token = $usuario->createToken('api')->plainTextToken;

        return response()->json(['usuario' => $usuario, 'token' => $token], 201);
    }

    /** CU-005: valida credenciales y redirige según el rol asignado. */
    public function login(Request $request)
    {
        $datos = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $usuario = User::where('email', $datos['email'])->first();

        // Mensaje genérico: no revela si el fallo es del correo o la contraseña (CU-005, excepción).
        $credencialesInvalidas = fn () => ValidationException::withMessages([
            'email' => ['Las credenciales ingresadas no son correctas.'],
        ]);

        if (! $usuario) {
            throw $credencialesInvalidas();
        }

        if ($usuario->bloqueado_hasta && $usuario->bloqueado_hasta->isFuture()) {
            throw ValidationException::withMessages([
                'email' => ["Cuenta bloqueada temporalmente. Intenta de nuevo después de las {$usuario->bloqueado_hasta->format('H:i')}."],
            ]);
        }

        if ($usuario->estado !== 'activo') {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está inactiva o suspendida. Contacta al administrador.'],
            ]);
        }

        if (! Hash::check($datos['password'], $usuario->password)) {
            $intentos = $usuario->intentos_fallidos + 1;
            $usuario->update([
                'intentos_fallidos' => $intentos,
                'bloqueado_hasta' => $intentos >= self::MAX_INTENTOS_FALLIDOS
                    ? now()->addMinutes(self::MINUTOS_BLOQUEO)
                    : null,
            ]);

            throw $credencialesInvalidas();
        }

        $usuario->update(['intentos_fallidos' => 0, 'bloqueado_hasta' => null]);

        $token = $usuario->createToken('api')->plainTextToken;

        return response()->json([
            'usuario' => $usuario->load('barbero'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['mensaje' => 'Sesión finalizada.']);
    }

    public function perfil(Request $request)
    {
        return $request->user()->load('barbero');
    }

    public function actualizarPerfil(Request $request)
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'nombres' => 'sometimes|string|max:60',
            'apellidos' => 'sometimes|string|max:60',
            'telefono' => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('users', 'telefono')->ignore($usuario->id)],
            'password_actual' => 'required_with:password_nueva|string',
            'password_nueva' => 'sometimes|string|min:8|confirmed',
        ]);

        if (isset($datos['password_nueva'])) {
            if (! Hash::check($datos['password_actual'], $usuario->password)) {
                throw ValidationException::withMessages(['password_actual' => ['La contraseña actual no es correcta.']]);
            }
            $usuario->password = $datos['password_nueva'];
        }

        $usuario->fill(collect($datos)->only(['nombres', 'apellidos', 'telefono'])->all());
        $usuario->save();

        return $usuario;
    }

    /** CU-005: envía un enlace de recuperación con vigencia limitada (PANT-04). */
    public function olvidePassword(Request $request, ProveedorMensajeria $mensajeria)
    {
        $request->validate(['email' => 'required|email']);

        $usuario = User::where('email', $request->email)->first();

        // Siempre responde igual exista o no la cuenta, para no filtrar qué correos están registrados.
        if ($usuario) {
            $token = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $usuario->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            $mensajeria->enviar('correo', $usuario->email, "Tu enlace para restablecer la contraseña (válido 60 min): token={$token}");
        }

        return response()->json(['mensaje' => 'Si el correo existe, se envió un enlace de recuperación.']);
    }

    public function restablecerPassword(Request $request)
    {
        $datos = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $registro = DB::table('password_reset_tokens')->where('email', $datos['email'])->first();

        $vigente = $registro
            && Hash::check($datos['token'], $registro->token)
            && now()->diffInMinutes($registro->created_at) <= 60;

        if (! $vigente) {
            throw ValidationException::withMessages(['token' => ['El enlace es inválido o ya expiró.']]);
        }

        $usuario = User::where('email', $datos['email'])->firstOrFail();
        $usuario->update(['password' => $datos['password']]);

        DB::table('password_reset_tokens')->where('email', $datos['email'])->delete();
        $usuario->tokens()->delete(); // cierra todas las sesiones activas

        return response()->json(['mensaje' => 'Contraseña actualizada. Inicia sesión nuevamente.']);
    }
}
