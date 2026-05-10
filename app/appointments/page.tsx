import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recentAppointments } from "@/lib/data";

const expandedAppointments = [
  ...recentAppointments,
  {
    id: "APT-005",
    patient: "Jane Cooper",
    doctor: "Dr. Sarah Smith",
    department: "Cardiology",
    time: "02:00 PM (Tomorrow)",
    status: "Confirmed",
  },
  {
    id: "APT-006",
    patient: "Wade Warren",
    doctor: "Dr. Jacob Jones",
    department: "Neurology",
    time: "09:30 AM (May 12)",
    status: "Pending",
  },
  {
    id: "APT-007",
    patient: "Brooklyn Simmons",
    doctor: "Dr. Guy Hawkins",
    department: "Orthopedics",
    time: "11:00 AM (May 12)",
    status: "Confirmed",
  }
];

export default function AppointmentsView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            View and manage patient appointments.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="flex gap-4 mb-2 overflow-x-auto pb-2">
        <Button variant="default" className="whitespace-nowrap">All Appointments</Button>
        <Button variant="outline" className="whitespace-nowrap">Today</Button>
        <Button variant="outline" className="whitespace-nowrap">Upcoming</Button>
        <Button variant="outline" className="whitespace-nowrap">Past</Button>
        <Button variant="outline" className="whitespace-nowrap">Cancelled</Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Schedule List</CardTitle>
            <div className="relative w-full sm:w-72">
              <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search appointments..."
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appointment ID</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedAppointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{apt.patient}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {apt.doctor.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{apt.doctor}</span>
                    </div>
                  </TableCell>
                  <TableCell>{apt.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {apt.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      apt.status === "Completed" ? "secondary" : 
                      apt.status === "In Progress" ? "default" :
                      apt.status === "Confirmed" ? "outline" : 
                      apt.status === "Scheduled" ? "outline" : 
                      apt.status === "Pending" ? "destructive" : "outline"}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`/prescription/${apt.id}`} className="w-full cursor-pointer">
                          <DropdownMenuItem className="cursor-pointer">Generate Prescription</DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
