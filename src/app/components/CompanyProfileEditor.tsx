'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import Input from './ui/Input';
import PasswordInput from './ui/PasswordInput';
import AdaptiveTextarea from './ui/AdaptiveTextarea';
import Button from './ui/Button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Función para verificar si un texto está cifrado
function isEncrypted(text: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Verificar si tiene el formato de texto cifrado (iv:encrypted)
  const parts = text.split(':');
  if (parts.length !== 2) return false;
  
  // Verificar que ambas partes sean hexadecimales válidas
  const [ivHex, encryptedHex] = parts;
  return !!ivHex && !!encryptedHex && /^[0-9a-fA-F]+$/.test(ivHex) && /^[0-9a-fA-F]+$/.test(encryptedHex);
}

// Función para obtener una versión legible de datos potencialmente cifrados
function decryptData(encryptedText: string | null): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return '';
  }
  
  // Si el texto parece estar cifrado, extraemos solo la parte cifrada para mostrarla
  // (por seguridad, no intentamos descifrar en el cliente)
  if (isEncrypted(encryptedText)) {
    const parts = encryptedText.split(':');
    // Mostramos solo los primeros 8 caracteres de la parte cifrada para mayor seguridad
    return `${parts[1].substring(0, 8)}...`;
  }
  
  return encryptedText;
}

type CompanyData = {
    id: string;
    name: string;
    prompt: string;
    whatsapp_number: string | null;
    phone_number_id: string | null;
    whatsapp_access_token: string | null;
    meta_app_id: string | null;
    waba_id: string | null;
    facebook_access_token: string | null;
    facebook_ad_account_id: string | null;
    marketing_account_id: string | null;
    facebook_catalog_id: string | null;
};

// Tipo para almacenar los valores descifrados
type DecryptedValues = {
    phone_number_id: string;
    whatsapp_access_token: string;
    meta_app_id: string;
    waba_id: string;
    prompt: string;
    facebook_access_token: string;
    facebook_ad_account_id: string;
    marketing_account_id: string;
    facebook_catalog_id: string;
};

export default function CompanyProfileEditor() {
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [decryptedValues, setDecryptedValues] = useState<Partial<DecryptedValues>>({});
    const [decrypting, setDecrypting] = useState<{[key: string]: boolean}>({});
    const router = useRouter();

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const user = await getCurrentUserClient();
                if (!user?.company_id) {
                    toast.error('No se encontró la empresa asociada');
                    return;
                }

                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', user.company_id)
                    .maybeSingle();

                if (error || !data) {
                    toast.error('Error al cargar datos de la empresa');
                    return;
                }
                
                setCompany(data);
                
                // Descifrar el prompt automáticamente al cargar
                if (data.prompt && isEncrypted(data.prompt)) {
                    try {
                        setDecrypting(prev => ({ ...prev, prompt: true }));
                        const response = await fetch('/api/company/decrypt-field', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ field: 'prompt' }),
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            setDecryptedValues(prev => ({ ...prev, prompt: result.value }));
                        }
                    } catch (error) {
                        console.error('Error al descifrar prompt:', error);
                    } finally {
                        setDecrypting(prev => ({ ...prev, prompt: false }));
                    }
                }
            } catch (error) {
                console.error('Error al obtener datos de la empresa:', error);
                toast.error('Error al cargar datos de la empresa');
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, []);

    const handleChange = (field: keyof CompanyData, value: string) => {
        if (company && field === 'prompt') {  // Solo permitir cambio en prompt
            setCompany({ ...company, [field]: value });
            
            // También actualizar el valor descifrado para mantener sincronización
            if (decryptedValues.prompt) {
                setDecryptedValues(prev => ({ ...prev, prompt: value }));
            }
        }
    };

    // Función para obtener el valor descifrado del servidor cuando se hace clic en mostrar contraseña
    const handleShowPassword = async (field: keyof DecryptedValues) => {
        if (!company || !company[field]) return;
        
        // Si ya tenemos el valor descifrado, alternamos entre mostrar y ocultar
        if (decryptedValues[field]) {
            // Si ya tenemos el valor descifrado, lo eliminamos para ocultarlo
            setDecryptedValues(prev => {
                const newValues = { ...prev };
                delete newValues[field];
                return newValues;
            });
            return;
        }
        
        // Marcamos como descifrando
        setDecrypting(prev => ({ ...prev, [field]: true }));
        
        try {
            // Si el valor parece estar cifrado, hacemos una llamada al servidor para descifrarlo
            if (company[field] && isEncrypted(company[field])) {
                const response = await fetch('/api/company/decrypt-field', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ field }),
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al descifrar');
                }
                
                const data = await response.json();
                setDecryptedValues(prev => ({ ...prev, [field]: data.value }));
            } else {
                // Si no está cifrado, usamos el valor tal cual
                setDecryptedValues(prev => ({ ...prev, [field]: company[field] || '' }));
            }
        } catch (error) {
            toast.error(`Error al descifrar ${field}`);
            console.error(`Error al descifrar ${field}:`, error);
        } finally {
            setDecrypting(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSave = async () => {
        if (!company) return;
        setSaving(true);

        try {
            // Usamos el valor descifrado si existe, de lo contrario usamos el valor del company
            const promptToSave = decryptedValues.prompt || company.prompt;
            
            const response = await fetch('/api/company/update-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: promptToSave,
                }),
            });

            const result = await response.json();

            setSaving(false);
            if (!response.ok) {
                toast.error(result.error || 'Error al guardar cambios');
            } else {
                toast.success('Prompt actualizado');
                router.refresh();
            }
        } catch (error) {
            setSaving(false);
            toast.error('Error al guardar cambios');
            console.error('Error al guardar prompt:', error);
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
                {decrypting.prompt ? (
                    <div className="flex items-center justify-center h-[150px] border rounded-md border-input bg-background">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <AdaptiveTextarea
                        id="prompt"
                        value={decryptedValues.prompt || company.prompt || ''}
                        onChange={(e) => handleChange('prompt', e.target.value)}
                        className="font-mono text-sm min-h-[150px]"
                        placeholder="Ingresa el prompt para la IA..."
                        maxHeight="400px"
                    />
                )}
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
                <PasswordInput
                    id="phone_number_id"
                    value={decryptedValues.phone_number_id || decryptData(company.phone_number_id)}
                    disabled
                    showPasswordToggle={true}
                    onToggleVisibility={() => handleShowPassword('phone_number_id')}
                    isLoading={decrypting['phone_number_id']}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="whatsapp_access_token">Token de Acceso WhatsApp</Label>
                <PasswordInput
                    id="whatsapp_access_token"
                    value={decryptedValues.whatsapp_access_token || decryptData(company.whatsapp_access_token)}
                    disabled
                    showPasswordToggle={true}
                    onToggleVisibility={() => handleShowPassword('whatsapp_access_token')}
                    isLoading={decrypting['whatsapp_access_token']}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="meta_app_id">ID de App Meta</Label>
                <PasswordInput
                    id="meta_app_id"
                    value={decryptedValues.meta_app_id || decryptData(company.meta_app_id)}
                    disabled
                    showPasswordToggle={true}
                    onToggleVisibility={() => handleShowPassword('meta_app_id')}
                    isLoading={decrypting['meta_app_id']}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="waba_id">ID WABA</Label>
                <PasswordInput
                    id="waba_id"
                    value={decryptedValues.waba_id || decryptData(company.waba_id)}
                    disabled
                    showPasswordToggle={true}
                    onToggleVisibility={() => handleShowPassword('waba_id')}
                    isLoading={decrypting['waba_id']}
                />
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Configuración de Facebook/Meta</h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="facebook_access_token">Token de Acceso Facebook</Label>
                        <PasswordInput
                            id="facebook_access_token"
                            value={decryptedValues.facebook_access_token || decryptData(company.facebook_access_token)}
                            disabled
                            showPasswordToggle={true}
                            onToggleVisibility={() => handleShowPassword('facebook_access_token')}
                            isLoading={decrypting['facebook_access_token']}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="facebook_ad_account_id">ID de Cuenta de Anuncios Facebook</Label>
                        <PasswordInput
                            id="facebook_ad_account_id"
                            value={decryptedValues.facebook_ad_account_id || decryptData(company.facebook_ad_account_id)}
                            disabled
                            showPasswordToggle={true}
                            onToggleVisibility={() => handleShowPassword('facebook_ad_account_id')}
                            isLoading={decrypting['facebook_ad_account_id']}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="marketing_account_id">ID de Cuenta de Marketing</Label>
                        <PasswordInput
                            id="marketing_account_id"
                            value={decryptedValues.marketing_account_id || decryptData(company.marketing_account_id)}
                            disabled
                            showPasswordToggle={true}
                            onToggleVisibility={() => handleShowPassword('marketing_account_id')}
                            isLoading={decrypting['marketing_account_id']}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="facebook_catalog_id">ID de Catálogo Facebook</Label>
                        <PasswordInput
                            id="facebook_catalog_id"
                            value={decryptedValues.facebook_catalog_id || decryptData(company.facebook_catalog_id)}
                            disabled
                            showPasswordToggle={true}
                            onToggleVisibility={() => handleShowPassword('facebook_catalog_id')}
                            isLoading={decrypting['facebook_catalog_id']}
                        />
                    </div>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
    );
}