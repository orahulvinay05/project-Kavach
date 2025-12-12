import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import TabEncoder from './components/TabEncoder';
import TabDecoder from './components/TabDecoder';
import { AppMode } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.ENCODE);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                PROJECT KAVACH
              </h1>
              <p className="text-xs text-slate-500 font-mono tracking-wider">SECURE TRANSMISSION PROTOCOL</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8 max-w-md mx-auto border border-slate-700">
          <button
            onClick={() => setActiveTab(AppMode.ENCODE)}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === AppMode.ENCODE
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 mr-2" /> Sender (Encode)
          </button>
          <button
            onClick={() => setActiveTab(AppMode.DECODE)}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === AppMode.DECODE
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 mr-2" /> Receiver (Decode)
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {activeTab === AppMode.ENCODE ? <TabEncoder /> : <TabDecoder />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-600 text-sm">
        <p>Project Kavach &copy; {new Date().getFullYear()} | Secure Steganography & AES-256 Implementation</p>
      </footer>
    </div>
  );
};

export default App;