"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PharmacyPage() {
  const stock = [
    { id: 1, name: "Paracetamol 500mg", category: "Analgesic", quantity: 450, price: 5, status: "In Stock" },
    { id: 2, name: "Amoxicillin 250mg", category: "Antibiotic", quantity: 12, price: 15, status: "Low Stock" },
    { id: 3, name: "Cetirizine 10mg", category: "Antihistamine", quantity: 230, price: 8, status: "In Stock" },
    { id: 4, name: "Ibuprofen 400mg", category: "Analgesic", quantity: 0, price: 12, status: "Out of Stock" },
  ];

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory</h1>
          <p className="text-sm text-slate-500">Manage medicine stock and categories</p>
        </div>
        <Button className="bg-[#15807D] hover:bg-[#0E5C59]">
          <Plus className="mr-2 h-4 w-4" /> Add Medicine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-teal-50 border-teal-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-teal-600 font-medium">Total Products</p>
                <h3 className="text-2xl font-bold text-teal-900">1,245</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-amber-900">18</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                <h3 className="text-2xl font-bold text-red-900">5</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Medicine Stock</CardTitle>
            <CardDescription>Current available medicines in the pharmacy</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search medicine..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity} units</TableCell>
                  <TableCell>${item.price}</TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === "In Stock" ? "secondary" : 
                      item.status === "Low Stock" ? "outline" : "destructive"
                    }>
                      {item.status}
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
