'use client';

import { Fragment, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Button from '@/app/components/ui/Button';

type AssignedContact = {
    phone: string;
    name: string;
    status: string;
    last_interaction_at: string;
    assigned_at: string;
    active: boolean;
    assignment_id: string;
};

export default function HistoryPage() {
    const [assignments, setAssignments] = useState<AssignedContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchAssignments = async () => {
            const user = await getCurrentUserClient();

            const { data, error } = await supabase
                .from('assistants_assignments')
                .select(
                    `assignment_id: id, contact_phone, assigned_at, active, 
            contacts ( phone, name, status, last_interaction_at )`
                )
                .eq('assigned_to', user.id)
                .order('assigned_at', { ascending: false });

            if (error) {
                console.error('Error fetching assignments:', error.message);
                setLoading(false);
                return;
            }

            const mapped: AssignedContact[] = (data || []).map((a: any) => ({
                phone: a.contacts?.phone,
                name: a.contacts?.name || 'Sin nombre',
                status: a.contacts?.status,
                last_interaction_at: a.contacts?.last_interaction_at,
                assigned_at: a.assigned_at,
                active: a.active,
                assignment_id: a.assignment_id,
            }));

            setAssignments(mapped);
            setLoading(false);
        };

        fetchAssignments();
    }, []);

    const grouped = assignments.reduce((acc, curr) => {
        if (!acc[curr.phone]) acc[curr.phone] = [];
        acc[curr.phone].push(curr);
        return acc;
    }, {} as Record<string, AssignedContact[]>);

    const toggleGroup = (phone: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [phone]: !prev[phone]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Card className="shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-xl font-semibold">Historial de contactos atendidos</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {Object.entries(grouped).length === 0 ? (
                        <p className="text-muted-foreground">No has atendido ningún contacto aún.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Asignaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(grouped).map(([phone, records]) => (
                                    <Fragment key={phone}>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-9 p-0"
                                                    onClick={() => toggleGroup(phone)}
                                                >
                                                    {expandedGroups[phone] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-medium">{records[0].name}</TableCell>
                                            <TableCell>{phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={records[0].active ? 'default' : 'secondary'}>
                                                    {records[0].active ? 'Activo' : 'Finalizado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{records.length}</TableCell>
                                        </TableRow>
                                        {expandedGroups[phone] && (
                                            <TableRow className="bg-muted/10">
                                                <TableCell colSpan={5} className="p-0">
                                                    <Table className="border-t">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Asignado</TableHead>
                                                                <TableHead>Última interacción</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {records.map((a) => (
                                                                <TableRow key={a.assignment_id}>
                                                                    <TableCell>{new Date(a.assigned_at).toLocaleString()}</TableCell>
                                                                    <TableCell>{new Date(a.last_interaction_at).toLocaleString()}</TableCell>
                                                                    <TableCell>{a.status}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}