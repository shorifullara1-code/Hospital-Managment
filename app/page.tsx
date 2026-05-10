import { Users, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboardStats, recentAppointments, revenueData } from "@/lib/data";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Dr. Smith. Here's an overview of today's activities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {index === 0 ? <Users className="h-4 w-4 text-muted-foreground" /> :
               index === 1 ? <Calendar className="h-4 w-4 text-muted-foreground" /> :
               index === 2 ? <Activity className="h-4 w-4 text-muted-foreground" /> :
               <AlertCircle className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center ${stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : stat.trend === "down" ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview (Weekly Revenue)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <RevenueChart data={revenueData} />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>
              There are {dashboardStats[1].value} appointments scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="font-medium">{appointment.patient}</div>
                      <div className="text-xs text-muted-foreground md:hidden lg:block">
                        {appointment.doctor}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === "Completed" ? "secondary" : appointment.status === "In Progress" ? "default" : "outline"}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
