import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Mail, Phone, ExternalLink, Sparkles, Terminal } from 'lucide-react';

export default function Creator() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-4xl relative">
        {/* Decorative background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-amber-500/20 blur-[100px] rounded-full z-0 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-amber-400/20 blur-[80px] rounded-full z-0 pointer-events-none" />
        
        <div className="relative z-10 p-[2px] rounded-2xl bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 shadow-2xl">
          <Card className="bg-[#0f1115] border-0 rounded-2xl overflow-hidden shadow-inner h-full text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
            
            <div className="flex flex-col md:flex-row h-full">
              {/* Left visual column */}
              <div className="w-full md:w-2/5 relative p-8 md:p-12 flex flex-col justify-center items-center text-center bg-black/40 border-r border-white/5">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                
                <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-6 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                  <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-amber-200 to-amber-600 font-serif">
                    AKS
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">
                  Aadvik Kumar Singh
                </h1>
                
                <p className="text-amber-400 font-bold tracking-widest uppercase text-xs mb-6">
                  Visionary Innovator
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/80">Class 9 Student</span>
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400">Full-Stack Dev</span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/80">CBSE Scholar</span>
                </div>
              </div>
              
              {/* Right content column */}
              <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                <Sparkles className="w-8 h-8 text-amber-500 mb-6 opacity-80" />
                
                <p className="text-lg md:text-xl font-medium leading-relaxed text-white/80 mb-8 font-serif">
                  <span className="text-amber-400 font-bold">Aadvik Kumar Singh</span> is a brilliant Class 9th student, visionary innovator, and Full-Stack App Developer from Buxar, Bihar. 
                  <br /><br />
                  Studying under the CBSE board curriculum, Aadvik has seamlessly balanced his rigorous academic life with an unyielding passion for software engineering and application architecture, single-handedly designing and building <strong className="text-white font-black">AuraLearning Elite</strong> to help students across India master their classes.
                </p>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm mt-auto">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Connect & Collaborate
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-white/70 font-medium">
                      For partnerships, educational feedback, or technical support, contact the developer directly:
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a href="tel:+919122522099" className="flex-1">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          <Phone className="w-4 h-4 mr-2" /> +91 9122522099
                        </Button>
                      </a>
                      <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                        <Mail className="w-4 h-4 mr-2" /> Email Developer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
