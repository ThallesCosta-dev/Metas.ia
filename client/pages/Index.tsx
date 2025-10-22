import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, BarChart3, Calendar, Trophy, Zap, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const [stats] = useState({
    totalGoals: 1247,
    completionRate: 87,
    activeUsers: 5432,
  });

  const features = [
    {
      icon: Target,
      title: "Smart Goal Management",
      description: "Create and track goals with detailed descriptions, deadlines, and categories.",
    },
    {
      icon: TrendingUp,
      title: "Financial Tracking",
      description: "Monitor financial goals with real-time currency conversion and progress charts.",
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Sync your goals with Google Calendar, Apple Calendar, or export as .ics files.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Gain insights with detailed statistics, progress trends, and productivity analysis.",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn achievements, build streaks, and unlock badges as you reach your goals.",
    },
    {
      icon: Zap,
      title: "Subgoals & Dependencies",
      description: "Break down complex goals into manageable subgoals with dependency tracking.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      quote: "This app completely transformed how I manage my goals. I've never been more organized.",
      image: "SC",
    },
    {
      name: "Marcus Johnson",
      role: "Entrepreneur",
      quote: "The financial tracking feature alone is worth it. Real-time currency conversion is a game-changer.",
      image: "MJ",
    },
    {
      name: "Emma Rodriguez",
      role: "Student",
      quote: "The calendar integration saved me from missing deadlines. Highly recommend!",
      image: "ER",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Metas</span>
          </div>
          <Link to="/dashboard">
            <Button size="sm" className="gap-2">
              Launch App
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute -bottom-40 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">New: AI-powered goal suggestions</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                Achieve Your Goals,
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Reach Your Dreams
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The modern platform for goal management with financial tracking, calendar integration, and AI-powered insights. Set, track, and celebrate your achievements.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  Start Free
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-16">
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.totalGoals.toLocaleString()}+</div>
                <p className="text-sm text-muted-foreground">Goals Created</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.completionRate}%</div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.activeUsers.toLocaleString()}+</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to set, track, and achieve your goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative py-20 md:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Goals",
                description: "Set up goals with titles, descriptions, deadlines, and categories. Choose between financial and non-financial goals.",
              },
              {
                step: "02",
                title: "Track Progress",
                description: "Monitor your progress with visual charts, subgoals, and detailed analytics. Get insights on your productivity.",
              },
              {
                step: "03",
                title: "Celebrate Success",
                description: "Earn achievements and badges as you reach milestones. Share your success with your community.",
              },
            ].map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="text-4xl font-bold text-primary/20">{item.step}</div>
                <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">Loved by Users</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people achieving their goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 rounded-xl border border-border/60 bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-foreground">{testimonial.image}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 md:py-32 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Ready to achieve your goals?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of goal-achievers today. No credit card required.
            </p>
          </div>
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              Start Your Journey
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">Metas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The modern platform for goal management and achievement.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Features</a></li>
                <li><a href="#" className="hover:text-primary transition">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition">Security</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">About</a></li>
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2024 Metas. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition">Twitter</a>
              <a href="#" className="hover:text-primary transition">LinkedIn</a>
              <a href="#" className="hover:text-primary transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
