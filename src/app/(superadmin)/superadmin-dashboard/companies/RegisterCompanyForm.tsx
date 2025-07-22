'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Input from '@/app/components/ui/Input';
import PasswordInput from '@/app/components/ui/PasswordInput';
import Button from '@/app/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface RegisterCompanyFormProps {
  onSuccessAction: () => void;
  onCancelAction: () => void;
}

export default function RegisterCompanyForm({ onSuccessAction, onCancelAction }: RegisterCompanyFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones básicas
      if (!companyName.trim() || !whatsappNumber.trim() || !email.trim() || !password.trim()) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Llamar al endpoint para registrar la empresa
      const response = await fetch('/api/superadmin/register-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          whatsappNumber,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar la empresa');
      }

      toast.success('Empresa registrada exitosamente');
      onSuccessAction();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Nombre de la Empresa
        </label>
        <Input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Nombre de la empresa"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">
          Número de WhatsApp
        </label>
        <Input
          id="whatsappNumber"
          type="text"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="+1234567890"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email del Administrador
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña del Administrador
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          disabled={loading}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          La contraseña debe tener al menos 6 caracteres
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          onClick={onCancelAction}
          variant="outline"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            'Registrar Empresa'
          )}
        </Button>
      </div>
    </form>
  );
}