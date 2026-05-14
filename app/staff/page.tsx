"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Check, X, Clock, Calendar as CalendarIcon, UserPlus, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

type Staff = {
  id: string;
  staff_id: string;
  full_name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  status: string;
};

type Attendance = {
  id: string;
  staff_id: string;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Leave';
  notes?: string;
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  
  // Daily Attendance state
  const [attendanceDate, setAttendanceDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});
  
  // Monthly Summary state
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    department: "",
    phone: "",
    email: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .order("full_name");
      
    if (staffError) {
      console.error("Failed to fetch staff");
    } else {
      setStaffList(staff || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDailyAttendance = async () => {
    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("attendance_date", attendanceDate);
      
    if (!error && data) {
      const attendanceMap: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      data.forEach((rec: Attendance) => {
        attendanceMap[rec.staff_id] = rec.status;
      });
      setDailyAttendance(attendanceMap);
    } else {
      setDailyAttendance({});
    }
  };

  useEffect(() => {
    fetchDailyAttendance();
  }, [attendanceDate]);

  const fetchMonthlyAttendance = async () => {
    const start = startOfMonth(new Date(selectedMonth));
    const end = endOfMonth(new Date(selectedMonth));
    
    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .gte("attendance_date", format(start, "yyyy-MM-dd"))
      .lte("attendance_date", format(end, "yyyy-MM-dd"));
      
    if (!error && data) {
      setAttendanceRecords(data as Attendance[]);
    }
  };

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [selectedMonth]);

  async function handleRegisterStaff(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    
    const staffId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { data, error } = await supabase
      .from("staff")
      .insert([{
        ...formData,
        staff_id: staffId,
        status: "Active"
      }])
      .select();

    if (error) {
      console.error("Error registering staff: ", error.message);
    } else {
      setIsRegisterOpen(false);
      setFormData({ full_name: "", designation: "", department: "", phone: "", email: "" });
      fetchData();
    }
    setRegistering(false);
  }

  async function handleUpdateAttendance(staffId: string, status: 'Present' | 'Absent' | 'Leave') {
    setDailyAttendance(prev => ({ ...prev, [staffId]: status }));
  }

  async function saveDailyAttendance() {
    setSavingAttendance(true);
    const updates = Object.entries(dailyAttendance).map(([staffId, status]) => ({
      staff_id: staffId,
      attendance_date: attendanceDate,
      status: status
    }));

    const { error } = await supabase
      .from("staff_attendance")
      .upsert(updates, { onConflict: 'staff_id,attendance_date' });

    if (error) {
      console.error("Failed to save attendance: ", error.message);
    } else {
      fetchMonthlyAttendance(); // Update summary if on same month
    }
    setSavingAttendance(false);
  }

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => 
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.staff_id.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase())
    );
  }, [staffList, search]);

  // Monthly summary calculations
  const monthlySummary = useMemo(() => {
    const summary: Record<string, { present: number; absent: number; leave: number }> = {};
    
    attendanceRecords.forEach(rec => {
      if (!summary[rec.staff_id]) {
        summary[rec.staff_id] = { present: 0, absent: 0, leave: 0 };
      }
      
      if (rec.status === 'Present') summary[rec.staff_id].present++;
      else if (rec.status === 'Absent') summary[rec.staff_id].absent++;
      else if (rec.status === 'Leave') summary[rec.staff_id].leave++;
    });
    
    return summary;
  }, [attendanceRecords]);

  if (loading && staffList.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Register</h1>
          <p className="text-muted-foreground font-medium">Manage hospital staff and their attendance records.</p>
        </div>
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <DialogTrigger render={<Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold" />}>
            <UserPlus className="mr-2 h-4 w-4" />
            Register Staff
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Register Staff</DialogTitle>
              <DialogDescription>
                Enter the details of the new staff member.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegisterStaff} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Employee Full Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Nurse"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. General"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={registering}>
                {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-2">
          <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Staff List</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Daily Attendance</TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-800">All Staff Members</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search staff..."
                    className="pl-8 h-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-slate-200">
                    <TableHead className="font-bold text-slate-700">ID</TableHead>
                    <TableHead className="font-bold text-slate-700">Name</TableHead>
                    <TableHead className="font-bold text-slate-700">Designation</TableHead>
                    <TableHead className="font-bold text-slate-700">Department</TableHead>
                    <TableHead className="font-bold text-slate-700">Contact</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium font-mono text-xs">{staff.staff_id}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{staff.full_name}</TableCell>
                      <TableCell>{staff.designation}</TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p className="font-medium">{staff.phone}</p>
                          <p className="text-muted-foreground">{staff.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.status === "Active" ? "default" : "secondary"}>
                          {staff.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <Card>
            <CardHeader className="py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-slate-800">Daily Attendance Tracking</CardTitle>
                  <CardDescription>Select a date to mark attendance for all staff.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-slate-500 ml-2" />
                    <Input
                      type="date"
                      className="border-none bg-transparent shadow-none h-8 w-40 focus-visible:ring-0"
                      value={attendanceDate}
                      onChange={e => setAttendanceDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={saveDailyAttendance} 
                    disabled={savingAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {savingAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Save Attendance
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Staff ID</TableHead>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Designation</TableHead>
                    <TableHead className="font-bold text-center">Status (Click to Mark)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.filter(s => s.status === 'Active').map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs">{staff.staff_id}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{staff.full_name}</TableCell>
                      <TableCell>{staff.designation}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant={dailyAttendance[staff.id] === 'Present' ? "default" : "outline"}
                            className={dailyAttendance[staff.id] === 'Present' ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => handleUpdateAttendance(staff.id, 'Present')}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={dailyAttendance[staff.id] === 'Absent' ? "destructive" : "outline"}
                            onClick={() => handleUpdateAttendance(staff.id, 'Absent')}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={dailyAttendance[staff.id] === 'Leave' ? "secondary" : "outline"}
                            className={dailyAttendance[staff.id] === 'Leave' ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" : ""}
                            onClick={() => handleUpdateAttendance(staff.id, 'Leave')}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Leave
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <Card>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-800">Monthly Attendance Summary</CardTitle>
                  <CardDescription>View aggregated attendance statistics for the month.</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                   <Input
                    type="month"
                    className="border-none bg-transparent shadow-none h-9 w-40 focus-visible:ring-0"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Staff ID</TableHead>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Designation</TableHead>
                    <TableHead className="font-bold text-center">Present</TableHead>
                    <TableHead className="font-bold text-center">Absent</TableHead>
                    <TableHead className="font-bold text-center">Leave</TableHead>
                    <TableHead className="font-bold text-center">Total Working Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => {
                    const stats = monthlySummary[staff.id] || { present: 0, absent: 0, leave: 0 };
                    return (
                      <TableRow key={staff.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-xs">{staff.staff_id}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{staff.full_name}</TableCell>
                        <TableCell>{staff.designation}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{stats.present}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{stats.absent}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{stats.leave}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {stats.present + stats.absent + stats.leave}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
