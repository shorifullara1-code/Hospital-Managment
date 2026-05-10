import { Users, Calendar, Activity, CreditCard } from "lucide-react";

export const dashboardStats = [
  {
    title: "Total Patients",
    value: "1,284",
    icon: Users,
    trend: "up",
    change: "+12%"
  },
  {
    title: "Appointments",
    value: "84",
    icon: Calendar,
    trend: "up",
    change: "+4%"
  },
  {
    title: "Lab Tests",
    value: "42",
    icon: Activity,
    trend: "down",
    change: "-2%"
  },
  {
    title: "Revenue",
    value: "৳45,200",
    icon: CreditCard,
    trend: "up",
    change: "+18%"
  }
];

export const recentAppointments = [
  { id: "1", patientName: "Rahim Ali", doctorName: "Dr. Ahmed", status: "Completed", time: "09:00 AM" },
  { id: "2", patientName: "Sara Khan", doctorName: "Dr. Ahmed", status: "Pending", time: "10:30 AM" },
  { id: "3", patientName: "Karim Mia", doctorName: "Dr. Sultana", status: "In Progress", time: "11:15 AM" },
];

export const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];
