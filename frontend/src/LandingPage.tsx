import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tv, Sparkles, Clock, Library, Settings, Users } from "lucide-react";

import { Navigation } from "@/components/ui/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

// Feature data
const features = [
  {
    name: "CRT Simulation",
    description: "Authentic scanlines, phosphor glow, and warm vintage feel",
    icon: Tv,
    gradient: "from-blue-500/20 to-purple-500/20",
    colSpan: "col-span-3 md:col-span-2"
  },
  {
    name: "AI-Generated Ads",
    description: "Period-accurate commercials seamlessly baked into your content",
    icon: Sparkles,
    gradient: "from-purple-500/20 to-pink-500/20",
    colSpan: "col-span-3 md:col-span-1"
  },
  {
    name: "Time Travel",
    description: "Pick a decade and experience TV exactly as it was",
    icon: Clock,
    gradient: "from-pink-500/20 to-rose-500/20",
    colSpan: "col-span-3 md:col-span-1"
  },
  {
    name: "Content Library",
    description: "Curated collection of classic shows and movies",
    icon: Library,
    gradient: "from-indigo-500/20 to-blue-500/20",
    colSpan: "col-span-3 md:col-span-2"
  },
  {
    name: "Customization",
    description: "Adjust TV settings like color, contrast, and distortion",
    icon: Settings,
    gradient: "from-cyan-500/20 to-teal-500/20",
    colSpan: "col-span-3 md:col-span-1"
  },
  {
    name: "Social Viewing",
    description: "Watch parties with friends, just like the old days",
    icon: Users,
    gradient: "from-green-500/20 to-emerald-500/20",
    colSpan: "col-span-3 md:col-span-1"
  }
];

// How It Works steps
const steps = [
  { title: "Choose Your Era", description: "Select a decade from the 1950s to 1990s" },
  { title: "Pick Your Show", description: "Browse our library of classic TV shows" },
  { title: "Customize Your Set", description: "Adjust CRT settings to your preference" },
  { title: "Start Watching", description: "Sit back and enjoy authentic retro viewing" }
];

// Testimonials data
const testimonials = [
  {
    name: "Sarah M.",
    role: "Vintage TV Collector",
    quote: "RetroWatch takes me back to Saturday mornings in the 80s. The CRT effect is spot-on!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    name: "Mike D.",
    role: "Retro Gaming Enthusiast",
    quote: "Finally, a way to watch classic shows the way they were meant to be seen. Love it!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike"
  },
  {
    name: "Jennifer K.",
    role: "Design Professional",
    quote: "The AI-generated commercials are hilarious and surprisingly accurate!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer"
  }
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-950 min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6">
              Beta Access Available
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white"
          >
            Experience TV Like It's{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1985
            </span>{" "}
            Again
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto"
          >
            Relive the golden age of television with authentic CRT simulation and AI-generated period commercials
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <SignedOut>
              <SignUpButton mode="modal">
                <ShinyButton className="text-lg px-8 py-4">
                  Start Watching Free
                </ShinyButton>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                className="text-lg px-8 py-4"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </SignedIn>
          </motion.div>

        </div>

        {/* Product Mockup - Outside the constrained container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative w-full flex justify-center"
        >
          <img
            src="/product-mockup.png"
            alt="RetroWatch CRT TV Experience"
            className="min-w-[100vw] h-auto object-contain drop-shadow-[0_0_100px_rgba(59,130,246,0.5)]"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge className="mb-4">Features</Badge>
          <h2 className="text-4xl font-bold mb-4 text-white">Everything You Need</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Experience television the way it was meant to be watched
          </p>
        </div>

        <BentoGrid>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <BentoCard
                key={feature.name}
                name={feature.name}
                className={feature.colSpan}
                background={
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`} />
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative z-10 flex flex-col justify-end h-full p-6"
                >
                  <Icon className="w-12 h-12 mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold mb-2 text-white">{feature.name}</h3>
                  <p className="text-slate-300">{feature.description}</p>
                </motion.div>
              </BentoCard>
            );
          })}
        </BentoGrid>
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white">How It Works</h2>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-6"
            >
              {/* Number circle */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                {index + 1}
              </div>

              {/* Content card */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl font-bold mb-4 text-white">Loved by Retro Enthusiasts</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              See what people are saying about RetroWatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <img src={testimonial.avatar} alt={testimonial.name} />
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Travel Back in Time?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands experiencing TV the way it was meant to be watched
            </p>

            <SignedOut>
              <SignUpButton mode="modal">
                <ShinyButton
                  className="text-lg px-8 py-6"
                  background="rgba(255, 255, 255, 0.2)"
                >
                  Start Watching Free
                </ShinyButton>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-white/90"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </SignedIn>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground border-t">
        <p>&copy; 2025 RetroWatch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
