import React from "react";
import { Database, Server, Smartphone, Cpu, Cloud, Layers, BarChart, Globe, Zap, ArrowRight, FileText, Brain } from "lucide-react";

export const MVPArchitecture = () => {
  return (
    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 overflow-x-auto">
      <div className="min-w-[600px] flex flex-col md:flex-row items-center justify-between gap-8 relative">
        
        {/* Frontend */}
        <div className="flex flex-col items-center gap-4 z-10 w-48">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full text-center">
            <Smartphone className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-bold text-gray-900">Frontend MVP</h3>
            <p className="text-xs text-gray-500 mt-1">React + Vercel</p>
          </div>
        </div>

        {/* Connector */}
        <div className="hidden md:flex flex-1 h-[2px] bg-gray-300 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100 px-2 text-xs text-gray-500 font-mono">
                API Calls
             </div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300">
                <ArrowRight size={16} />
             </div>
        </div>
        <div className="md:hidden h-12 w-[2px] bg-gray-300"></div>

        {/* Firebase */}
        <div className="flex flex-col items-center gap-4 z-10 w-48">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full text-center">
            <Database className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <h3 className="font-bold text-gray-900">Firebase</h3>
            <p className="text-xs text-gray-500 mt-1">Auth + Firestore</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">Rapid Prototyping</span>
          </div>
        </div>

        {/* Connector */}
        <div className="hidden md:flex flex-1 h-[2px] bg-gray-300 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100 px-2 text-xs text-gray-500 font-mono">
                Prompt/Response
             </div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300">
                <ArrowRight size={16} />
             </div>
        </div>
         <div className="md:hidden h-12 w-[2px] bg-gray-300"></div>

        {/* AI Providers */}
        <div className="flex flex-col items-center gap-4 z-10 w-48">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <Brain className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h3 className="font-bold text-gray-900">AI Orchestration</h3>
            <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs bg-gray-50 border border-gray-100 rounded py-1">Google Gemini (Free)</span>
                <span className="text-xs bg-gray-50 border border-gray-100 rounded py-1">OpenRouter (Fallback)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FutureArchitecture = () => {
  return (
    <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 overflow-x-auto">
      <div className="min-w-[700px] grid grid-cols-3 gap-8 relative">
        
        {/* Column 1: Client */}
        <div className="flex flex-col gap-4">
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="text-blue-400" size={20} />
                    <span className="text-white font-bold">React Client</span>
                </div>
                <p className="text-gray-400 text-sm">Rich UI, Charts, Interactive Learning</p>
            </div>
        </div>

        {/* Column 2: Backend */}
        <div className="flex flex-col gap-4 relative">
             <div className="bg-gray-800 p-5 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <div className="flex items-center gap-3 mb-2">
                    <Server className="text-green-400" size={20} />
                    <span className="text-white font-bold">Node.js API</span>
                </div>
                <p className="text-gray-400 text-sm">Auth, Rate Limiting, Business Logic</p>
            </div>
            
            <div className="flex justify-center my-2">
                 <ArrowRight className="rotate-90 text-gray-600" />
            </div>

            <div className="bg-gray-800 p-5 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                    <Zap className="text-yellow-400" size={20} />
                    <span className="text-white font-bold">Batch Pipelines</span>
                </div>
                <p className="text-gray-400 text-sm">Daily Market Analysis, Idolent Jobs</p>
            </div>
        </div>

        {/* Column 3: Data & AI */}
        <div className="flex flex-col gap-4">
             <div className="bg-gray-800 p-5 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                    <Database className="text-purple-400" size={20} />
                    <span className="text-white font-bold">Vector DB (RAG)</span>
                </div>
                <p className="text-gray-400 text-sm">News, History, Reflections</p>
            </div>
            
             <div className="bg-gray-800 p-5 rounded-lg border border-gray-600 mt-4">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="text-pink-400" size={20} />
                    <span className="text-white font-bold">Multi-Model AI</span>
                </div>
                <p className="text-gray-400 text-sm">Sentiment Comparison, Credibility Scoring</p>
            </div>
        </div>
      </div>
    </div>
  );
};
