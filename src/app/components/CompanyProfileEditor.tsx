'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import Input from './ui/Input';
import Button from './ui/Button';

type CompanyData = {
    id: string;
    name: string;
    prompt: string;
    whatsapp_number: string | null;
    phone_number_id: string | null;
    whatsapp_access_token: string | null;
    meta_app_id: string | null;
    waba_id: string | null;
};

export default function CompanyProfileEditor() {
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchCompany = async () => {
            const user = await getCurrentUserClient();
            if (!user?.company_id) {
                toast.error('No se encontró la empresa asociada');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', user.company_id)
                .maybeSingle();

            if (error || !data) {
                toast.error('Error al cargar datos de la empresa');
            } else {
                setCompany(data);
            }
            setLoading(false);
        };

        fetchCompany();
    }, []);

    const handleChange = (field: keyof CompanyData, value: string) => {
        if (company && field === 'prompt') {  // Solo permitir cambio en prompt
            setCompany({ ...company, [field]: value });
        }
    };

    const handleSave = async () => {
        if (!company) return;
        setSaving(true);

        const { error } = await supabase
            .from('companies')
            .update({
                prompt: company.prompt,  // Solo actualizar prompt
            })
            .eq('id', company.id);

        setSaving(false);
        if (error) {
            toast.error('Error al guardar cambios');
        } else {
            toast.success('Prompt actualizado');
        }
    };

    if (loading) return <p>Cargando perfil de empresa...</p>;
    if (!company) return <p>No se encontró información de la empresa.</p>;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                    id="name"
                    value={company.name}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="prompt">Prompt Personalizado</Label>
                <Textarea
                    id="prompt"
                    value={company.prompt || ''}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                    placeholder="Ingresa el prompt para la IA..."
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="whatsapp_number">Número de WhatsApp</Label>
                <Input
                    id="whatsapp_number"
                    value={company.whatsapp_number || ''}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone_number_id">ID de Número de Teléfono</Label>
                <Input
                    id="phone_number_id"
                    value={company.phone_number_id || ''}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="whatsapp_access_token">Token de Acceso WhatsApp</Label>
                <Input
                    id="whatsapp_access_token"
                    value={company.whatsapp_access_token || ''}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="meta_app_id">ID de App Meta</Label>
                <Input
                    id="meta_app_id"
                    value={company.meta_app_id || ''}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="waba_id">ID WABA</Label>
                <Input
                    id="waba_id"
                    value={company.waba_id || ''}
                    disabled
                />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
    );
}