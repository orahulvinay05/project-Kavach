import React, { useState, useRef } from 'react';
import { Lock, Upload, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { encryptTextAes256 } from '../services/cryptoUtils';
import { encodeImage } from '../services/stegoUtils';

const TabEncoder: React.FC = () => {
  const [message, setMessage] = useState("THE TARGET IS AT COORDINATES 34.0522, -118.2437. EXECUTION AT DAWN. AWAIT CONFIRMATION.");
  const [password, setPassword] = useState("");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSourceImage(url);
      setResultImage(null);
      setStatus(null);
    }
  };

  const handleEncode = async () => {
    if (!message || !password || !sourceImage) {
      setStatus({ type: 'error', msg: 'Missing inputs. Please provide message, key, and image.' });
      return;
    }

    setIsProcessing(true);
    setStatus(null);

    try {
      // 1. Encrypt with Mutated Key
      const encryptedB64 = await encryptTextAes256(message, password);
      
      // 2. Embed into Image
      const stegoUrl = await encodeImage(sourceImage, encryptedB64);
      
      setResultImage(stegoUrl);
      setStatus({ type: 'success', msg: 'Encoding Complete. Payload Hidden. Ready for Transmission.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Encoding failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" /> Message & Key
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Secret Battle Plan</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none h-32"
                placeholder="Enter your secret message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Encryption Key (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="SuperSecretKey123"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cover Image (PNG/JPG)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-slate-800 transition-colors"
              >
                {sourceImage ? (
                  <img src={sourceImage} alt="Preview" className="h-32 object-contain rounded" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-sm text-slate-500">Click to upload image</span>
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
          </div>
        </div>

        <button
          onClick={handleEncode}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${
            isProcessing 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20'
          }`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              EXECUTE ENCODE <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </button>

        {status && (
          <div className={`p-4 rounded-lg border flex items-start ${
            status.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-green-900/20 border-green-800 text-green-200'
          }`}>
             {status.type === 'success' ? <ShieldCheck className="w-5 h-5 mr-2 mt-0.5" /> : null}
             <span>{status.msg}</span>
          </div>
        )}
      </div>

      {/* Right Column: Output */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[400px]">
        {resultImage ? (
          <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 text-center">Encoded Image (Kavach-Stego.png)</h3>
            <div className="relative group rounded-lg overflow-hidden border border-slate-700">
              <img src={resultImage} alt="Stego Result" className="w-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-white font-medium">Visually Identical</span>
              </div>
            </div>
            <a 
              href={resultImage} 
              download="Kavach-Stego.png"
              className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg border border-slate-600 transition-colors flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" /> Download Image
            </a>
          </div>
        ) : (
          <div className="text-center text-slate-600">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Encoded output will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabEncoder;