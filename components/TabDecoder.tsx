import React, { useState, useRef } from 'react';
import { Unlock, Upload, FileText, AlertTriangle } from 'lucide-react';
import { decryptTextAes256 } from '../services/cryptoUtils';
import { decodeImage } from '../services/stegoUtils';

const TabDecoder: React.FC = () => {
  const [password, setPassword] = useState("");
  const [stegoImage, setStegoImage] = useState<string | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStegoImage(url);
      setDecryptedMessage(null);
      setError(null);
    }
  };

  const handleDecode = async () => {
    if (!password || !stegoImage) {
      setError('Missing inputs. Please upload the stego image and provide the key.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDecryptedMessage(null);

    try {
      // 1. Extract from Image
      const encryptedB64 = await decodeImage(stegoImage);
      
      // 2. Decrypt with Key Correction (Hacker Test logic)
      const plaintext = await decryptTextAes256(encryptedB64, password);
      
      setDecryptedMessage(plaintext);
    } catch (err: any) {
      setError(err.message || 'Decryption failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            <Unlock className="w-5 h-5 mr-2" /> Image & Key
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Stego Image (Kavach-Stego.png)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-slate-800 transition-colors"
              >
                {stegoImage ? (
                  <img src={stegoImage} alt="Preview" className="h-32 object-contain rounded" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-sm text-slate-500">Upload Stego Image</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Decryption Key (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Enter key to unlock..."
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleDecode}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${
            isProcessing 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20'
          }`}
        >
          {isProcessing ? (
             <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Decrypting...
            </>
          ) : (
            "INITIATE DECODE"
          )}
        </button>
      </div>

      {/* Right Column: Output */}
      <div className="space-y-4">
        <div className={`bg-slate-900 rounded-xl border ${error ? 'border-red-800' : 'border-slate-800'} p-6 min-h-[400px] flex flex-col`}>
          <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Decrypted Intelligence
          </h3>
          
          {decryptedMessage ? (
            <div className="flex-grow">
              <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4 mb-4">
                 <p className="text-emerald-300 font-bold mb-1">SUCCESS</p>
                 <p className="text-sm text-emerald-400/80">Payload authenticated. Integrity check passed.</p>
              </div>
              <textarea
                readOnly
                value={decryptedMessage}
                className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 text-emerald-100 font-mono text-sm resize-none focus:outline-none"
              />
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <div className="bg-red-900/20 p-4 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-red-400 font-bold text-lg mb-2">ACCESS DENIED</h4>
              <p className="text-slate-400 max-w-xs">{error}</p>
              {error.includes("Access Denied") && (
                <p className="text-xs text-slate-500 mt-4">System integrity maintained via Hacker Test protocol.</p>
              )}
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600">
               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                 <Unlock className="w-8 h-8 opacity-20" />
               </div>
               <p>Decrypted message will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabDecoder;