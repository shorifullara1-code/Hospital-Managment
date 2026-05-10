import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Download, FileText, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const labsData = [
  {
    id: "LAB-8439",
    patient: "Theresa Webb",
    testName: "Complete Blood Count (CBC)",
    category: "Hematology",
    date: "2024-05-09",
    status: "Completed",
    doctor: "Dr. Jacob Jones",
  },
  {
    id: "LAB-8440",
    patient: "Ralph Edwards",
    testName: "Lipid Panel",
    category: "Biochemistry",
    date: "2024-05-09",
    status: "Processing",
    doctor: "Dr. Sarah Smith",
  },
  {
    id: "LAB-8441",
    patient: "Eleanor Pena",
    testName: "MRI Scan - Brain",
    category: "Radiology",
    date: "2024-05-08",
    status: "Reviewing",
    doctor: "Dr. Kristin Watson",
  },
  {
    id: "LAB-8442",
    patient: "Cody Fisher",
    testName: "Urinalysis",
    category: "Pathology",
    date: "2024-05-08",
    status: "Completed",
    doctor: "Dr. Guy Hawkins",
  },
];

export default function DiagnosticsView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostics & Labs</h1>
          <p className="text-muted-foreground">
            Manage lab requests, imaging, and diagnostic reports.
          </p>
        </div>
        <Button>
          <PlayCircle className="mr-2 h-4 w-4" />
          New Test Request
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-amber-500" />
              <div className="text-3xl font-bold">24</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="text-3xl font-bold">142</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-3xl font-bold">18</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Diagnostic Reports</CardTitle>
          <CardDescription>Track the status of recent lab tests and imaging.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test ID</TableHead>
                <TableHead>Patient / Doctor</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labsData.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="font-medium text-primary">{lab.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{lab.patient}</div>
                    <div className="text-xs text-muted-foreground">By {lab.doctor}</div>
                  </TableCell>
                  <TableCell>{lab.testName}</TableCell>
                  <TableCell>{lab.category}</TableCell>
                  <TableCell>{lab.date}</TableCell>
                  <TableCell>
                    <Badge variant={
                      lab.status === "Completed" ? "default" :
                      lab.status === "Processing" ? "secondary" : "outline"
                    }>
                      {lab.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={lab.status !== "Completed"}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
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
