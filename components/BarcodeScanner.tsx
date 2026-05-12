'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner;
    
    if (scannerRef.current) {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          onResult(decodedText);
          html5QrcodeScanner.clear();
        },
        (errorMessage) => {
          // ignore stream errors as they are frequent when looking for a barcode
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error(e));
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Camera size={20} className="text-primary" />
            Scan Barcode
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-hidden rounded-2xl bg-slate-100 border-2 border-slate-200">
           <div id="barcode-reader" ref={scannerRef} className="w-full"></div>
        </div>
        <p className="text-xs text-center text-slate-500 mt-4 font-medium italic">Position the barcode inside the frame</p>
      </div>
    </div>
  );
}
