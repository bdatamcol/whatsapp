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
                "name": "Leticia",
                "region_id": 1
            },
            {
                "name": "Puerto Nariño",
                "region_id": 1
            },
            {
                "name": "El Encanto",
                "region_id": 1
            },
            {
                "name": "La Chorrera",
                "region_id": 1
            },
            {
                "name": "La Pedrera",
                "region_id": 1
            },
            {
                "name": "La Victoria",
                "region_id": 1
            },
            {
                "name": "Mirití-Paraná",
                "region_id": 1
            },
            {
                "name": "Puerto Alegría",
                "region_id": 1
            },
            {
                "name": "Puerto Arica",
                "region_id": 1
            },
            {
                "name": "Puerto Santander",
                "region_id": 1
            },
            {
                "name": "Tarapacá",
                "region_id": 1
            },
            {
                "name": "Medellín",
                "region_id": 2
            },
            {
                "name": "Abejorral",
                "region_id": 2
            },
            {
                "name": "Abriaquí",
                "region_id": 2
            },
            {
                "name": "Alejandría",
                "region_id": 2
            },
            {
                "name": "Amagá",
                "region_id": 2
            },
            {
                "name": "Amalfi",
                "region_id": 2
            },
            {
                "name": "Andes",
                "region_id": 2
            },
            {
                "name": "Angelópolis",
                "region_id": 2
            },
            {
                "name": "Angostura",
                "region_id": 2
            },
            {
                "name": "Anorí",
                "region_id": 2
            },
            {
                "name": "Santa Fe de Antioquia",
                "region_id": 2
            },
            {
                "name": "Anzá",
                "region_id": 2
            },
            {
                "name": "Apartadó",
                "region_id": 2
            },
            {
                "name": "Arboletes",
                "region_id": 2
            },
            {
                "name": "Argelia",
                "region_id": 2
            },
            {
                "name": "Armenia",
                "region_id": 2
            },
            {
                "name": "Barbosa",
                "region_id": 2
            },
            {
                "name": "Bello",
                "region_id": 2
            },
            {
                "name": "Belmira",
                "region_id": 2
            },
            {
                "name": "Betania",
                "region_id": 2
            },
            {
                "name": "Betulia",
                "region_id": 2
            },
            {
                "name": "Ciudad Bolívar",
                "region_id": 2
            },
            {
                "name": "Briceño",
                "region_id": 2
            },
            {
                "name": "Buriticá",
                "region_id": 2
            },
            {
                "name": "Cáceres",
                "region_id": 2
            },
            {
                "name": "Caicedo",
                "region_id": 2
            },
            {
                "name": "Caldas",
                "region_id": 2
            },
            {
                "name": "Campamento",
                "region_id": 2
            },
            {
                "name": "Cañasgordas",
                "region_id": 2
            },
            {
                "name": "Caracolí",
                "region_id": 2
            },
            {
                "name": "Caramanta",
                "region_id": 2
            },
            {
                "name": "Carepa",
                "region_id": 2
            },
            {
                "name": "El Carmen de Viboral",
                "region_id": 2
            },
            {
                "name": "Carolina del Príncipe",
                "region_id": 2
            },
            {
                "name": "Caucasia",
                "region_id": 2
            },
            {
                "name": "Chigorodó",
                "region_id": 2
            },
            {
                "name": "Cisneros",
                "region_id": 2
            },
            {
                "name": "Cocorná",
                "region_id": 2
            },
            {
                "name": "Concepción",
                "region_id": 2
            },
            {
                "name": "Concordia",
                "region_id": 2
            },
            {
                "name": "Copacabana",
                "region_id": 2
            },
            {
                "name": "Dabeiba",
                "region_id": 2
            },
            {
                "name": "Donmatías",
                "region_id": 2
            },
            {
                "name": "Ebéjico",
                "region_id": 2
            },
            {
                "name": "El Bagre",
                "region_id": 2
            },
            {
                "name": "Entrerríos",
                "region_id": 2
            },
            {
                "name": "Envigado",
                "region_id": 2
            },
            {
                "name": "Fredonia",
                "region_id": 2
            },
            {
                "name": "Frontino",
                "region_id": 2
            },
            {
                "name": "Giraldo",
                "region_id": 2
            },
            {
                "name": "Girardota",
                "region_id": 2
            },
            {
                "name": "Gómez Plata",
                "region_id": 2
            },
            {
                "name": "Granada",
                "region_id": 2
            },
            {
                "name": "Guadalupe",
                "region_id": 2
            },
            {
                "name": "Guarne",
                "region_id": 2
            },
            {
                "name": "Guatapé",
                "region_id": 2
            },
            {
                "name": "Heliconia",
                "region_id": 2
            },
            {
                "name": "Hispania",
                "region_id": 2
            },
            {
                "name": "Itagüí",
                "region_id": 2
            },
            {
                "name": "Ituango",
                "region_id": 2
            },
            {
                "name": "Jardín",
                "region_id": 2
            },
            {
                "name": "Jericó",
                "region_id": 2
            },
            {
                "name": "La Ceja",
                "region_id": 2
            },
            {
                "name": "La Estrella",
                "region_id": 2
            },
            {
                "name": "La Pintada",
                "region_id": 2
            },
            {
                "name": "La Unión",
                "region_id": 2
            },
            {
                "name": "Liborina",
                "region_id": 2
            },
            {
                "name": "Maceo",
                "region_id": 2
            },
            {
                "name": "Marinilla",
                "region_id": 2
            },
            {
                "name": "Montebello",
                "region_id": 2
            },
            {
                "name": "Murindó",
                "region_id": 2
            },
            {
                "name": "Mutatá",
                "region_id": 2
            },
            {
                "name": "Nariño",
                "region_id": 2
            },
            {
                "name": "Necoclí",
                "region_id": 2
            },
            {
                "name": "Nechí",
                "region_id": 2
            },
            {
                "name": "Olaya",
                "region_id": 2
            },
            {
                "name": "El Peñol",
                "region_id": 2
            },
            {
                "name": "Peque",
                "region_id": 2
            },
            {
                "name": "Pueblorrico",
                "region_id": 2
            },
            {
                "name": "Puerto Berrío",
                "region_id": 2
            },
            {
                "name": "Puerto Nare",
                "region_id": 2
            },
            {
                "name": "Puerto Triunfo",
                "region_id": 2
            },
            {
                "name": "Remedios",
                "region_id": 2
            },
            {
                "name": "El Retiro",
                "region_id": 2
            },
            {
                "name": "Rionegro",
                "region_id": 2
            },
            {
                "name": "Sabanalarga",
                "region_id": 2
            },
            {
                "name": "Sabaneta",
                "region_id": 2
            },
            {
                "name": "Salgar",
                "region_id": 2
            },
            {
                "name": "San Andrés de Cuerquia",
                "region_id": 2
            },
            {
                "name": "San Carlos",
                "region_id": 2
            },
            {
                "name": "San Francisco",
                "region_id": 2
            },
            {
                "name": "San Jerónimo",
                "region_id": 2
            },
            {
                "name": "San José de la Montaña",
                "region_id": 2
            },
            {
                "name": "San Juan de Urabá",
                "region_id": 2
            },
            {
                "name": "San Luis",
                "region_id": 2
            },
            {
                "name": "San Pedro de los Milagros",
                "region_id": 2
            },
            {
                "name": "San Pedro de Urabá",
                "region_id": 2
            },
            {
                "name": "San Rafael",
                "region_id": 2
            },
            {
                "name": "San Roque",
                "region_id": 2
            },
            {
                "name": "San Vicente Ferrer",
                "region_id": 2
            },
            {
                "name": "Santa Bárbara",
                "region_id": 2
            },
            {
                "name": "Santa Rosa de Osos",
                "region_id": 2
            },
            {
                "name": "Santo Domingo",
                "region_id": 2
            },
            {
                "name": "Segovia",
                "region_id": 2
            },
            {
                "name": "Sonsón",
                "region_id": 2
            },
            {
                "name": "Sopetrán",
                "region_id": 2
            },
            {
                "name": "Támesis",
                "region_id": 2
            },
            {
                "name": "Tarazá",
                "region_id": 2
            },
            {
                "name": "Tarso",
                "region_id": 2
            },
            {
                "name": "Titiribí",
                "region_id": 2
            },
            {
                "name": "Toledo",
                "region_id": 2
            },
            {
                "name": "Turbo",
                "region_id": 2
            },
            {
                "name": "Uramita",
                "region_id": 2
            },
            {
                "name": "Urrao",
                "region_id": 2
            },
            {
                "name": "Valdivia",
                "region_id": 2
            },
            {
                "name": "Valparaíso",
                "region_id": 2
            },
            {
                "name": "Vegachí",
                "region_id": 2
            },
            {
                "name": "Venecia",
                "region_id": 2
            },
            {
                "name": "Vigía del Fuerte",
                "region_id": 2
            },
            {
                "name": "Yalí",
                "region_id": 2
            },
            {
                "name": "Yarumal",
                "region_id": 2
            },
            {
                "name": "Yolombó",
                "region_id": 2
            },
            {
                "name": "Yondó",
                "region_id": 2
            },
            {
                "name": "Zaragoza",
                "region_id": 2
            },
            {
                "name": "Arauca",
                "region_id": 3
            },
            {
                "name": "Arauquita",
                "region_id": 3
            },
            {
                "name": "Cravo Norte",
                "region_id": 3
            },
            {
                "name": "Fortul",
                "region_id": 3
            },
            {
                "name": "Puerto Rondón",
                "region_id": 3
            },
            {
                "name": "Saravena",
                "region_id": 3
            },
            {
                "name": "Tame",
                "region_id": 3
            },
            {
                "name": "Barranquilla",
                "region_id": 4
            },
            {
                "name": "Baranoa",
                "region_id": 4
            },
            {
                "name": "Campo de la Cruz",
                "region_id": 4
            },
            {
                "name": "Candelaria",
                "region_id": 4
            },
            {
                "name": "Galapa",
                "region_id": 4
            },
            {
                "name": "Juan de Acosta",
                "region_id": 4
            },
            {
                "name": "Luruaco",
                "region_id": 4
            },
            {
                "name": "Malambo",
                "region_id": 4
            },
            {
                "name": "Manatí",
                "region_id": 4
            },
            {
                "name": "Palmar de Varela",
                "region_id": 4
            },
            {
                "name": "Piojó",
                "region_id": 4
            },
            {
                "name": "Polonuevo",
                "region_id": 4
            },
            {
                "name": "Ponedera",
                "region_id": 4
            },
            {
                "name": "Puerto Colombia",
                "region_id": 4
            },
            {
                "name": "Repelón",
                "region_id": 4
            },
            {
                "name": "Sabanagrande",
                "region_id": 4
            },
            {
                "name": "Sabanalarga",
                "region_id": 4
            },
            {
                "name": "Santa Lucía",
                "region_id": 4
            },
            {
                "name": "Santo Tomás",
                "region_id": 4
            },
            {
                "name": "Soledad",
                "region_id": 4
            },
            {
                "name": "Suan",
                "region_id": 4
            },
            {
                "name": "Tubará",
                "region_id": 4
            },
            {
                "name": "Usiacurí",
                "region_id": 4
            },
            {
                "name": "Cartagena de Indias",
                "region_id": 5
            },
            {
                "name": "Achí",
                "region_id": 5
            },
            {
                "name": "Altos del Rosario",
                "region_id": 5
            },
            {
                "name": "Arenal",
                "region_id": 5
            },
            {
                "name": "Arjona",
                "region_id": 5
            },
            {
                "name": "Arroyohondo",
                "region_id": 5
            },
            {
                "name": "Barranco de Loba",
                "region_id": 5
            },
            {
                "name": "Calamar",
                "region_id": 5
            },
            {
                "name": "Cantagallo",
                "region_id": 5
            },
            {
                "name": "Cicuco",
                "region_id": 5
            },
            {
                "name": "Clemencia",
                "region_id": 5
            },
            {
                "name": "Córdoba",
                "region_id": 5
            },
            {
                "name": "El Carmen de Bolívar",
                "region_id": 5
            },
            {
                "name": "El Guamo",
                "region_id": 5
            },
            {
                "name": "Hatillo de Loba",
                "region_id": 5
            },
            {
                "name": "Magangué",
                "region_id": 5
            },
            {
                "name": "Mahates",
                "region_id": 5
            },
            {
                "name": "Margarita",
                "region_id": 5
            },
            {
                "name": "María La Baja",
                "region_id": 5
            },
            {
                "name": "Montecristo",
                "region_id": 5
            },
            {
                "name": "Mompós",
                "region_id": 5
            },
            {
                "name": "Norosí",
                "region_id": 5
            },
            {
                "name": "Pasacaballos",
                "region_id": 5
            },
            {
                "name": "Pinillos",
                "region_id": 5
            },
            {
                "name": "Regidor",
                "region_id": 5
            },
            {
                "name": "Río Viejo",
                "region_id": 5
            },
            {
                "name": "San Cristóbal",
                "region_id": 5
            },
            {
                "name": "San Estanislao",
                "region_id": 5
            },
            {
                "name": "San Fernando",
                "region_id": 5
            },
            {
                "name": "San Jacinto",
                "region_id": 5
            },
            {
                "name": "San Jacinto del Cauca",
                "region_id": 5
            },
            {
                "name": "San Juan Nepomuceno",
                "region_id": 5
            },
            {
                "name": "San Martín de Loba",
                "region_id": 5
            },
            {
                "name": "San Pablo",
                "region_id": 5
            },
            {
                "name": "Santa Catalina",
                "region_id": 5
            },
            {
                "name": "Santa Rosa",
                "region_id": 5
            },
            {
                "name": "Santa Rosa del Sur",
                "region_id": 5
            },
            {
                "name": "Simití",
                "region_id": 5
            },
            {
                "name": "Soplaviento",
                "region_id": 5
            },
            {
                "name": "Talaigua Nuevo",
                "region_id": 5
            },
            {
                "name": "Tiquisio",
                "region_id": 5
            },
            {
                "name": "Turbaco",
                "region_id": 5
            },
            {
                "name": "Turbaná",
                "region_id": 5
            },
            {
                "name": "Villanueva",
                "region_id": 5
            },
            {
                "name": "Zambrano",
                "region_id": 5
            },
            {
                "name": "Tunja",
                "region_id": 6
            },
            {
                "name": "Almeida",
                "region_id": 6
            },
            {
                "name": "Aquitania",
                "region_id": 6
            },
            {
                "name": "Arcabuco",
                "region_id": 6
            },
            {
                "name": "Belén",
                "region_id": 6
            },
            {
                "name": "Berbeo",
                "region_id": 6
            },
            {
                "name": "Betéitiva",
                "region_id": 6
            },
            {
                "name": "Boavita",
                "region_id": 6
            },
            {
                "name": "Boyacá",
                "region_id": 6
            },
            {
                "name": "Briceño",
                "region_id": 6
            },
            {
                "name": "Buenavista",
                "region_id": 6
            },
            {
                "name": "Busbanzá",
                "region_id": 6
            },
            {
                "name": "Caldas",
                "region_id": 6
            },
            {
                "name": "Campohermoso",
                "region_id": 6
            },
            {
                "name": "Cerinza",
                "region_id": 6
            },
            {
                "name": "Chinavita",
                "region_id": 6
            },
            {
                "name": "Chiquinquirá",
                "region_id": 6
            },
            {
                "name": "Chíquiza",
                "region_id": 6
            },
            {
                "name": "Chiscas",
                "region_id": 6
            },
            {
                "name": "Chita",
                "region_id": 6
            },
            {
                "name": "Chitaraque",
                "region_id": 6
            },
            {
                "name": "Chivatá",
                "region_id": 6
            },
            {
                "name": "Ciénega",
                "region_id": 6
            },
            {
                "name": "Cómbita",
                "region_id": 6
            },
            {
                "name": "Coper",
                "region_id": 6
            },
            {
                "name": "Corrales",
                "region_id": 6
            },
            {
                "name": "Covarachía",
                "region_id": 6
            },
            {
                "name": "Cubará",
                "region_id": 6
            },
            {
                "name": "Cucaita",
                "region_id": 6
            },
            {
                "name": "Cuítiva",
                "region_id": 6
            },
            {
                "name": "Duitama",
                "region_id": 6
            },
            {
                "name": "El Cocuy",
                "region_id": 6
            },
            {
                "name": "El Espino",
                "region_id": 6
            },
            {
                "name": "Firavitoba",
                "region_id": 6
            },
            {
                "name": "Floresta",
                "region_id": 6
            },
            {
                "name": "Gachantivá",
                "region_id": 6
            },
            {
                "name": "Gámeza",
                "region_id": 6
            },
            {
                "name": "Garagoa",
                "region_id": 6
            },
            {
                "name": "Guacamayas",
                "region_id": 6
            },
            {
                "name": "Guateque",
                "region_id": 6
            },
            {
                "name": "Guayatá",
                "region_id": 6
            },
            {
                "name": "Güicán de la Sierra",
                "region_id": 6
            },
            {
                "name": "Iza",
                "region_id": 6
            },
            {
                "name": "Jenesano",
                "region_id": 6
            },
            {
                "name": "Jericó",
                "region_id": 6
            },
            {
                "name": "La Capilla",
                "region_id": 6
            },
            {
                "name": "La Uvita",
                "region_id": 6
            },
            {
                "name": "Villa de Leyva",
                "region_id": 6
            },
            {
                "name": "Labranzagrande",
                "region_id": 6
            },
            {
                "name": "Macanal",
                "region_id": 6
            },
            {
                "name": "Maripí",
                "region_id": 6
            },
            {
                "name": "Miraflores",
                "region_id": 6
            },
            {
                "name": "Mongua",
                "region_id": 6
            },
            {
                "name": "Monguí",
                "region_id": 6
            },
            {
                "name": "Moniquirá",
                "region_id": 6
            },
            {
                "name": "Motavita",
                "region_id": 6
            },
            {
                "name": "Muzo",
                "region_id": 6
            },
            {
                "name": "Nobsa",
                "region_id": 6
            },
            {
                "name": "Nuevo Colón",
                "region_id": 6
            },
            {
                "name": "Oicatá",
                "region_id": 6
            },
            {
                "name": "Otanche",
                "region_id": 6
            },
            {
                "name": "Pachavita",
                "region_id": 6
            },
            {
                "name": "Páez",
                "region_id": 6
            },
            {
                "name": "Paipa",
                "region_id": 6
            },
            {
                "name": "Pajarito",
                "region_id": 6
            },
            {
                "name": "Panqueba",
                "region_id": 6
            },
            {
                "name": "Pauna",
                "region_id": 6
            },
            {
                "name": "Paya",
                "region_id": 6
            },
            {
                "name": "Paz de Río",
                "region_id": 6
            },
            {
                "name": "Pesca",
                "region_id": 6
            },
            {
                "name": "Pisba",
                "region_id": 6
            },
            {
                "name": "Puerto Boyacá",
                "region_id": 6
            },
            {
                "name": "Quípama",
                "region_id": 6
            },
            {
                "name": "Ramiriquí",
                "region_id": 6
            },
            {
                "name": "Ráquira",
                "region_id": 6
            },
            {
                "name": "Rondón",
                "region_id": 6
            },
            {
                "name": "Saboyá",
                "region_id": 6
            },
            {
                "name": "Sáchica",
                "region_id": 6
            },
            {
                "name": "Samacá",
                "region_id": 6
            },
            {
                "name": "San Eduardo",
                "region_id": 6
            },
            {
                "name": "San José de Pare",
                "region_id": 6
            },
            {
                "name": "San Luis de Gaceno",
                "region_id": 6
            },
            {
                "name": "San Mateo",
                "region_id": 6
            },
            {
                "name": "San Miguel de Sema",
                "region_id": 6
            },
            {
                "name": "San Pablo de Borbur",
                "region_id": 6
            },
            {
                "name": "Santa María",
                "region_id": 6
            },
            {
                "name": "Santa Rosa de Viterbo",
                "region_id": 6
            },
            {
                "name": "Santa Sofía",
                "region_id": 6
            },
            {
                "name": "Santana",
                "region_id": 6
            },
            {
                "name": "Sativanorte",
                "region_id": 6
            },
            {
                "name": "Sativasur",
                "region_id": 6
            },
            {
                "name": "Siachoque",
                "region_id": 6
            },
            {
                "name": "Soatá",
                "region_id": 6
            },
            {
                "name": "Socha",
                "region_id": 6
            },
            {
                "name": "Socotá",
                "region_id": 6
            },
            {
                "name": "Sogamoso",
                "region_id": 6
            },
            {
                "name": "Somondoco",
                "region_id": 6
            },
            {
                "name": "Sora",
                "region_id": 6
            },
            {
                "name": "Soracá",
                "region_id": 6
            },
            {
                "name": "Sotaquirá",
                "region_id": 6
            },
            {
                "name": "Susacón",
                "region_id": 6
            },
            {
                "name": "Sutamarchán",
                "region_id": 6
            },
            {
                "name": "Sutatenza",
                "region_id": 6
            },
            {
                "name": "Tasco",
                "region_id": 6
            },
            {
                "name": "Tenza",
                "region_id": 6
            },
            {
                "name": "Tibaná",
                "region_id": 6
            },
            {
                "name": "Tinjacá",
                "region_id": 6
            },
            {
                "name": "Tipacoque",
                "region_id": 6
            },
            {
                "name": "Toca",
                "region_id": 6
            },
            {
                "name": "Togüí",
                "region_id": 6
            },
            {
                "name": "Tópaga",
                "region_id": 6
            },
            {
                "name": "Tota",
                "region_id": 6
            },
            {
                "name": "Tununguá",
                "region_id": 6
            },
            {
                "name": "Turmequé",
                "region_id": 6
            },
            {
                "name": "Tutazá",
                "region_id": 6
            },
            {
                "name": "Úmbita",
                "region_id": 6
            },
            {
                "name": "Ventaquemada",
                "region_id": 6
            },
            {
                "name": "Viracachá",
                "region_id": 6
            },
            {
                "name": "Zetaquira",
                "region_id": 6
            },
            {
                "name": "Manizales",
                "region_id": 7
            },
            {
                "name": "Aguadas",
                "region_id": 7
            },
            {
                "name": "Anserma",
                "region_id": 7
            },
            {
                "name": "Aranzazu",
                "region_id": 7
            },
            {
                "name": "Belalcázar",
                "region_id": 7
            },
            {
                "name": "Chinchiná",
                "region_id": 7
            },
            {
                "name": "Filadelfia",
                "region_id": 7
            },
            {
                "name": "La Dorada",
                "region_id": 7
            },
            {
                "name": "La Merced",
                "region_id": 7
            },
            {
                "name": "Marmato",
                "region_id": 7
            },
            {
                "name": "Marquetalia",
                "region_id": 7
            },
            {
                "name": "Marulanda",
                "region_id": 7
            },
            {
                "name": "Neira",
                "region_id": 7
            },
            {
                "name": "Norcasia",
                "region_id": 7
            },
            {
                "name": "Pácora",
                "region_id": 7
            },
            {
                "name": "Palestina",
                "region_id": 7
            },
            {
                "name": "Pensilvania",
                "region_id": 7
            },
            {
                "name": "Riosucio",
                "region_id": 7
            },
            {
                "name": "Risaralda",
                "region_id": 7
            },
            {
                "name": "Salamina",
                "region_id": 7
            },
            {
                "name": "Samaná",
                "region_id": 7
            },
            {
                "name": "San José",
                "region_id": 7
            },
            {
                "name": "Supía",
                "region_id": 7
            },
            {
                "name": "Victoria",
                "region_id": 7
            },
            {
                "name": "Villamaría",
                "region_id": 7
            },
            {
                "name": "Viterbo",
                "region_id": 7
            },
            {
                "name": "Florencia",
                "region_id": 8
            },
            {
                "name": "Albania",
                "region_id": 8
            },
            {
                "name": "Belén de los Andaquíes",
                "region_id": 8
            },
            {
                "name": "Cartagena del Chairá",
                "region_id": 8
            },
            {
                "name": "Curillo",
                "region_id": 8
            },
            {
                "name": "El Doncello",
                "region_id": 8
            },
            {
                "name": "El Paujil",
                "region_id": 8
            },
            {
                "name": "La Montañita",
                "region_id": 8
            },
            {
                "name": "Milán",
                "region_id": 8
            },
            {
                "name": "Morelia",
                "region_id": 8
            },
            {
                "name": "Puerto Rico",
                "region_id": 8
            },
            {
                "name": "San José del Fragua",
                "region_id": 8
            },
            {
                "name": "San Vicente del Caguán",
                "region_id": 8
            },
            {
                "name": "Solano",
                "region_id": 8
            },
            {
                "name": "Solita",
                "region_id": 8
            },
            {
                "name": "Valparaíso",
                "region_id": 8
            },
            {
                "name": "Yopal",
                "region_id": 9
            },
            {
                "name": "Aguazul",
                "region_id": 9
            },
            {
                "name": "Chámeza",
                "region_id": 9
            },
            {
                "name": "Hato Corozal",
                "region_id": 9
            },
            {
                "name": "La Salina",
                "region_id": 9
            },
            {
                "name": "Maní",
                "region_id": 9
            },
            {
                "name": "Monterrey",
                "region_id": 9
            },
            {
                "name": "Nunchía",
                "region_id": 9
            },
            {
                "name": "Orocué",
                "region_id": 9
            },
            {
                "name": "Paz de Ariporo",
                "region_id": 9
            },
            {
                "name": "Pore",
                "region_id": 9
            },
            {
                "name": "Recetor",
                "region_id": 9
            },
            {
                "name": "Sabanalarga",
                "region_id": 9
            },
            {
                "name": "Sácama",
                "region_id": 9
            },
            {
                "name": "San Luis de Gaceno",
                "region_id": 9
            },
            {
                "name": "Tauramena",
                "region_id": 9
            },
            {
                "name": "Trinidad",
                "region_id": 9
            },
            {
                "name": "Villanueva",
                "region_id": 9
            },
            {
                "name": "Popayán",
                "region_id": 10
            },
            {
                "name": "Aguazul",
                "region_id": 10
            },
            {
                "name": "Arboleda",
                "region_id": 10
            },
            {
                "name": "Balboa",
                "region_id": 10
            },
            {
                "name": "Bolívar",
                "region_id": 10
            },
            {
                "name": "Buenos Aires",
                "region_id": 10
            },
            {
                "name": "Cajibío",
                "region_id": 10
            },
            {
                "name": "Caloto",
                "region_id": 10
            },
            {
                "name": "Corinto",
                "region_id": 10
            },
            {
                "name": "El Tambo",
                "region_id": 10
            },
            {
                "name": "Florencia",
                "region_id": 10
            },
            {
                "name": "Guachené",
                "region_id": 10
            },
            {
                "name": "Guapí",
                "region_id": 10
            },
            {
                "name": "Inzá",
                "region_id": 10
            },
            {
                "name": "Jambaló",
                "region_id": 10
            },
            {
                "name": "La Sierra",
                "region_id": 10
            },
            {
                "name": "La Vega",
                "region_id": 10
            },
            {
                "name": "López de Micay",
                "region_id": 10
            },
            {
                "name": "Mercaderes",
                "region_id": 10
            },
            {
                "name": "Miranda",
                "region_id": 10
            },
            {
                "name": "Morales",
                "region_id": 10
            },
            {
                "name": "Padilla",
                "region_id": 10
            },
            {
                "name": "Patía (El Bordo)",
                "region_id": 10
            },
            {
                "name": "Piamonte",
                "region_id": 10
            },
            {
                "name": "Piendamó-Tunía",
                "region_id": 10
            },
            {
                "name": "Puerto Tejada",
                "region_id": 10
            },
            {
                "name": "Puracé (Coconuco)",
                "region_id": 10
            },
            {
                "name": "Rosas",
                "region_id": 10
            },
            {
                "name": "San Sebastián",
                "region_id": 10
            },
            {
                "name": "Santander de Quilichao",
                "region_id": 10
            },
            {
                "name": "Santa Rosa",
                "region_id": 10
            },
            {
                "name": "Silvia",
                "region_id": 10
            },
            {
                "name": "Suárez",
                "region_id": 10
            },
            {
                "name": "Sotara (Paispamba)",
                "region_id": 10
            },
            {
                "name": "Timbío",
                "region_id": 10
            },
            {
                "name": "Timbiquí",
                "region_id": 10
            },
            {
                "name": "Toribío",
                "region_id": 10
            },
            {
                "name": "Totoro",
                "region_id": 10
            },
            {
                "name": "Villa Rica",
                "region_id": 10
            },
            {
                "name": "Valledupar",
                "region_id": 11
            },
            {
                "name": "Aguachica",
                "region_id": 11
            },
            {
                "name": "Agustín Codazzi",
                "region_id": 11
            },
            {
                "name": "Astrea",
                "region_id": 11
            },
            {
                "name": "Becerril",
                "region_id": 11
            },
            {
                "name": "Bosconia",
                "region_id": 11
            },
            {
                "name": "Chimichagua",
                "region_id": 11
            },
            {
                "name": "Chiriguaná",
                "region_id": 11
            },
            {
                "name": "Curumaní",
                "region_id": 11
            },
            {
                "name": "El Copey",
                "region_id": 11
            },
            {
                "name": "El Paso",
                "region_id": 11
            },
            {
                "name": "Gamarra",
                "region_id": 11
            },
            {
                "name": "González",
                "region_id": 11
            },
            {
                "name": "La Gloria",
                "region_id": 11
            },
            {
                "name": "La Jagua de Ibirico",
                "region_id": 11
            },
            {
                "name": "La Paz",
                "region_id": 11
            },
            {
                "name": "Manaure Balcón del Cesar",
                "region_id": 11
            },
            {
                "name": "Pailitas",
                "region_id": 11
            },
            {
                "name": "Pelaya",
                "region_id": 11
            },
            {
                "name": "Pueblo Bello",
                "region_id": 11
            },
            {
                "name": "Río de Oro",
                "region_id": 11
            },
            {
                "name": "San Alberto",
                "region_id": 11
            },
            {
                "name": "San Diego",
                "region_id": 11
            },
            {
                "name": "San Martín",
                "region_id": 11
            },
            {
                "name": "Tamalameque",
                "region_id": 11
            },
            {
                "name": "Quibdó",
                "region_id": 12
            },
            {
                "name": "Acandí",
                "region_id": 12
            },
            {
                "name": "Alto Baudó (Pie de Pató)",
                "region_id": 12
            },
            {
                "name": "Bagadó",
                "region_id": 12
            },
            {
                "name": "Bahía Solano (Muttis)",
                "region_id": 12
            },
            {
                "name": "Bajo Baudó (Pizarro)",
                "region_id": 12
            },
            {
                "name": "Bojayá (Bellavista)",
                "region_id": 12
            },
            {
                "name": "El Cantón del San Pablo (Managrú)",
                "region_id": 12
            },
            {
                "name": "Carmen del Darién (Curbaradó)",
                "region_id": 12
            },
            {
                "name": "Cértegui",
                "region_id": 12
            },
            {
                "name": "Condoto",
                "region_id": 12
            },
            {
                "name": "El Carmen de Atrato",
                "region_id": 12
            },
            {
                "name": "Istmina",
                "region_id": 12
            },
            {
                "name": "Juradó",
                "region_id": 12
            },
            {
                "name": "Lloró",
                "region_id": 12
            },
            {
                "name": "Medio Atrato (Beté)",
                "region_id": 12
            },
            {
                "name": "Medio Baudó (Puerto Meluk)",
                "region_id": 12
            },
            {
                "name": "Medio San Juan (Andagoya)",
                "region_id": 12
            },
            {
                "name": "Nóvita",
                "region_id": 12
            },
            {
                "name": "Nuquí",
                "region_id": 12
            },
            {
                "name": "Río Iró (Santa Rita)",
                "region_id": 12
            },
            {
                "name": "Río Quito (Paimadó)",
                "region_id": 12
            },
            {
                "name": "Riosucio",
                "region_id": 12
            },
            {
                "name": "San José del Palmar",
                "region_id": 12
            },
            {
                "name": "Sipí",
                "region_id": 12
            },
            {
                "name": "Tadó",
                "region_id": 12
            },
            {
                "name": "Unguía",
                "region_id": 12
            },
            {
                "name": "Unión Panamericana (Ánimas)",
                "region_id": 12
            },
            {
                "name": "Montería",
                "region_id": 13
            },
            {
                "name": "Ayapel",
                "region_id": 13
            },
            {
                "name": "Buenavista",
                "region_id": 13
            },
            {
                "name": "Canalete",
                "region_id": 13
            },
            {
                "name": "Cereté",
                "region_id": 13
            },
            {
                "name": "Chimá",
                "region_id": 13
            },
            {
                "name": "Chinú",
                "region_id": 13
            },
            {
                "name": "Ciénaga de Oro",
                "region_id": 13
            },
            {
                "name": "Cotorra",
                "region_id": 13
            },
            {
                "name": "La Apartada",
                "region_id": 13
            },
            {
                "name": "Lorica",
                "region_id": 13
            },
            {
                "name": "Los Córdobas",
                "region_id": 13
            },
            {
                "name": "Momil",
                "region_id": 13
            },
            {
                "name": "Montelíbano",
                "region_id": 13
            },
            {
                "name": "Moñitos",
                "region_id": 13
            },
            {
                "name": "Planeta Rica",
                "region_id": 13
            },
            {
                "name": "Pueblo Nuevo",
                "region_id": 13
            },
            {
                "name": "Puerto Escondido",
                "region_id": 13
            },
            {
                "name": "Puerto Libertador",
                "region_id": 13
            },
            {
                "name": "Sahagún",
                "region_id": 13
            },
            {
                "name": "San Andrés de Sotavento",
                "region_id": 13
            },
            {
                "name": "San Antero",
                "region_id": 13
            },
            {
                "name": "San Bernardo del Viento",
                "region_id": 13
            },
            {
                "name": "San Carlos",
                "region_id": 13
            },
            {
                "name": "San Pelayo",
                "region_id": 13
            },
            {
                "name": "Tierralta",
                "region_id": 13
            },
            {
                "name": "Tuchín",
                "region_id": 13
            },
            {
                "name": "Valencia",
                "region_id": 13
            },
            {
                "name": "Bogotá D.C.",
                "region_id": 14
            },
            {
                "name": "Agua de Dios",
                "region_id": 14
            },
            {
                "name": "Albán",
                "region_id": 14
            },
            {
                "name": "Anapoima",
                "region_id": 14
            },
            {
                "name": "Anolaima",
                "region_id": 14
            },
            {
                "name": "Apulo",
                "region_id": 14
            },
            {
                "name": "Arbeláez",
                "region_id": 14
            },
            {
                "name": "Beltrán",
                "region_id": 14
            },
            {
                "name": "Bituima",
                "region_id": 14
            },
            {
                "name": "Bojacá",
                "region_id": 14
            },
            {
                "name": "Cabrera",
                "region_id": 14
            },
            {
                "name": "Cajicá",
                "region_id": 14
            },
            {
                "name": "Caparrapí",
                "region_id": 14
            },
            {
                "name": "Cáqueza",
                "region_id": 14
            },
            {
                "name": "Carmen de Carupa",
                "region_id": 14
            },
            {
                "name": "Chaguaní",
                "region_id": 14
            },
            {
                "name": "Chía",
                "region_id": 14
            },
            {
                "name": "Chipaque",
                "region_id": 14
            },
            {
                "name": "Choachí",
                "region_id": 14
            },
            {
                "name": "Chocontá",
                "region_id": 14
            },
            {
                "name": "Cogua",
                "region_id": 14
            },
            {
                "name": "Cota",
                "region_id": 14
            },
            {
                "name": "Cucunubá",
                "region_id": 14
            },
            {
                "name": "El Colegio",
                "region_id": 14
            },
            {
                "name": "El Peñón",
                "region_id": 14
            },
            {
                "name": "El Rosal",
                "region_id": 14
            },
            {
                "name": "Fúquene",
                "region_id": 14
            },
            {
                "name": "Facatativá",
                "region_id": 14
            },
            {
                "name": "Fomeque",
                "region_id": 14
            },
            {
                "name": "Fosca",
                "region_id": 14
            },
            {
                "name": "Funza",
                "region_id": 14
            },
            {
                "name": "Fúquene",
                "region_id": 14
            },
            {
                "name": "Fusagasugá",
                "region_id": 14
            },
            {
                "name": "Gachalá",
                "region_id": 14
            },
            {
                "name": "Gachancipá",
                "region_id": 14
            },
            {
                "name": "Gachetá",
                "region_id": 14
            },
            {
                "name": "Gama",
                "region_id": 14
            },
            {
                "name": "Girardot",
                "region_id": 14
            },
            {
                "name": "Granada",
                "region_id": 14
            },
            {
                "name": "Guachetá",
                "region_id": 14
            },
            {
                "name": "Guaduas",
                "region_id": 14
            },
            {
                "name": "Guasca",
                "region_id": 14
            },
            {
                "name": "Guataquí",
                "region_id": 14
            },
            {
                "name": "Guatavita",
                "region_id": 14
            },
            {
                "name": "Guayabal de Síquima",
                "region_id": 14
            },
            {
                "name": "Guayaná",
                "region_id": 14
            },
            {
                "name": "Gutiérrez",
                "region_id": 14
            },
            {
                "name": "Jerusalén",
                "region_id": 14
            },
            {
                "name": "La Calera",
                "region_id": 14
            },
            {
                "name": "La Mesa",
                "region_id": 14
            },
            {
                "name": "La Palma",
                "region_id": 14
            },
            {
                "name": "La Peña",
                "region_id": 14
            },
            {
                "name": "La Vega",
                "region_id": 14
            },
            {
                "name": "Lenguazaque",
                "region_id": 14
            },
            {
                "name": "Macheta",
                "region_id": 14
            },
            {
                "name": "Madrid",
                "region_id": 14
            },
            {
                "name": "Manta",
                "region_id": 14
            },
            {
                "name": "Medina",
                "region_id": 14
            },
            {
                "name": "Mosquera",
                "region_id": 14
            },
            {
                "name": "Nariño",
                "region_id": 14
            },
            {
                "name": "Nemocón",
                "region_id": 14
            },
            {
                "name": "Nilo",
                "region_id": 14
            },
            {
                "name": "Nimaima",
                "region_id": 14
            },
            {
                "name": "Nocaima",
                "region_id": 14
            },
            {
                "name": "Pacho",
                "region_id": 14
            },
            {
                "name": "Paime",
                "region_id": 14
            },
            {
                "name": "Pandi",
                "region_id": 14
            },
            {
                "name": "Paratebueno",
                "region_id": 14
            },
            {
                "name": "Pasca",
                "region_id": 14
            },
            {
                "name": "Puerto Salgar",
                "region_id": 14
            },
            {
                "name": "Pulí",
                "region_id": 14
            },
            {
                "name": "Quebradanegra",
                "region_id": 14
            },
            {
                "name": "Quetame",
                "region_id": 14
            },
            {
                "name": "Quipile",
                "region_id": 14
            },
            {
                "name": "Ricaurte",
                "region_id": 14
            },
            {
                "name": "San Antonio del Tequendama",
                "region_id": 14
            },
            {
                "name": "San Bernardo",
                "region_id": 14
            },
            {
                "name": "San Cayetano",
                "region_id": 14
            },
            {
                "name": "San Francisco",
                "region_id": 14
            },
            {
                "name": "San Juan de Río Seco",
                "region_id": 14
            },
            {
                "name": "Sasaima",
                "region_id": 14
            },
            {
                "name": "Sesquilé",
                "region_id": 14
            },
            {
                "name": "Sibaté",
                "region_id": 14
            },
            {
                "name": "Silvania",
                "region_id": 14
            },
            {
                "name": "Simijaca",
                "region_id": 14
            },
            {
                "name": "Soacha",
                "region_id": 14
            },
            {
                "name": "Sopó",
                "region_id": 14
            },
            {
                "name": "Subachoque",
                "region_id": 14
            },
            {
                "name": "Suesca",
                "region_id": 14
            },
            {
                "name": "Supatá",
                "region_id": 14
            },
            {
                "name": "Susa",
                "region_id": 14
            },
            {
                "name": "Sutatausa",
                "region_id": 14
            },
            {
                "name": "Tabio",
                "region_id": 14
            },
            {
                "name": "Tausa",
                "region_id": 14
            },
            {
                "name": "Tena",
                "region_id": 14
            },
            {
                "name": "Tenjo",
                "region_id": 14
            },
            {
                "name": "Tibacuy",
                "region_id": 14
            },
            {
                "name": "Tibirita",
                "region_id": 14
            },
            {
                "name": "Tocaima",
                "region_id": 14
            },
            {
                "name": "Tocancipá",
                "region_id": 14
            },
            {
                "name": "Topaipí",
                "region_id": 14
            },
            {
                "name": "Ubalá",
                "region_id": 14
            },
            {
                "name": "Ubaque",
                "region_id": 14
            },
            {
                "name": "Une",
                "region_id": 14
            },
            {
                "name": "Útica",
                "region_id": 14
            },
            {
                "name": "Venecia",
                "region_id": 14
            },
            {
                "name": "Vergara",
                "region_id": 14
            },
            {
                "name": "Vianí",
                "region_id": 14
            },
            {
                "name": "Villagómez",
                "region_id": 14
            },
            {
                "name": "Villapinzón",
                "region_id": 14
            },
            {
                "name": "Villeta",
                "region_id": 14
            },
            {
                "name": "Viotá",
                "region_id": 14
            },
            {
                "name": "Yacopí",
                "region_id": 14
            },
            {
                "name": "Zipacón",
                "region_id": 14
            },
            {
                "name": "Zipaquirá",
                "region_id": 14
            },
            {
                "name": "Inírida",
                "region_id": 15
            },
            {
                "name": "Barranco Minas",
                "region_id": 15
            },
            {
                "name": "Cacahual",
                "region_id": 15
            },
            {
                "name": "La Guadalupe",
                "region_id": 15
            },
            {
                "name": "Mapiripana",
                "region_id": 15
            },
            {
                "name": "Morichal Nuevo",
                "region_id": 15
            },
            {
                "name": "Pana Pana",
                "region_id": 15
            },
            {
                "name": "Puerto Colombia",
                "region_id": 15
            },
            {
                "name": "San Felipe",
                "region_id": 15
            },
            {
                "name": "San José del Guaviare",
                "region_id": 16
            },
            {
                "name": "Calamar",
                "region_id": 16
            },
            {
                "name": "El Retorno",
                "region_id": 16
            },
            {
                "name": "Miraflores",
                "region_id": 16
            },
            {
                "name": "Neiva",
                "region_id": 17
            },
            {
                "name": "Acevedo",
                "region_id": 17
            },
            {
                "name": "Agrado",
                "region_id": 17
            },
            {
                "name": "Aipe",
                "region_id": 17
            },
            {
                "name": "Algeciras",
                "region_id": 17
            },
            {
                "name": "Altamira",
                "region_id": 17
            },
            {
                "name": "Baraya",
                "region_id": 17
            },
            {
                "name": "Campoalegre",
                "region_id": 17
            },
            {
                "name": "Colombia",
                "region_id": 17
            },
            {
                "name": "Elías",
                "region_id": 17
            },
            {
                "name": "Garzón",
                "region_id": 17
            },
            {
                "name": "Gigante",
                "region_id": 17
            },
            {
                "name": "Guadalupe",
                "region_id": 17
            },
            {
                "name": "Hobo",
                "region_id": 17
            },
            {
                "name": "Íquira",
                "region_id": 17
            },
            {
                "name": "Isnos",
                "region_id": 17
            },
            {
                "name": "La Argentina",
                "region_id": 17
            },
            {
                "name": "La Plata",
                "region_id": 17
            },
            {
                "name": "Nátaga",
                "region_id": 17
            },
            {
                "name": "Oporapa",
                "region_id": 17
            },
            {
                "name": "Paicol",
                "region_id": 17
            },
            {
                "name": "Palermo",
                "region_id": 17
            },
            {
                "name": "Palestina",
                "region_id": 17
            },
            {
                "name": "Pital",
                "region_id": 17
            },
            {
                "name": "Pitalito",
                "region_id": 17
            },
            {
                "name": "Rivera",
                "region_id": 17
            },
            {
                "name": "Saladoblanco",
                "region_id": 17
            },
            {
                "name": "San Agustín",
                "region_id": 17
            },
            {
                "name": "Santa María",
                "region_id": 17
            },
            {
                "name": "Suaza",
                "region_id": 17
            },
            {
                "name": "Tarqui",
                "region_id": 17
            },
            {
                "name": "Tello",
                "region_id": 17
            },
            {
                "name": "Teruel",
                "region_id": 17
            },
            {
                "name": "Tesalia",
                "region_id": 17
            },
            {
                "name": "Timaná",
                "region_id": 17
            },
            {
                "name": "Villavieja",
                "region_id": 17
            },
            {
                "name": "Yaguará",
                "region_id": 17
            },
            {
                "name": "Riohacha",
                "region_id": 18
            },
            {
                "name": "Albania",
                "region_id": 18
            },
            {
                "name": "Barrancas",
                "region_id": 18
            },
            {
                "name": "Dibulla",
                "region_id": 18
            },
            {
                "name": "Distracción",
                "region_id": 18
            },
            {
                "name": "El Molino",
                "region_id": 18
            },
            {
                "name": "Fonseca",
                "region_id": 18
            },
            {
                "name": "Hatonuevo",
                "region_id": 18
            },
            {
                "name": "Maicao",
                "region_id": 18
            },
            {
                "name": "Manaure",
                "region_id": 18
            },
            {
                "name": "San Juan del Cesar",
                "region_id": 18
            },
            {
                "name": "Uribia",
                "region_id": 18
            },
            {
                "name": "Urumita",
                "region_id": 18
            },
            {
                "name": "Villanueva",
                "region_id": 18
            },
            {
                "name": "Santa Marta",
                "region_id": 19
            },
            {
                "name": "Algarrobo",
                "region_id": 19
            },
            {
                "name": "Aracataca",
                "region_id": 19
            },
            {
                "name": "Ariguaní (El Difícil)",
                "region_id": 19
            },
            {
                "name": "Cerro de San Antonio",
                "region_id": 19
            },
            {
                "name": "Chibolo",
                "region_id": 19
            },
            {
                "name": "Ciénaga",
                "region_id": 19
            },
            {
                "name": "Concordia",
                "region_id": 19
            },
            {
                "name": "El Banco",
                "region_id": 19
            },
            {
                "name": "El Piñón",
                "region_id": 19
            },
            {
                "name": "El Retén",
                "region_id": 19
            },
            {
                "name": "Fundación",
                "region_id": 19
            },
            {
                "name": "Guamal",
                "region_id": 19
            },
            {
                "name": "Nueva Granada",
                "region_id": 19
            },
            {
                "name": "Pedraza",
                "region_id": 19
            },
            {
                "name": "Pivijay",
                "region_id": 19
            },
            {
                "name": "Plato",
                "region_id": 19
            },
            {
                "name": "Puebloviejo",
                "region_id": 19
            },
            {
                "name": "Remolino",
                "region_id": 19
            },
            {
                "name": "Sabanas de San Ángel",
                "region_id": 19
            },
            {
                "name": "Salamina",
                "region_id": 19
            },
            {
                "name": "San Sebastián de Buenavista",
                "region_id": 19
            },
            {
                "name": "San Zenón",
                "region_id": 19
            },
            {
                "name": "Santa Ana",
                "region_id": 19
            },
            {
                "name": "Sitionuevo",
                "region_id": 19
            },
            {
                "name": "Tenerife",
                "region_id": 19
            },
            {
                "name": "Zapayán",
                "region_id": 19
            },
            {
                "name": "Zona Bananera",
                "region_id": 19
            },
            {
                "name": "Villavicencio",
                "region_id": 20
            },
            {
                "name": "Acacías",
                "region_id": 20
            },
            {
                "name": "Barranca de Upía",
                "region_id": 20
            },
            {
                "name": "Cabuyaro",
                "region_id": 20
            },
            {
                "name": "Castilla la Nueva",
                "region_id": 20
            },
            {
                "name": "Cubarral",
                "region_id": 20
            },
            {
                "name": "Cumaral",
                "region_id": 20
            },
            {
                "name": "El Calvario",
                "region_id": 20
            },
            {
                "name": "El Castillo",
                "region_id": 20
            },
            {
                "name": "El Dorado",
                "region_id": 20
            },
            {
                "name": "Fuente de Oro",
                "region_id": 20
            },
            {
                "name": "Granada",
                "region_id": 20
            },
            {
                "name": "Guamal",
                "region_id": 20
            },
            {
                "name": "Mapiripán",
                "region_id": 20
            },
            {
                "name": "Mesetas",
                "region_id": 20
            },
            {
                "name": "La Macarena",
                "region_id": 20
            },
            {
                "name": "Lejanías",
                "region_id": 20
            },
            {
                "name": "Puerto Concordia",
                "region_id": 20
            },
            {
                "name": "Puerto Gaitán",
                "region_id": 20
            },
            {
                "name": "Puerto Lleras",
                "region_id": 20
            },
            {
                "name": "Puerto López",
                "region_id": 20
            },
            {
                "name": "Puerto Rico",
                "region_id": 20
            },
            {
                "name": "Restrepo",
                "region_id": 20
            },
            {
                "name": "San Carlos de Guaroa",
                "region_id": 20
            },
            {
                "name": "San Juan de Arama",
                "region_id": 20
            },
            {
                "name": "San Juanito",
                "region_id": 20
            },
            {
                "name": "San Martín",
                "region_id": 20
            },
            {
                "name": "Uribe",
                "region_id": 20
            },
            {
                "name": "Vistahermosa",
                "region_id": 20
            },
            {
                "name": "Pasto",
                "region_id": 21
            },
            {
                "name": "Albán (San José)",
                "region_id": 21
            },
            {
                "name": "Aldana",
                "region_id": 21
            },
            {
                "name": "Ancuya",
                "region_id": 21
            },
            {
                "name": "Arboleda (Berruecos)",
                "region_id": 21
            },
            {
                "name": "Barbacoas",
                "region_id": 21
            },
            {
                "name": "Belén",
                "region_id": 21
            },
            {
                "name": "Buesaco",
                "region_id": 21
            },
            {
                "name": "Chachagüí",
                "region_id": 21
            },
            {
                "name": "Colón (Génova)",
                "region_id": 21
            },
            {
                "name": "Consacá",
                "region_id": 21
            },
            {
                "name": "Contadero",
                "region_id": 21
            },
            {
                "name": "Córdoba",
                "region_id": 21
            },
            {
                "name": "Cuaspud (Carlosama)",
                "region_id": 21
            },
            {
                "name": "Cumbal",
                "region_id": 21
            },
            {
                "name": "Cumbitara",
                "region_id": 21
            },
            {
                "name": "El Charco",
                "region_id": 21
            },
            {
                "name": "El Peñol",
                "region_id": 21
            },
            {
                "name": "El Rosario",
                "region_id": 21
            },
            {
                "name": "El Tablón de Gómez",
                "region_id": 21
            },
            {
                "name": "El Tambo",
                "region_id": 21
            },
            {
                "name": "Funes",
                "region_id": 21
            },
            {
                "name": "Guachucal",
                "region_id": 21
            },
            {
                "name": "Guaitarilla",
                "region_id": 21
            },
            {
                "name": "Gualmatán",
                "region_id": 21
            },
            {
                "name": "Iles",
                "region_id": 21
            },
            {
                "name": "Imués",
                "region_id": 21
            },
            {
                "name": "Ipiales",
                "region_id": 21
            },
            {
                "name": "La Cruz",
                "region_id": 21
            },
            {
                "name": "La Florida",
                "region_id": 21
            },
            {
                "name": "La Llanada",
                "region_id": 21
            },
            {
                "name": "La Tola",
                "region_id": 21
            },
            {
                "name": "La Unión",
                "region_id": 21
            },
            {
                "name": "Leiva",
                "region_id": 21
            },
            {
                "name": "Linares",
                "region_id": 21
            },
            {
                "name": "Los Andes (Sotomayor)",
                "region_id": 21
            },
            {
                "name": "Magüí Payán (La Unión)",
                "region_id": 21
            },
            {
                "name": "Mallama (Piedrancha)",
                "region_id": 21
            },
            {
                "name": "Mosquera",
                "region_id": 21
            },
            {
                "name": "Nariño",
                "region_id": 21
            },
            {
                "name": "Olaya Herrera (Bocas de Satinga)",
                "region_id": 21
            },
            {
                "name": "Ospina",
                "region_id": 21
            },
            {
                "name": "Policarpa",
                "region_id": 21
            },
            {
                "name": "Potosí",
                "region_id": 21
            },
            {
                "name": "Providencia",
                "region_id": 21
            },
            {
                "name": "Puerres",
                "region_id": 21
            },
            {
                "name": "Pupiales",
                "region_id": 21
            },
            {
                "name": "Ricaurte",
                "region_id": 21
            },
            {
                "name": "Roberto Payán (San José)",
                "region_id": 21
            },
            {
                "name": "Samaniego",
                "region_id": 21
            },
            {
                "name": "San Bernardo",
                "region_id": 21
            },
            {
                "name": "San Lorenzo",
                "region_id": 21
            },
            {
                "name": "San Pablo",
                "region_id": 21
            },
            {
                "name": "San Pedro de Cartago",
                "region_id": 21
            },
            {
                "name": "Sandoná",
                "region_id": 21
            },
            {
                "name": "Santa Bárbara (Iscuandé)",
                "region_id": 21
            },
            {
                "name": "Santacruz (Guachavés)",
                "region_id": 21
            },
            {
                "name": "Sapuyes",
                "region_id": 21
            },
            {
                "name": "Taminango",
                "region_id": 21
            },
            {
                "name": "Tangua",
                "region_id": 21
            },
            {
                "name": "Tumaco",
                "region_id": 21
            },
            {
                "name": "Túquerres",
                "region_id": 21
            },
            {
                "name": "Villagarzón",
                "region_id": 21
            },
            {
                "name": "Yacuanquer",
                "region_id": 21
            },
            {
                "name": "Ábrego",
                "region_id": 22
            },
            {
                "name": "Arboledas",
                "region_id": 22
            },
            {
                "name": "Bochalema",
                "region_id": 22
            },
            {
                "name": "Bucarasica",
                "region_id": 22
            },
            {
                "name": "Cácota",
                "region_id": 22
            },
            {
                "name": "Cachirá",
                "region_id": 22
            },
            {
                "name": "Chinácota",
                "region_id": 22
            },
            {
                "name": "Chitagá",
                "region_id": 22
            },
            {
                "name": "Convención",
                "region_id": 22
            },
            {
                "name": "Cúcuta",
                "region_id": 22
            },
            {
                "name": "Cucutilla",
                "region_id": 22
            },
            {
                "name": "Durania",
                "region_id": 22
            },
            {
                "name": "El Carmen",
                "region_id": 22
            },
            {
                "name": "El Tarra",
                "region_id": 22
            },
            {
                "name": "El Zulia",
                "region_id": 22
            },
            {
                "name": "Gramalote",
                "region_id": 22
            },
            {
                "name": "Hacarí",
                "region_id": 22
            },
            {
                "name": "Herrán",
                "region_id": 22
            },
            {
                "name": "La Esperanza",
                "region_id": 22
            },
            {
                "name": "La Playa de Belén",
                "region_id": 22
            },
            {
                "name": "Labateca",
                "region_id": 22
            },
            {
                "name": "Los Patios",
                "region_id": 22
            },
            {
                "name": "Lourdes",
                "region_id": 22
            },
            {
                "name": "Mutiscua",
                "region_id": 22
            },
            {
                "name": "Ocaña",
                "region_id": 22
            },
            {
                "name": "Pamplona",
                "region_id": 22
            },
            {
                "name": "Pamplonita",
                "region_id": 22
            },
            {
                "name": "Puerto Santander",
                "region_id": 22
            },
            {
                "name": "Ragonvalia",
                "region_id": 22
            },
            {
                "name": "Salazar de Las Palmas",
                "region_id": 22
            },
            {
                "name": "San Calixto",
                "region_id": 22
            },
            {
                "name": "San Cayetano",
                "region_id": 22
            },
            {
                "name": "Santiago",
                "region_id": 22
            },
            {
                "name": "Santo Domingo de Silos",
                "region_id": 22
            },
            {
                "name": "Sardinata",
                "region_id": 22
            },
            {
                "name": "Teorama",
                "region_id": 22
            },
            {
                "name": "Tibú",
                "region_id": 22
            },
            {
                "name": "Toledo",
                "region_id": 22
            },
            {
                "name": "Villa Caro",
                "region_id": 22
            },
            {
                "name": "Villa del Rosario",
                "region_id": 22
            },
            {
                "name": "Mocoa",
                "region_id": 23
            },
            {
                "name": "Colón",
                "region_id": 23
            },
            {
                "name": "Leguízamo",
                "region_id": 23
            },
            {
                "name": "Orito",
                "region_id": 23
            },
            {
                "name": "Puerto Asís",
                "region_id": 23
            },
            {
                "name": "Puerto Caicedo",
                "region_id": 23
            },
            {
                "name": "Puerto Guzmán",
                "region_id": 23
            },
            {
                "name": "San Francisco",
                "region_id": 23
            },
            {
                "name": "San Miguel",
                "region_id": 23
            },
            {
                "name": "Santiago",
                "region_id": 23
            },
            {
                "name": "Sibundoy",
                "region_id": 23
            },
            {
                "name": "Valle del Guamuez (La Hormiga)",
                "region_id": 23
            },
            {
                "name": "Villagarzón",
                "region_id": 23
            },
            {
                "name": "Armenia",
                "region_id": 24
            },
            {
                "name": "Buenavista",
                "region_id": 24
            },
            {
                "name": "Calarcá",
                "region_id": 24
            },
            {
                "name": "Circasia",
                "region_id": 24
            },
            {
                "name": "Córdoba",
                "region_id": 24
            },
            {
                "name": "Filandia",
                "region_id": 24
            },
            {
                "name": "Génova",
                "region_id": 24
            },
            {
                "name": "La Tebaida",
                "region_id": 24
            },
            {
                "name": "Montenegro",
                "region_id": 24
            },
            {
                "name": "Pijao",
                "region_id": 24
            },
            {
                "name": "Quimbaya",
                "region_id": 24
            },
            {
                "name": "Salento",
                "region_id": 24
            },
            {
                "name": "Pereira",
                "region_id": 25
            },
            {
                "name": "Apía",
                "region_id": 25
            },
            {
                "name": "Balboa",
                "region_id": 25
            },
            {
                "name": "Belén de Umbría",
                "region_id": 25
            },
            {
                "name": "Dosquebradas",
                "region_id": 25
            },
            {
                "name": "Guática",
                "region_id": 25
            },
            {
                "name": "La Celia",
                "region_id": 25
            },
            {
                "name": "La Virginia",
                "region_id": 25
            },
            {
                "name": "Marsella",
                "region_id": 25
            },
            {
                "name": "Mistrató",
                "region_id": 25
            },
            {
                "name": "Pueblo Rico",
                "region_id": 25
            },
            {
                "name": "Quinchía",
                "region_id": 25
            },
            {
                "name": "Santa Rosa de Cabal",
                "region_id": 25
            },
            {
                "name": "Santuario",
                "region_id": 25
            },
            {
                "name": "San Andrés",
                "region_id": 26
            },
            {
                "name": "Bucaramanga",
                "region_id": 27
            },
            {
                "name": "Aguada",
                "region_id": 27
            },
            {
                "name": "Albania",
                "region_id": 27
            },
            {
                "name": "Aratoca",
                "region_id": 27
            },
            {
                "name": "Barbosa",
                "region_id": 27
            },
            {
                "name": "Barichara",
                "region_id": 27
            },
            {
                "name": "Barrancabermeja",
                "region_id": 27
            },
            {
                "name": "Betulia",
                "region_id": 27
            },
            {
                "name": "Bolívar",
                "region_id": 27
            },
            {
                "name": "Cabecera",
                "region_id": 27
            },
            {
                "name": "Cabrera",
                "region_id": 27
            },
            {
                "name": "California",
                "region_id": 27
            },
            {
                "name": "Capitanejo",
                "region_id": 27
            },
            {
                "name": "Carcasí",
                "region_id": 27
            },
            {
                "name": "Cepitá",
                "region_id": 27
            },
            {
                "name": "Cerrito",
                "region_id": 27
            },
            {
                "name": "Charalá",
                "region_id": 27
            },
            {
                "name": "Charta",
                "region_id": 27
            },
            {
                "name": "Chima",
                "region_id": 27
            },
            {
                "name": "Chipatá",
                "region_id": 27
            },
            {
                "name": "Cimitarra",
                "region_id": 27
            },
            {
                "name": "Contratación",
                "region_id": 27
            },
            {
                "name": "Coromoro",
                "region_id": 27
            },
            {
                "name": "Curití",
                "region_id": 27
            },
            {
                "name": "El Carmen de Chucurí",
                "region_id": 27
            },
            {
                "name": "El Guacamayo",
                "region_id": 27
            },
            {
                "name": "El Playón",
                "region_id": 27
            },
            {
                "name": "Encino",
                "region_id": 27
            },
            {
                "name": "Enciso",
                "region_id": 27
            },
            {
                "name": "Floridablanca",
                "region_id": 27
            },
            {
                "name": "Galán",
                "region_id": 27
            },
            {
                "name": "Gambita",
                "region_id": 27
            },
            {
                "name": "Girón",
                "region_id": 27
            },
            {
                "name": "Guaca",
                "region_id": 27
            },
            {
                "name": "Guadalupe",
                "region_id": 27
            },
            {
                "name": "Guapotá",
                "region_id": 27
            },
            {
                "name": "Guavatá",
                "region_id": 27
            },
            {
                "name": "Güepsa",
                "region_id": 27
            },
            {
                "name": "Hato",
                "region_id": 27
            },
            {
                "name": "Jesús María",
                "region_id": 27
            },
            {
                "name": "Jordán",
                "region_id": 27
            },
            {
                "name": "La Belleza",
                "region_id": 27
            },
            {
                "name": "La Paz",
                "region_id": 27
            },
            {
                "name": "Landázuri",
                "region_id": 27
            },
            {
                "name": "Lebríja",
                "region_id": 27
            },
            {
                "name": "Los Santos",
                "region_id": 27
            },
            {
                "name": "Macaravita",
                "region_id": 27
            },
            {
                "name": "Málaga",
                "region_id": 27
            },
            {
                "name": "Matanza",
                "region_id": 27
            },
            {
                "name": "Mogotes",
                "region_id": 27
            },
            {
                "name": "Molagavita",
                "region_id": 27
            },
            {
                "name": "Ocamonte",
                "region_id": 27
            },
            {
                "name": "Oiba",
                "region_id": 27
            },
            {
                "name": "Onzaga",
                "region_id": 27
            },
            {
                "name": "Palmar",
                "region_id": 27
            },
            {
                "name": "Palmas del Socorro",
                "region_id": 27
            },
            {
                "name": "Páramo",
                "region_id": 27
            },
            {
                "name": "Piedecuesta",
                "region_id": 27
            },
            {
                "name": "Pinchote",
                "region_id": 27
            },
            {
                "name": "Puente Nacional",
                "region_id": 27
            },
            {
                "name": "Puerto Parra",
                "region_id": 27
            },
            {
                "name": "Puerto Wilches",
                "region_id": 27
            },
            {
                "name": "Rionegro",
                "region_id": 27
            },
            {
                "name": "Sabana de Torres",
                "region_id": 27
            },
            {
                "name": "San Andrés",
                "region_id": 27
            },
            {
                "name": "San Benito",
                "region_id": 27
            },
            {
                "name": "San Gil",
                "region_id": 27
            },
            {
                "name": "San Joaquín",
                "region_id": 27
            },
            {
                "name": "San José de Miranda",
                "region_id": 27
            },
            {
                "name": "San Miguel",
                "region_id": 27
            },
            {
                "name": "San Vicente de Chucurí",
                "region_id": 27
            },
            {
                "name": "Santa Bárbara",
                "region_id": 27
            },
            {
                "name": "Santa Helena del Opón",
                "region_id": 27
            },
            {
                "name": "Simacota",
                "region_id": 27
            },
            {
                "name": "Socorro",
                "region_id": 27
            },
            {
                "name": "Suaita",
                "region_id": 27
            },
            {
                "name": "Sucre",
                "region_id": 27
            },
            {
                "name": "Suratá",
                "region_id": 27
            },
            {
                "name": "Tona",
                "region_id": 27
            },
            {
                "name": "Valle de San José",
                "region_id": 27
            },
            {
                "name": "Vélez",
                "region_id": 27
            },
            {
                "name": "Vetas",
                "region_id": 27
            },
            {
                "name": "Villanueva",
                "region_id": 27
            },
            {
                "name": "Zapatoca",
                "region_id": 27
            },
            {
                "name": "Sincelejo",
                "region_id": 28
            },
            {
                "name": "Buenavista",
                "region_id": 28
            },
            {
                "name": "Caimito",
                "region_id": 28
            },
            {
                "name": "Colosó",
                "region_id": 28
            },
            {
                "name": "Corozal",
                "region_id": 28
            },
            {
                "name": "Coveñas",
                "region_id": 28
            },
            {
                "name": "Chalan",
                "region_id": 28
            },
            {
                "name": "El Roble",
                "region_id": 28
            },
            {
                "name": "Galeras",
                "region_id": 28
            },
            {
                "name": "Guaranda",
                "region_id": 28
            },
            {
                "name": "La Unión",
                "region_id": 28
            },
            {
                "name": "Los Palmitos",
                "region_id": 28
            },
            {
                "name": "Majagual",
                "region_id": 28
            },
            {
                "name": "Morroa",
                "region_id": 28
            },
            {
                "name": "Ovejas",
                "region_id": 28
            },
            {
                "name": "Palmito",
                "region_id": 28
            },
            {
                "name": "San Benito Abad",
                "region_id": 28
            },
            {
                "name": "San Juan de Betulia",
                "region_id": 28
            },
            {
                "name": "San Marcos",
                "region_id": 28
            },
            {
                "name": "San Onofre",
                "region_id": 28
            },
            {
                "name": "San Pedro",
                "region_id": 28
            },
            {
                "name": "Sincé",
                "region_id": 28
            },
            {
                "name": "Sucre",
                "region_id": 28
            },
            {
                "name": "Tolú",
                "region_id": 28
            },
            {
                "name": "Tolúviejo",
                "region_id": 28
            },
            {
                "name": "Ibagué",
                "region_id": 29
            },
            {
                "name": "Alpujarra",
                "region_id": 29
            },
            {
                "name": "Alvarado",
                "region_id": 29
            },
            {
                "name": "Ambalema",
                "region_id": 29
            },
            {
                "name": "Anzoátegui",
                "region_id": 29
            },
            {
                "name": "Ataco",
                "region_id": 29
            },
            {
                "name": "Cajamarca",
                "region_id": 29
            },
            {
                "name": "Carmen de Apicalá",
                "region_id": 29
            },
            {
                "name": "Casabianca",
                "region_id": 29
            },
            {
                "name": "Chaparral",
                "region_id": 29
            },
            {
                "name": "Coello",
                "region_id": 29
            },
            {
                "name": "Coyaima",
                "region_id": 29
            },
            {
                "name": "Cunday",
                "region_id": 29
            },
            {
                "name": "Dolores",
                "region_id": 29
            },
            {
                "name": "Espinal",
                "region_id": 29
            },
            {
                "name": "Falan",
                "region_id": 29
            },
            {
                "name": "Flandes",
                "region_id": 29
            },
            {
                "name": "Fresno",
                "region_id": 29
            },
            {
                "name": "Guamo",
                "region_id": 29
            },
            {
                "name": "Herveo",
                "region_id": 29
            },
            {
                "name": "Honda",
                "region_id": 29
            },
            {
                "name": "Icononzo",
                "region_id": 29
            },
            {
                "name": "Lérida",
                "region_id": 29
            },
            {
                "name": "Líbano",
                "region_id": 29
            },
            {
                "name": "Mariquita",
                "region_id": 29
            },
            {
                "name": "Melgar",
                "region_id": 29
            },
            {
                "name": "Murillo",
                "region_id": 29
            },
            {
                "name": "Natagaima",
                "region_id": 29
            },
            {
                "name": "Ortega",
                "region_id": 29
            },
            {
                "name": "Palocabildo",
                "region_id": 29
            },
            {
                "name": "Piedras",
                "region_id": 29
            },
            {
                "name": "Planadas",
                "region_id": 29
            },
            {
                "name": "Prado",
                "region_id": 29
            },
            {
                "name": "Purificación",
                "region_id": 29
            },
            {
                "name": "Rioblanco",
                "region_id": 29
            },
            {
                "name": "Roncesvalles",
                "region_id": 29
            },
            {
                "name": "Rovira",
                "region_id": 29
            },
            {
                "name": "Saldaña",
                "region_id": 29
            },
            {
                "name": "San Antonio",
                "region_id": 29
            },
            {
                "name": "San Luis",
                "region_id": 29
            },
            {
                "name": "Santa Isabel",
                "region_id": 29
            },
            {
                "name": "Suárez",
                "region_id": 29
            },
            {
                "name": "Valle de San Juan",
                "region_id": 29
            },
            {
                "name": "Venadillo",
                "region_id": 29
            },
            {
                "name": "Villahermosa",
                "region_id": 29
            },
            {
                "name": "Villarrica",
                "region_id": 29
            },
            {
                "name": "Cali",
                "region_id": 30
            },
            {
                "name": "Alcalá",
                "region_id": 30
            },
            {
                "name": "Andalucía",
                "region_id": 30
            },
            {
                "name": "Ansermanuevo",
                "region_id": 30
            },
            {
                "name": "Argelia",
                "region_id": 30
            },
            {
                "name": "Bolívar",
                "region_id": 30
            },
            {
                "name": "Buenaventura",
                "region_id": 30
            },
            {
                "name": "Buga",
                "region_id": 30
            },
            {
                "name": "Bugalagrande",
                "region_id": 30
            },
            {
                "name": "Caicedonia",
                "region_id": 30
            },
            {
                "name": "Calima (El Darién)",
                "region_id": 30
            },
            {
                "name": "Candelaria",
                "region_id": 30
            },
            {
                "name": "Cartago",
                "region_id": 30
            },
            {
                "name": "Dagua",
                "region_id": 30
            },
            {
                "name": "El Águila",
                "region_id": 30
            },
            {
                "name": "El Cairo",
                "region_id": 30
            },
            {
                "name": "El Cerrito",
                "region_id": 30
            },
            {
                "name": "El Dovio",
                "region_id": 30
            },
            {
                "name": "Florida",
                "region_id": 30
            },
            {
                "name": "Ginebra",
                "region_id": 30
            },
            {
                "name": "Guacarí",
                "region_id": 30
            },
            {
                "name": "Jamundí",
                "region_id": 30
            },
            {
                "name": "La Cumbre",
                "region_id": 30
            },
            {
                "name": "La Unión",
                "region_id": 30
            },
            {
                "name": "La Victoria",
                "region_id": 30
            },
            {
                "name": "Leiva",
                "region_id": 30
            },
            {
                "name": "Obando",
                "region_id": 30
            },
            {
                "name": "Palmira",
                "region_id": 30
            },
            {
                "name": "Pradera",
                "region_id": 30
            },
            {
                "name": "Restrepo",
                "region_id": 30
            },
            {
                "name": "Riofrío",
                "region_id": 30
            },
            {
                "name": "Roldanillo",
                "region_id": 30
            },
            {
                "name": "San Pedro",
                "region_id": 30
            },
            {
                "name": "Sevilla",
                "region_id": 30
            },
            {
                "name": "Toro",
                "region_id": 30
            },
            {
                "name": "Trujillo",
                "region_id": 30
            },
            {
                "name": "Tuluá",
                "region_id": 30
            },
            {
                "name": "Ulloa",
                "region_id": 30
            },
            {
                "name": "Versalles",
                "region_id": 30
            },
            {
                "name": "Vijes",
                "region_id": 30
            },
            {
                "name": "Yotoco",
                "region_id": 30
            },
            {
                "name": "Yumbo",
                "region_id": 30
            },
            {
                "name": "Zarzal",
                "region_id": 30
            },
            {
                "name": "Mitú",
                "region_id": 31
            },
            {
                "name": "Carurú",
                "region_id": 31
            },
            {
                "name": "Taraira",
                "region_id": 31
            },
            {
                "name": "Papunaua",
                "region_id": 31
            },
            {
                "name": "Yavaraté",
                "region_id": 31
            },
            {
                "name": "Pacoa",
                "region_id": 31
            },
            {
                "name": "Puerto Carreño",
                "region_id": 32
            },
            {
                "name": "La Primavera",
                "region_id": 32
            },
            {
                "name": "Santa Rosalía",
                "region_id": 32
            },
            {
                "name": "Cumaribo",
                "region_id": 32
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
