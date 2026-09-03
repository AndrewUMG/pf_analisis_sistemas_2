<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Administración de cuentas de personal y clientes por parte del administrador (RF-05). */
class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('rol')) {
            $query->where('rol', $request->string('rol'));
        }
        if ($request->filled('buscar')) {
            $texto = $request->string('buscar');
            $query->where(fn ($q) => $q->where('nombres', 'like', "%{$texto}%")
                ->orWhere('apellidos', 'like', "%{$texto}%")
                ->orWhere('email', 'like', "%{$texto}%"));
        }

        return $query->orderBy('nombres')->paginate(20);
    }

    public function show(User $usuario)
    {
        return $usuario->load('barbero');
    }

    /** El administrador crea directamente cuentas de personal (barbero, recepcionista, administrador). */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombres' => 'required|string|max:60',
            'apellidos' => 'required|string|max:60',
            'email' => 'required|email|unique:users,email',
            'telefono' => 'nullable|string|max:20|unique:users,telefono',
            'password' => 'required|string|min:8',
            'rol' => 'required|in:administrador,barbero,recepcionista,cliente',
        ]);

        return response()->json(User::create($datos), 201);
    }

    public function update(Request $request, User $usuario)
    {
        $datos = $request->validate([
            'nombres' => 'sometimes|string|max:60',
            'apellidos' => 'sometimes|string|max:60',
            'telefono' => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('users', 'telefono')->ignore($usuario->id)],
            'rol' => 'sometimes|in:administrador,barbero,recepcionista,cliente',
            'estado' => 'sometimes|in:activo,inactivo,suspendido',
        ]);

        $usuario->update($datos);

        return $usuario;
    }

    /** Suspende la cuenta en vez de borrarla, para conservar el historial de citas y ventas. */
    public function destroy(User $usuario)
    {
        $usuario->update(['estado' => 'inactivo']);
        $usuario->tokens()->delete();

        return response()->json(['mensaje' => 'Usuario desactivado.']);
    }
}
