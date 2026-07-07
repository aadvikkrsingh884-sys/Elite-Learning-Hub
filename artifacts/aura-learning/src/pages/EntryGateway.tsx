import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EntryGateway() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('demo@auralearning.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClass, setRegClass] = useState('8');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email: loginEmail, password: loginPassword } }, {
      onSuccess: (data) => {
        setAuthContext(data.student, data.token);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation('/dashboard');
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.message || "Invalid credentials. Try demo@auralearning.com / password123",
          variant: "destructive"
        });
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ 
      data: { 
        name: regName, 
        email: regEmail, 
        password: regPassword, 
        classLevel: parseInt(regClass) 
      } 
    }, {
      onSuccess: (data) => {
        setAuthContext(data.student, data.token);
        toast({ title: "Welcome to AuraLearning!", description: "Account created successfully." });
        setLocation('/dashboard');
      },
      onError: (error: any) => {
        toast({ 
          title: "Registration failed", 
          description: error?.message || "Please check your information and try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleGuestLogin = () => {
    setAuthContext({
      id: 0,
      name: "Guest",
      email: "",
      classLevel: 8,
      points: 0,
      createdAt: new Date().toISOString()
    });
    toast({ title: "Guest Mode", description: "Progress will not be saved." });
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left side - Visual/Branding */}
      <div className="hidden md:flex flex-col flex-1 relative overflow-hidden bg-primary items-center justify-center p-12 text-primary-foreground">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent/90 mix-blend-multiply" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.4),transparent_50%)]" />
        </div>
        
        <div className="relative z-10 w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">AuraLearning</h1>
              <p className="text-xl font-bold text-accent drop-shadow-sm">Elite</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight text-white/90">
              Master CBSE Classes 6-10 with precision and confidence.
            </h2>
            <p className="text-lg text-white/70 font-medium max-w-md">
              A premium study companion built for ambitious Indian students. Data-rich, focused, and rewarding.
            </p>
          </div>
          
          <div className="pt-8 flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <Sparkles className="w-6 h-6 text-accent mb-2" />
              <h3 className="font-bold text-white">Smart Analysis</h3>
              <p className="text-sm text-white/70">Track mastery across every topic</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <TrophyIcon className="w-6 h-6 text-secondary mb-2" />
              <h3 className="font-bold text-white">Reward System</h3>
              <p className="text-sm text-white/70">Earn points for every milestone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-1000 relative">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-foreground">AuraLearning <span className="text-accent">Elite</span></h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">Master CBSE Classes 6-10</p>
          </div>

          <Card className="border-border/50 shadow-xl dark:glass-card overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-6 pb-2">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-lg">
                  <TabsTrigger value="login" className="rounded-md font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">Login</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-md font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="login" className="m-0 focus-visible:outline-none">
                <form onSubmit={handleLogin}>
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="student@example.com" 
                        required 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full font-bold h-11" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login to Portal"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="register" className="m-0 focus-visible:outline-none">
                <form onSubmit={handleRegister}>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>Start your journey to academic excellence.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Aarav Sharma" 
                        required 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classLevel">Class</Label>
                      <Select value={regClass} onValueChange={setRegClass}>
                        <SelectTrigger className="bg-muted/30 focus-visible:bg-transparent transition-colors">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {[6, 7, 8, 9, 10].map(level => (
                            <SelectItem key={level} value={level.toString()}>Class {level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="student@example.com" 
                        required 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password (min 6 chars)</Label>
                      <Input 
                        id="reg-password" 
                        type="password" 
                        required 
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="bg-muted/30 focus-visible:bg-transparent transition-colors"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full font-bold h-11" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-bold tracking-wider">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 font-bold group border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleGuestLogin}
            type="button"
          >
            Continue as Guest
            <ArrowRight className="ml-2 w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
          
          <p className="text-center text-xs text-muted-foreground font-medium">
            Guest mode provides immediate access but progress will not be saved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple icon for the UI
function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 3 7 6 7s6-1 6-7V2z" />
    </svg>
  );
}
