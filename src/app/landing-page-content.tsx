"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { DynamicTestimonials } from "@/components/dynamic-testimonials";
import {
  VaultAnimation,
  PricingAnimation,
  StorageAnimation,
  AppPreview,
} from "@/components/animated-elements";
import {
  Check,
  Shield,
  Users,
  Upload,
  Zap,
  Lock,
  Globe,
  Clock,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPageContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  B
                </span>
              </div>
              <span className="text-xl font-bold text-foreground">Bona</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <a
                href="#security"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </a>
              <ThemeToggle />
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started Free</Button>
              </Link>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-9 w-9 px-0"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="#features"
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#security"
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Security
                </a>
                <div className="px-3 py-2 space-y-2">
                  <Link href="/sign-in">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>

        {/* Floating background elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-xl"
          animate={{
            y: [20, -20, 20],
            x: [10, -10, 10],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: 2,
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 bg-primary/10 text-primary border-primary/20"
              >
                Now with 50GB free storage
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Creative Asset Management Made{" "}
              <span className="text-primary">Simple</span> &{" "}
              <span className="text-secondary">Secure</span>
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Streamline your creative workflow with secure file sharing,
              real-time collaboration, and powerful project management tools.
              Start free today.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link href="/sign-up">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="text-lg px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 bg-transparent"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-center items-center text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <Check className="h-4 w-4 text-primary" />
                No credit card required
              </motion.div>
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <Check className="h-4 w-4 text-primary" />
                Setup in 60 seconds
              </motion.div>
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <Check className="h-4 w-4 text-primary" />
                50GB free storage
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              See Bona in action
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Get a glimpse of how Bona transforms your creative workflow with
              intuitive design and powerful features.
            </p>
          </motion.div>

          <AppPreview />
        </div>
      </section>

      {/* Value Proposition with Animations */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Why creative teams choose Bona
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Massive storage, unbreakable security, and pricing that makes
              sense.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center max-w-6xl mx-auto">
            {/* Storage Animation */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <StorageAnimation />
              <h3 className="text-xl font-bold text-foreground mb-4 mt-6">
                Massive Free Storage
              </h3>
              <p className="text-muted-foreground">
                Start with 50GB completely free. No tricks, no time limits. Just
                generous storage for your creative work.
              </p>
            </motion.div>

            {/* Security Animation */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <VaultAnimation />
              <h3 className="text-xl font-bold text-foreground mb-4 mt-6">
                Bank-Level Security
              </h3>
              <p className="text-muted-foreground">
                Your files are encrypted before they leave your device.
                Zero-knowledge architecture means complete privacy.
              </p>
            </motion.div>

            {/* Pricing Animation */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <PricingAnimation />
              <h3 className="text-xl font-bold text-foreground mb-4 mt-6">
                Affordable Pricing
              </h3>
              <p className="text-muted-foreground">
                Just $2/month for 500GB. No per-user fees, no hidden costs. Save
                hundreds compared to competitors.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Stop juggling scattered files across multiple platforms
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Creative teams waste hours searching for files, dealing with
              expensive storage, and managing complex collaboration workflows.
              Bona brings everything together.
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-destructive mb-6">
                The Problem
              </h3>
              {[
                {
                  title: "Files scattered everywhere",
                  description:
                    "Dropbox, Google Drive, email attachments - where did you save that logo again?",
                },
                {
                  title: "Expensive storage costs",
                  description:
                    "Paying $15-30/month per user for basic file storage and collaboration.",
                },
                {
                  title: "Security concerns",
                  description:
                    "Worried about sensitive creative assets being exposed or compromised.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-primary mb-6">
                The Solution
              </h3>
              {[
                {
                  title: "Unified workspace",
                  description:
                    "All your projects, files, and team collaboration in one secure place.",
                  icon: <Check className="h-6 w-6 text-primary" />,
                },
                {
                  title: "Generous free storage",
                  description:
                    "Start with 50GB free, then just $2/month for 500GB. No per-user fees.",
                  icon: <Check className="h-6 w-6 text-primary" />,
                },
                {
                  title: "Bank-level security",
                  description:
                    "End-to-end encryption with zero-knowledge architecture. Even we can't see your files.",
                  icon: <Check className="h-6 w-6 text-primary" />,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <div className="text-primary">{item.icon}</div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Everything you need for creative collaboration
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Powerful features designed specifically for creative teams,
              without the complexity.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Upload className="h-6 w-6" />,
                title: "Massive Free Storage",
                description:
                  "Start with 50GB free storage, then scale affordably. No hidden fees or per-user charges.",
                badge: "50GB Free",
                color: "primary",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Military-Grade Security",
                description:
                  "End-to-end encryption with zero-knowledge architecture. Your creative work stays private.",
                badge: "Zero-Knowledge",
                color: "secondary",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Effortless Collaboration",
                description:
                  "Invite team members, set permissions, and work together in real-time across all devices.",
                badge: "Real-time Sync",
                color: "accent",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "One-Click Simplicity",
                description:
                  "Upload, organize, and share files in seconds. No learning curve or complex setup required.",
                badge: "60s Setup",
                color: "primary",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full">
                  <CardHeader>
                    <motion.div
                      className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div className="text-primary">{feature.icon}</div>
                    </motion.div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed mb-4">
                      {feature.description}
                    </CardDescription>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {feature.badge}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Get started in 4 simple steps
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              From signup to collaboration in under 5 minutes.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Create Account",
                description:
                  "Sign up in 60 seconds with just your email. No credit card required.",
                icon: <Users className="h-6 w-6" />,
              },
              {
                step: "2",
                title: "Create Project",
                description:
                  "Organize your work by project. Keep everything structured and findable.",
                icon: <Upload className="h-6 w-6" />,
              },
              {
                step: "3",
                title: "Upload Files",
                description:
                  "Drag, drop, done. All file types supported with instant preview.",
                icon: <Globe className="h-6 w-6" />,
              },
              {
                step: "4",
                title: "Invite Team",
                description:
                  "Share projects securely with granular permission controls.",
                icon: <Shield className="h-6 w-6" />,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative mb-6">
                  <motion.div
                    className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    {item.step}
                  </motion.div>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border -translate-y-0.5"></div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <DynamicTestimonials />

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Transparent pricing that scales with you
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Start free, upgrade when you need more. No hidden fees or per-user
              charges.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 relative hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <div className="text-4xl font-bold text-foreground">
                    $0
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      "50GB storage",
                      "Unlimited projects",
                      "Basic collaboration",
                      "All file types",
                      "Mobile & desktop apps",
                      "Standard support",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <Button className="w-full bg-transparent" variant="outline">
                      Get Started Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/50 relative shadow-lg scale-105 hover:scale-110 transition-transform duration-300 h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <div className="text-4xl font-bold text-foreground">
                    $2
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <CardDescription>For growing creative teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      "500GB storage",
                      "Unlimited projects",
                      "Advanced permissions",
                      "Priority support",
                      "Version history",
                      "Team analytics",
                      "Coming: AI features",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <Button className="w-full">Start Pro Trial</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50 relative hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Enterprise</CardTitle>
                  <div className="text-4xl font-bold text-foreground">
                    Custom
                    <span className="text-lg font-normal text-muted-foreground"></span>
                  </div>
                  <CardDescription>For large organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      "Unlimited storage",
                      "Custom integrations",
                      "Dedicated support",
                      "White-label options",
                      "SSO & SAML",
                      "Custom contracts",
                      "99.9% SLA",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-transparent" variant="outline">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section id="security" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Your creative work is precious. We protect it like our own.
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Bank-level security with complete transparency about how we handle
              your data.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-8 w-8" />,
                title: "End-to-End Encryption",
                description:
                  "All files encrypted before leaving your device. Even we can't see your content.",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Zero-Knowledge Architecture",
                description:
                  "Your encryption keys stay with you. Complete privacy by design.",
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: "GDPR Compliant",
                description:
                  "European data protection standards with full user control over data.",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "99.9% Uptime SLA",
                description:
                  "Reliable access to your files when you need them most.",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "SOC 2 Type II",
                description:
                  "Independent security audits verify our commitment to protection.",
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Regular Security Audits",
                description:
                  "Continuous monitoring and improvement of our security practices.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50 text-center hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full">
                  <CardHeader>
                    <motion.div
                      className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div className="text-primary">{item.icon}</div>
                    </motion.div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              Start your free project today
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Join thousands of creatives who trust Bona with their most
              important work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/sign-up">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="text-lg px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 bg-transparent"
                >
                  Contact Sales
                </Button>
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Setup in 60 seconds • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    B
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">Bona</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Creative asset management made simple and secure for teams of
                all sizes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#security"
                    className="hover:text-foreground transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2024 Bona. All rights reserved. Made for creative teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
