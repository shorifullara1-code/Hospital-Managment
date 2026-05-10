"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Save, Building, Paintbrush, ShieldCheck, Database, Users as UsersIcon, Plus, Trash2, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const availablePermissions = [
  { id: "dashboard", label: "Dashboard" },
  { id: "appointments", label: "Appointments" },
  { id: "patients", label: "Patients" },
  { id: "doctors", label: "Doctors" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "billing", label: "Billing" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" }
];

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [hospitalName, setHospitalName] = useState("MedCore Hospital");
  const [hospitalPhone, setHospitalPhone] = useState("+1 234 567 8900");
  const [hospitalEmail, setHospitalEmail] = useState("contact@medcore.com");
  const [hospitalAddress, setHospitalAddress] = useState("123 Health Avenue, Medical District, Cityville, State 12345");
  const [hospitalLogo, setHospitalLogo] = useState("");
  
  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "Staff",
    permissions: [] as string[]
  });

  const fetchStaff = async () => {
    if (!isAdmin) return;
    setStaffLoading(true);
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (!error && data) setStaffList(data);
    setStaffLoading(false);
  };

  useEffect(() => {
    fetchStaff();
    // ... existing initialization ...
    // Load from Supabase first, fallback to local storage
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('hospital_settings').select('*').eq('id', 1).single();
      
      if (data) {
        if (data.name) setHospitalName(data.name);
        if (data.phone) setHospitalPhone(data.phone);
        if (data.email) setHospitalEmail(data.email);
        if (data.address) setHospitalAddress(data.address);
        if (data.logo) setHospitalLogo(data.logo);
        
        // Update local storage cache
        localStorage.setItem('hospital_settings', JSON.stringify(data));
      } else {
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('hospital_settings');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.name !== undefined) setHospitalName(parsed.name);
              if (parsed.phone !== undefined) setHospitalPhone(parsed.phone);
              if (parsed.email !== undefined) setHospitalEmail(parsed.email);
              if (parsed.address !== undefined) setHospitalAddress(parsed.address);
              if (parsed.logo !== undefined) setHospitalLogo(parsed.logo);
            } catch (e) {
              console.error("Error parsing settings:", e);
            }
          }
        }
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const img = new Image();
         img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxDimension = 300;
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            setHospitalLogo(compressedBase64);
         };
         img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    const settingsData = {
      name: hospitalName,
      phone: hospitalPhone,
      email: hospitalEmail,
      address: hospitalAddress,
      logo: hospitalLogo
    };

    try {
      // Try to save to Supabase Database
      const { error } = await supabase.from('hospital_settings').upsert({ id: 1, ...settingsData });
      
      if (error) {
        console.error("Error saving to Supabase:", error);
        alert("Failed to save to database. Settings are only saved locally for now.");
      } else {
        alert("Settings saved successfully.");
      }

      // Always save to local storage as fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('hospital_settings', JSON.stringify(settingsData));
      }
    } catch (e) {
        console.error("Unexpected error saving settings:", e);
    } finally {
      setLoading(false);
    }
  };


  const handleAddStaff = async () => {
    if (!newStaff.username || !newStaff.password || !newStaff.full_name) {
      alert("Please fill in all fields.");
      return;
    }
    setStaffLoading(true);
    const { error } = await supabase.from('staff').insert([newStaff]);
    if (!error) {
      alert("Staff account created successfully!");
      setNewStaff({
        username: "",
        password: "",
        full_name: "",
        role: "Staff",
        permissions: [] as string[]
      });
      fetchStaff();
    } else {
      alert("Error: " + error.message);
    }
    setStaffLoading(false);
  };

  const handleDeleteStaff = async (id: string, username: string) => {
    if (username === 'admin') {
      alert("Cannot delete primary admin account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this staff account?")) return;
    
    setStaffLoading(true);
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) {
      fetchStaff();
    }
    setStaffLoading(false);
  };

  const togglePermission = (permId: string) => {
    setNewStaff(prev => {
      const isSelected = prev.permissions.includes(permId);
      if (isSelected) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage hospital configurations, system preferences, and security.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[620px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          {isAdmin && <TabsTrigger value="staff">Staff Management</TabsTrigger>}
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Building className="h-5 w-5 mr-2" /> Hospital Details</CardTitle>
              <CardDescription>
                Update your hospital's public information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hospital Logo</Label>
                <div className="flex items-center gap-4">
                  {hospitalLogo ? (
                    <img src={hospitalLogo} alt="Hospital Logo" className="h-16 w-16 object-contain border rounded p-1" />
                  ) : (
                    <div className="h-16 w-16 bg-muted flex items-center justify-center border rounded">
                      <span className="text-xs text-muted-foreground">No Logo</span>
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full max-w-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="hospital-name">Hospital Name</Label>
                <Input id="hospital-name" value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" value={hospitalEmail} onChange={e => setHospitalEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={hospitalPhone} onChange={e => setHospitalPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={hospitalAddress} onChange={e => setHospitalAddress(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Paintbrush className="h-5 w-5 mr-2" /> System Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
                </div>
                <Switch id="dark-mode" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing in tables and lists.</p>
                </div>
                <Switch id="compact-view" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={loading}>Save preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {isAdmin && (
          <TabsContent value="staff">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Plus className="h-5 w-5 mr-2" /> Add New Staff member</CardTitle>
                  <CardDescription>Create an account with specific ID/Password and access permissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Full Name</Label>
                       <Input value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                       <Label>Role</Label>
                       <select 
                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                         value={newStaff.role}
                         onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                       >
                         <option value="Staff">Staff member</option>
                         <option value="Admin">Administrator</option>
                       </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Log-in ID (Username)</Label>
                       <Input value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} placeholder="e.g. reception_1" />
                    </div>
                    <div className="space-y-2">
                       <Label>Password</Label>
                       <Input type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Permissions (Access Sections)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg border">
                      {availablePermissions.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`perm-${perm.id}`} 
                            checked={newStaff.permissions.includes(perm.id)} 
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer">{perm.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAddStaff} disabled={staffLoading}>
                    <Plus className="h-4 w-4 mr-2" /> Create Staff Account
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Staff Accounts</CardTitle>
                  <CardDescription>Manage your team's accounts and access levels.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">ID (Username)</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Access</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff) => (
                          <tr key={staff.id} className="border-b">
                            <td className="px-4 py-2 font-medium">{staff.full_name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{staff.username}</td>
                            <td className="px-4 py-2">
                               <Badge variant={staff.role === 'Admin' ? 'default' : 'secondary'}>{staff.role}</Badge>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {(staff.permissions || []).map((p: string) => (
                                  <Badge key={p} variant="outline" className="text-[10px] uppercase">{p}</Badge>
                                ))}
                                {staff.role === 'Admin' && <Badge variant="outline" className="text-[10px] uppercase">ALL ACCESS</Badge>}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteStaff(staff.id, staff.username)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2" /> Security Settings</CardTitle>
              <CardDescription>
                Manage two-factor authentication and data privacy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all doctor and admin accounts.</p>
                </div>
                <Switch id="2fa" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users after 30 minutes.</p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Database className="h-5 w-5 mr-2" /> Supabase Connection</CardTitle>
              <CardDescription>
                View connection details. Do not share your anon key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Project URL</Label>
                <div className="flex items-center gap-2">
                   <Input readOnly type="text" value={process.env.NEXT_PUBLIC_SUPABASE_URL || "Key hidden"} />
                   <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Anon Key</Label>
                <div className="flex items-center gap-2">
                   <Input readOnly type="password" value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "********" : ""} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
