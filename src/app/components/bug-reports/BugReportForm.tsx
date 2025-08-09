'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Send, X } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/card';
import Input from '../ui/Input';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';

interface BugReportFormProps {
  onSuccess?: () => void;
  allowAnonymous?: boolean;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
}

export default function BugReportForm({ onSuccess, allowAnonymous = true }: BugReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    reporter_email: '',
    screenshot: null as File | null,
    screenshot_url: '' as string,
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUserClient();
        if (user) {
          setUserData({
            id: user.id,
            email: user.email || '',
            role: user.role || 'anonymous',
            company_id: user.company_id || null,
          });
          // Auto-fill email if user is logged in
          setFormData(prev => ({ ...prev, reporter_email: user.email || '' }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reportData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        browser_info: navigator.userAgent,
        device_info: `${screen.width}x${screen.height}`,
        os_info: navigator.platform,
        url: window.location.href,
        user_id: userData?.id,
        role: userData?.role,
        company_id: userData?.company_id,
      };

      // Add user data if logged in
      if (userData) {
        reportData.user_id = userData.id;
        reportData.role = userData.role;
        if (userData.company_id) {
          reportData.company_id = userData.company_id;
        }
      }

      // Only add reporter_email if provided or if user is not logged in
      if (formData.reporter_email) {
        reportData.reporter_email = formData.reporter_email;
      }

      if (formData.screenshot_url) {
        reportData.screenshot_url = formData.screenshot_url;
      }
      console.log('reportData', reportData);

      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        toast.success('¡Reporte enviado exitosamente!');
        setFormData({
          title: '',
          description: '',
          category: 'other',
          priority: 'medium',
          reporter_email: userData?.email || '',
          screenshot: null,
          screenshot_url: '',
        });
        onSuccess?.();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al enviar reporte');
      }
    } catch (error) {
      toast.error('Error de conexión al enviar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload/screenshot', {
        method: 'POST',
        body: formDataUpload,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setFormData(prev => ({ ...prev, screenshot_url: url, screenshot: file }));
        toast.success('Imagen cargada exitosamente');
      } else {
        const error = await uploadRes.json();
        toast.error(error.error || 'Error al cargar imagen');
      }
    } catch (error) {
      toast.error('Error de conexión al cargar imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, screenshot: null, screenshot_url: '' }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Reportar un Problema</CardTitle>
        <CardContent>
          Ayúdanos a mejorar reportando los problemas que encuentres
        </CardContent>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Título breve del problema"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <Textarea
            placeholder="Describe el problema en detalle..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id='category-select'>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => {
                e.preventDefault();
                document.getElementById("category-select")?.focus();
              }}>
                <SelectItem value="ui">Interfaz de Usuario</SelectItem>
                <SelectItem value="api">API/Servidor</SelectItem>
                <SelectItem value="performance">Rendimiento</SelectItem>
                <SelectItem value="security">Seguridad</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger id='priority-select'>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => {
                e.preventDefault();
                document.getElementById("priority-select")?.focus();
              }}>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allowAnonymous && (
            <Input
              type="email"
              placeholder="Tu correo electrónico (opcional)"
              value={formData.reporter_email}
              onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })}
            />
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Adjuntar captura de pantalla</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>

            {uploadingImage && (
              <p className="text-sm text-gray-600 mt-1">Cargando imagen...</p>
            )}

            {formData.screenshot_url && (
              <div className="mt-2 relative">
                <img
                  src={formData.screenshot_url}
                  alt="Captura de pantalla"
                  className="max-w-full h-32 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formData.screenshot && !formData.screenshot_url && !uploadingImage && (
              <p className="text-sm text-gray-600 mt-1">
                {formData.screenshot.name} seleccionada
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}