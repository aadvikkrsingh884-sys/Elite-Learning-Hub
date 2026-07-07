import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, Search, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Help() {
  const faqs = [
    {
      q: "How does the points system work?",
      a: "You earn points by completing topics, passing tests, and maintaining daily streaks. Points help you level up and unlock special achievement badges."
    },
    {
      q: "Can I use AuraLearning Elite offline?",
      a: "Currently, an internet connection is required to access the latest study materials, save your progress, and take adaptive tests."
    },
    {
      q: "How often are the Important Questions updated?",
      a: "Our question bank is updated monthly based on the latest CBSE curriculum changes, recent exam patterns, and historical board paper analysis."
    },
    {
      q: "What happens in Guest Mode?",
      a: "Guest mode gives you immediate access to view the platform, but your progress, bookmarks, and test results will not be saved. Create an account to track your journey."
    },
    {
      q: "How is the 'Class Average' calculated?",
      a: "The class average compares your performance on a specific test against all other students in your grade level across the platform who took the same test."
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 pt-4 pb-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground">How can we help?</h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
          Find answers, contact support, or chat with your AI Study Buddy.
        </p>
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search for answers..." 
            className="pl-10 h-14 rounded-xl text-lg shadow-sm border-primary/20 focus-visible:border-primary bg-card"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Support */}
        <Card className="border-border/50 shadow-sm dark:glass-card bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Contact Support</h3>
            <p className="text-muted-foreground font-medium mb-6 flex-1">
              Have a technical issue or need account assistance? Our team is ready to help you.
            </p>
            <Button className="w-full font-bold h-11 gap-2 shadow-sm">
              <Mail className="w-4 h-4" /> support@auralearning.com
            </Button>
          </CardContent>
        </Card>

        {/* Study Buddy CTA */}
        <Card className="border-border/50 shadow-sm dark:glass-card bg-success/5 border-success/20">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 text-success">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Study Buddy</h3>
            <p className="text-muted-foreground font-medium mb-6 flex-1">
              Stuck on a specific academic problem? Chat with our AI tutor for instant, step-by-step guidance.
            </p>
            <Button className="w-full font-bold h-11 gap-2 bg-success hover:bg-success/90 text-white shadow-sm">
              <MessageCircle className="w-4 h-4" /> Chat Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card className="border-border/50 shadow-sm dark:glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions about the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left font-bold hover:text-primary transition-colors py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <p className="text-sm font-bold text-muted-foreground">
          Built by Aadvik Kumar Singh. <a href="/creator" className="text-primary hover:underline inline-flex items-center gap-1">Meet the Developer <ExternalLink className="w-3 h-3" /></a>
        </p>
      </div>
    </div>
  );
}
