import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Star, Target, Zap, Clock, Calendar, CheckCircle2, Shield, Settings, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { student, isGuest } = useAuth();
  
  if (isGuest) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-2">
          <Shield className="w-12 h-12 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-3xl font-black">Guest Mode Active</h2>
        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
          Create a free account to track your progress, earn points, and unlock personalized study paths.
        </p>
        <Button size="lg" className="font-bold w-full h-14 shadow-md rounded-xl mt-4">Create Account Now</Button>
      </div>
    );
  }

  const joinDate = student?.createdAt ? format(new Date(student.createdAt), 'MMMM yyyy') : 'Recently';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Identity & Editing */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card className="border-border/50 shadow-sm dark:glass-card overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary to-accent/80 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
            <CardContent className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
              <div className="relative -mt-16 mb-4 group cursor-pointer">
                <Avatar className="w-32 h-32 border-4 border-card shadow-lg dark:border-background">
                  <AvatarImage src={student?.avatarUrl || ''} />
                  <AvatarFallback className="bg-muted text-4xl font-black text-foreground">
                    {student?.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-black tracking-tight mb-1">{student?.name || 'Aura Scholar'}</h2>
              <p className="text-muted-foreground font-medium mb-4">{student?.email}</p>
              
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-primary/20 dark:neon-border mb-6">
                Class {student?.classLevel || 8} Student
              </Badge>
              
              <div className="w-full grid grid-cols-2 gap-4 border-t border-border/50 pt-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-accent dark:text-primary">
                    <Trophy className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-2xl font-black leading-none mt-2">{student?.points || 0}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Points</p>
                </div>
                <div className="space-y-1 border-l border-border/50">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-lg font-black leading-none mt-2 pt-1">{joinDate}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-0.5">Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm dark:glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" /> Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input id="name" defaultValue={student?.name} className="bg-muted/30 font-semibold h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class Level</Label>
                <Input id="class" defaultValue={student?.classLevel} type="number" className="bg-muted/30 font-semibold h-11" />
              </div>
              <Button className="w-full font-bold mt-2 shadow-sm">Save Changes</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Badges */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm bg-card hover-elevate transition-all dark:glass-card">
              <CardContent className="p-5 flex flex-col justify-center gap-2 h-full">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-black">24</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tests Taken</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm bg-card hover-elevate transition-all dark:glass-card">
              <CardContent className="p-5 flex flex-col justify-center gap-2 h-full">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <p className="text-3xl font-black">85%</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Accuracy</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm bg-card hover-elevate transition-all dark:glass-card">
              <CardContent className="p-5 flex flex-col justify-center gap-2 h-full">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-accent fill-accent/20" />
                </div>
                <p className="text-3xl font-black">12</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Day Streak</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-sm dark:glass-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">Achievement Badges</CardTitle>
                <Badge variant="outline" className="font-bold border-border/50">4 Unlocked</Badge>
              </div>
              <CardDescription>Badges earned through consistent practice and excellence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "First Step", icon: "🌱", color: "bg-success/10 text-success border-success/20", desc: "Completed first topic" },
                  { name: "Math Wizard", icon: "📐", color: "bg-primary/10 text-primary border-primary/20", desc: "100% in 5 math tests" },
                  { name: "Streak Starter", icon: "🔥", color: "bg-accent/10 text-accent border-accent/20", desc: "7 day active streak" },
                  { name: "Perfect Score", icon: "💯", color: "bg-chart-4/10 text-chart-4 border-chart-4/20", desc: "Scored 100% on a test" },
                  { name: "Science Guru", icon: "🔬", color: "bg-muted text-muted-foreground opacity-50 border-border/50", desc: "Locked", locked: true },
                  { name: "Night Owl", icon: "🦉", color: "bg-muted text-muted-foreground opacity-50 border-border/50", desc: "Locked", locked: true },
                ].map((badge, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${badge.color} ${!badge.locked && 'hover:scale-105 shadow-sm cursor-pointer'}`}>
                    <span className="text-3xl mb-1 filter drop-shadow-sm">{badge.icon}</span>
                    <h4 className="font-bold text-sm leading-tight text-foreground">{badge.name}</h4>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-auto">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
