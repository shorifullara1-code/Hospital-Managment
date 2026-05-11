"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Save, Building, Paintbrush, ShieldCheck, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsView() {
  const [loading, setLoading] = useState(false);

  const [hospitalName, setHospitalName] = useState("MedCore Hospital");
  const [hospitalPhone, setHospitalPhone] = useState("+1 234 567 8900");
  const [hospitalEmail, setHospitalEmail] = useState("contact@medcore.com");
  const [hospitalAddress, setHospitalAddress] = useState("123 Health Avenue, Medical District, Cityville, State 12345");
  const [hospitalLogo, setHospitalLogo] = useState("");

  useEffect(() => {
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


  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage hospital configurations, system preferences, and security.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
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
