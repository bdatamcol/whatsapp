'use client';

import { useState } from 'react';
import { Bug, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BugReportForm from './BugReportForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BugReportButtonProps {
  variant?: 'floating' | 'inline' | 'minimal';
  position?: 'bottom-right' | 'top-right' | 'bottom-left';
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export default function BugReportButton({ 
  variant = 'floating', 
  position = 'bottom-right',
  label = 'Reportar Problema', 
  showIcon = true,
  className 
}: BugReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'top-right': 'fixed top-6 right-6 z-50',
    'bottom-left': 'fixed bottom-6 left-6 z-50',
  };

  if (variant === 'floating') {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className={cn(
                positionClasses[position],
                'bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full px-4 py-2',
                'flex items-center gap-2 transition-all hover:scale-105',
                className
              )}
              size="lg"
            >
              {showIcon && <Bug className="w-4 h-4" />}
              <span className="hidden sm:inline">{label}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Reportar un Problema</DialogTitle>
            <DialogDescription className="sr-only">
              Formulario para reportar problemas y mejorar la aplicación
            </DialogDescription>
            <BugReportForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className={cn('border-red-200 text-red-600 hover:bg-red-50', className)}
          >
            {showIcon && <Bug className="w-4 h-4 mr-2" />}
            {label}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Reportar un Problema</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para reportar problemas y mejorar la aplicación
          </DialogDescription>
          <BugReportForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors',
            className
          )}
        >
          {showIcon && <MessageCircle className="w-4 h-4" />}
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Reportar un Problema</DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para reportar problemas y mejorar la aplicación
        </DialogDescription>
        <BugReportForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}