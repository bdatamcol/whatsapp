'use client';

import { AlertTriangle } from 'lucide-react';
import Card, { CardContent } from './ui/card';

interface FacebookConfigErrorProps {
    title?: string;
    message?: string;
    variant?: 'card' | 'inline' | 'compact';
}

export function FacebookConfigError({
    title = "Configuración de Facebook Requerida",
    message = "Para acceder a esta funcionalidad, necesitas configurar tu cuenta de Facebook Ads en la sección de ajustes.",
}: FacebookConfigErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {message}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}