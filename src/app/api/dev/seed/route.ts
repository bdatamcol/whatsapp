import { supabase } from '@/lib/supabase/server.supabase';
import { NextRequest, NextResponse } from 'next/server';

// 🔐 Proteger con una clave secreta de entorno
const SEED_SECRET = process.env.SEED_SECRET;

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-secret');

    if (secret !== SEED_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Paso 1: Insertar regiones (departamentos)
        const regions = [
            {
                id: 1,
                name: "Amazonas"
            },
            {
                id: 2,
                name: "Antioquia"
            },
            {
                id: 3,
                name: "Arauca"
            },
            {
                id: 4,
                name: "Atlántico"
            },
            {
                id: 5,
                name: "Bolívar"
            },
            {
                id: 6,
                name: "Boyacá"
            },
            {
                id: 7,
                name: "Caldas"
            },
            {
                id: 8,
                name: "Caquetá"
            },
            {
                id: 9,
                name: "Casanare"
            },
            {
                id: 10,
                name: "Cauca"
            },
            {
                id: 11,
                name: "Cesar"
            },
            {
                id: 12,
                name: "Chocó"
            },
            {
                id: 13,
                name: "Córdoba"
            },
            {
                id: 14,
                name: "Cundinamarca"
            },
            {
                id: 15,
                name: "Guainía"
            },
            {
                id: 16,
                name: "Guaviare"
            },
            {
                id: 17,
                name: "Huila"
            },
            {
                id: 18,
                name: "La Guajira"
            },
            {
                id: 19,
                name: "Magdalena"
            },
            {
                id: 20,
                name: "Meta"
            },
            {
                id: 21,
                name: "Nariño"
            },
            {
                id: 22,
                name: "Norte de Santander"
            },
            {
                id: 23,
                name: "Putumayo"
            },
            {
                id: 24,
                name: "Quindío"
            },
            {
                id: 25,
                name: "Risaralda"
            },
            {
                id: 26,
                name: "San Andrés y Providencia"
            },
            {
                id: 27,
                name: "Santander"
            },
            {
                id: 28,
                name: "Sucre"
            },
            {
                id: 29,
                name: "Tolima"
            },
            {
                id: 30,
                name: "Valle del Cauca"
            },
            {
                id: 31,
                name: "Vaupés"
            },
            {
                id: 32,
                name: "Vichada"
            }
        ];

        const { error: regionError } = await supabase
            .from('regions')
            .upsert(regions);

        if (regionError) {
            throw regionError;
        }

        // Paso 2: Insertar ciudades
        const cities = [
            {
                name: "Leticia",
                region_id: 1
            },
            {
                name: "Puerto Nariño",
                region_id: 1
            },
            {
                name: "Medellín",
                region_id: 2
            },
            {
                name: "Bello",
                region_id: 2
            },
            {
                name: "Itagüí",
                region_id: 2
            },
            {
                name: "Envigado",
                region_id: 2
            },
            {
                name: "Arauca",
                region_id: 3
            },
            {
                name: "Tame",
                region_id: 3
            },
            {
                name: "Barranquilla",
                region_id: 4
            },
            {
                name: "Soledad",
                region_id: 4
            },
            {
                name: "Malambo",
                region_id: 4
            },
            {
                name: "Cartagena",
                region_id: 5
            },
            {
                name: "Magangué",
                region_id: 5
            },
            {
                name: "Tunja",
                region_id: 6
            },
            {
                name: "Duitama",
                region_id: 6
            },
            {
                name: "Sogamoso",
                region_id: 6
            },
            {
                name: "Manizales",
                region_id: 7
            },
            {
                name: "Chinchiná",
                region_id: 7
            },
            {
                name: "Florencia",
                region_id: 8
            },
            {
                name: "Yopal",
                region_id: 9
            },
            {
                name: "Popayán",
                region_id: 10
            },
            {
                name: "Valledupar",
                region_id: 11
            },
            {
                name: "Quibdó",
                region_id: 12
            },
            {
                name: "Montería",
                region_id: 13
            },
            {
                name: "Soacha",
                region_id: 14
            },
            {
                name: "Zipaquirá",
                region_id: 14
            },
            {
                name: "Inírida",
                region_id: 15
            },
            {
                name: "San José del Guaviare",
                region_id: 16
            },
            {
                name: "Neiva",
                region_id: 17
            },
            {
                name: "Riohacha",
                region_id: 18
            },
            {
                name: "Santa Marta",
                region_id: 19
            },
            {
                name: "Villavicencio",
                region_id: 20
            },
            {
                name: "Pasto",
                region_id: 21
            },
            {
                name: "Ipiales",
                region_id: 21
            },
            {
                name: "Cúcuta",
                region_id: 22
            },
            {
                name: "Ocaña",
                region_id: 22
            },
            {
                name: "Mocoa",
                region_id: 23
            },
            {
                name: "Armenia",
                region_id: 24
            },
            {
                name: "Pereira",
                region_id: 25
            },
            {
                name: "San Andrés",
                region_id: 26
            },
            {
                name: "Bucaramanga",
                region_id: 27
            },
            {
                name: "Floridablanca",
                region_id: 27
            },
            {
                name: "Sincelejo",
                region_id: 28
            },
            {
                name: "Ibagué",
                region_id: 29
            },
            {
                name: "Cali",
                region_id: 30
            },
            {
                name: "Palmira",
                region_id: 30
            },
            {
                name: "Mitú",
                region_id: 31
            },
            {
                name: "Puerto Carreño",
                region_id: 32
            }
        ];

        const { error: cityError } = await supabase
            .from('cities')
            .upsert(cities);

        if (cityError) {
            throw cityError;
        }

        return NextResponse.json({ message: 'Seed ejecutado con éxito' });
    } catch (error) {
        console.error('[SEED ERROR]', error);
        return NextResponse.json({ error: 'Error al ejecutar el seed' }, { status: 500 });
    }
}
