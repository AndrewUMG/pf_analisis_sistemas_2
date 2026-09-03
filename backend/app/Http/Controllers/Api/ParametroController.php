<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParametroSistema;
use Illuminate\Http\Request;

/** Reglas de negocio configurables sin tocar código (RF-02, PANT-16). */
class ParametroController extends Controller
{
    public function index()
    {
        return ParametroSistema::orderBy('clave')->get();
    }

    public function update(Request $request, string $clave)
    {
        $datos = $request->validate([
            'valor' => 'required|string',
            'descripcion' => 'nullable|string|max:255',
        ]);

        ParametroSistema::establecer($clave, $datos['valor'], $datos['descripcion'] ?? null);

        return ParametroSistema::where('clave', $clave)->firstOrFail();
    }
}
