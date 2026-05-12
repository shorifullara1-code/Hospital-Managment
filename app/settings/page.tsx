'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Building, 
  Mail, 
  MapPin, 
  Phone, 
  Settings as SettingsIcon,
  Shield,
  Activity,
  CheckCircle2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState({
    name: "MedCore Hospital",
    email: "contact@medcore.com",
    phone: "+1 234 567 890",
    address: "123 Health Ave, Medical City",
    dark_mode: false,
    compact_view: false,
    two_factor_auth: true,
    logo_url: ""
  });

  useEffect(() => {
    // Mock fetch settings
    const stored = localStorage.getItem('hospitalSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('hospitalSettings', JSON.stringify(settings));
      setSuccess(true);
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 max-w-4xl mx-auto">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon size={24} className="text-primary" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
          </div>
          <p className="text-slate-500">Configure global hospital parameters and preferences</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
          </button>
      </header>

      <div className="space-y-8">
        {/* Hospital Profile Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Building size={20} className="text-primary" />
              Hospital Profile
            </div>
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-1 text-emerald-600 text-sm font-bold"
                >
                  <CheckCircle2 size={16} /> Saved Successfully
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="mb-8">
              <label className="text-sm font-bold text-slate-600 block mb-3">Hospital Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                  {settings.logo_url ? (
                    <Image src={settings.logo_url} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon size={32} className="text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">Upload New Logo</p>
                  <p className="text-xs text-slate-500 mb-3">Square image, max 2MB (PNG, JPG)</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Hospital Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={settings.name}
                    onChange={e => setSettings({...settings, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={settings.email}
                    onChange={e => setSettings({...settings, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Phone Support</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={settings.phone}
                    onChange={e => setSettings({...settings, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Physical Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={settings.address}
                    onChange={e => setSettings({...settings, address: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
            <Activity size={20} className="text-primary" />
            System Preferences
          </div>
          <div className="p-8 space-y-2">
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold text-slate-800">Dark Interface</p>
                <p className="text-xs text-slate-500">Reduce eye strain in low-light environments</p>
              </div>
              <Switch 
                checked={settings.dark_mode} 
                onChange={(checked) => setSettings({...settings, dark_mode: checked})} 
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold text-slate-800">Compact Table View</p>
                <p className="text-xs text-slate-500">Show more data rows on patient screens</p>
              </div>
              <Switch 
                checked={settings.compact_view} 
                onChange={(checked) => setSettings({...settings, compact_view: checked})} 
              />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-amber-500">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-800">
            <Shield size={20} className="text-amber-600" />
            Security & Access
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold text-slate-800">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500">Secure staff accounts with mobile verification</p>
              </div>
              <Switch 
                checked={settings.two_factor_auth} 
                onChange={(checked) => setSettings({...settings, two_factor_auth: checked})} 
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={cn(
        "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
        checked ? "bg-primary" : "bg-slate-200"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ease-in-out",
        checked ? "left-7" : "left-1"
      )} />
    </button>
  );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}
