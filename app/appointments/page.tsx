'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Plus, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(full_name),
          doctor:doctors(full_name)
        `)
        .order('appointment_date', { ascending: true });
      
      if (!error && data) setAppointments(data);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> New Appointment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading schedule...</TableCell></TableRow>
              ) : appointments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No appointments scheduled.</TableCell></TableRow>
              ) : appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell className="font-medium">{appt.patient?.full_name}</TableCell>
                  <TableCell>{appt.doctor?.full_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" /> {appt.appointment_date}</span>
                      <span className="flex items-center text-xs text-muted-foreground"><Clock className="h-3 w-3 mr-1" /> {appt.appointment_time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={appt.status === 'Completed' ? 'default' : 'secondary'}>{appt.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={appt.payment_status === 'Paid' ? 'outline' : 'destructive'} className={appt.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}>
                      {appt.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
