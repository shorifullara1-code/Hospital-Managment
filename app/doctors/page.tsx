"use client";

import { doctorsData } from "@/lib/doctors-data";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DoctorsView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">
            Manage doctors, their specialties, and appointment fees.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger className={buttonVariants()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Register Doctor
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register Doctor</DialogTitle>
              <DialogDescription>
                Enter the doctor's details and set their appointment fee.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Dr. John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="speciality">Speciality</Label>
                <Input id="speciality" placeholder="e.g. Cardiology" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qualification">Qualifications</Label>
                <Input id="qualification" placeholder="e.g. MBBS, FACC" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fee">Appointment Fee ($)</Label>
                <Input id="fee" type="number" placeholder="50" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">Register Doctor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Registered Doctors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or specialty..."
                  className="pl-8 h-9"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Speciality</TableHead>
                <TableHead>Qualifications</TableHead>
                <TableHead>Appt. Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorsData.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.id}</TableCell>
                  <TableCell className="font-bold">{doctor.name}</TableCell>
                  <TableCell>{doctor.speciality}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doctor.qualification}</TableCell>
                  <TableCell>${doctor.fee}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.status === "Active" ? "default" : "secondary"}>
                      {doctor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
