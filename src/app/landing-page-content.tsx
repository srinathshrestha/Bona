"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  FolderOpen,
  Zap,
  FileText,
  MessageSquare,
  CheckCircle,
  Star,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInScale = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp} className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                  Creative Asset Management
                </h1>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-primary">
                  Made Simple & Free
                </h2>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4"
              >
                Streamline your creative workflow with secure file sharing,
                real-time collaboration, and powerful project management tools.
                Built specifically for content creators, designers, and creative
                teams.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center px-4"
              >
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 group hover:bg-primary/90 transition-colors"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 group hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <PlayCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>100% Free Forever</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Setup in 2 Minutes</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              Everything You Need to Create
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Powerful features designed to supercharge your creative workflow
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Shield,
                title: "Secure File Sharing",
                description:
                  "Share large media files securely with enterprise-grade encryption and role-based access control",
              },
              {
                icon: Users,
                title: "Real-time Collaboration",
                description:
                  "Work together with your team through real-time messaging, comments, and file sharing",
              },
              {
                icon: FolderOpen,
                title: "Project Management",
                description:
                  "Organize your creative assets by projects with team-based workflows and deadlines",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Upload, preview, and share files instantly with our optimized cloud infrastructure",
              },
              {
                icon: FileText,
                title: "Version Control",
                description:
                  "Track changes, manage versions, and never lose your creative work with automatic backups",
              },
              {
                icon: MessageSquare,
                title: "Team Communication",
                description:
                  "Built-in messaging system to discuss projects, share feedback, and stay connected",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInScale}
                className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Why Choose Bona?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of creative professionals who trust Bona for
                  their asset management needs
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-6">
                {[
                  {
                    title: "100% Free Forever",
                    description:
                      "No hidden fees, no subscription costs. Full access to all features completely free.",
                  },
                  {
                    title: "Built for Creatives",
                    description:
                      "Designed specifically for video creators, designers, and creative teams who need reliable asset management.",
                  },
                  {
                    title: "Enterprise Security",
                    description:
                      "Your files are protected with bank-level encryption and secure cloud storage.",
                  },
                  {
                    title: "No Learning Curve",
                    description:
                      "Intuitive interface that your team can start using immediately without training.",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-card border rounded-2xl p-8 shadow-xl"
            >
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                  <Star className="h-4 w-4 fill-current" />
                  Free Plan
                </div>

                <div>
                  <div className="text-4xl font-bold text-foreground">$0</div>
                  <div className="text-muted-foreground">Forever</div>
                </div>

                <div className="space-y-3 text-left">
                  {[
                    "Unlimited projects",
                    "10GB storage per project",
                    "Real-time collaboration",
                    "Team messaging",
                    "Version control",
                    "24/7 support",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/sign-up" className="block">
                  <Button className="w-full" size="lg">
                    Start Creating for Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-foreground"
            >
              Ready to Transform Your Creative Workflow?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Join thousands of creators who have already streamlined their
              asset management with Bona. Get started today - completely free,
              no credit card required.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6"
                >
                  Sign In to Your Account
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-foreground">Bona</div>
            <p className="text-muted-foreground">
              Collaborative Media Asset Management Platform for Creative Teams
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span>
                Built for video creators, designers, and creative teams
              </span>
              <span>•</span>
              <span>100% Free Forever</span>
              <span>•</span>
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
