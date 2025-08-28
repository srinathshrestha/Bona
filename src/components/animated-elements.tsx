import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Vault,
  DollarSign,
  HardDrive,
  Upload,
} from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export function VaultAnimation() {
  return (
    <motion.div
      className="relative w-64 h-64 mx-auto"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Vault Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      {/* Main Vault Icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        variants={itemVariants}
      >
        <Vault className="w-24 h-24 text-primary" />
      </motion.div>

      {/* Floating Security Icons */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        <Shield className="w-8 h-8 text-secondary" />
      </motion.div>

      <motion.div
        className="absolute bottom-4 left-4"
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1,
        }}
      >
        <Lock className="w-6 h-6 text-accent" />
      </motion.div>

      {/* Orbiting Elements */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
        }}
      >
        <div className="relative w-full h-full">
          <motion.div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </motion.div>
          <motion.div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
          </motion.div>
          <motion.div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
          </motion.div>
          <motion.div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PricingAnimation() {
  return (
    <motion.div
      className="relative w-48 h-48 mx-auto"
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      {/* Central Dollar Sign */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <DollarSign className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      {/* Savings Indicators */}
      <motion.div
        className="absolute top-0 left-0"
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
          Others: $30/mo
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0"
        initial={{ x: 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-semibold">
          Bona: $2/mo
        </div>
      </motion.div>

      {/* Floating coins */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-yellow-400 rounded-full"
          style={{
            top: `${20 + i * 10}%`,
            left: `${15 + i * 12}%`,
          }}
          animate={{
            y: [-5, 5, -5],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );
}

export function StorageAnimation() {
  return (
    <motion.div
      className="relative w-56 h-32 mx-auto"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      {/* Storage Drive */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <HardDrive className="w-16 h-16 text-white" />
      </motion.div>

      {/* Storage Indicator */}
      <motion.div className="absolute bottom-2 left-2 right-2 bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500"
          initial={{ width: 0 }}
          whileInView={{ width: "20%" }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </motion.div>

      {/* 50GB Label */}
      <motion.div
        className="absolute -top-8 left-1/2 transform -translate-x-1/2"
        initial={{ y: -20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
          50GB FREE
        </div>
      </motion.div>

      {/* Data flow animation */}
      <motion.div
        className="absolute -right-12 top-1/2 transform -translate-y-1/2"
        animate={{
          x: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Upload className="w-6 h-6 text-primary" />
      </motion.div>
    </motion.div>
  );
}

export function AppPreview() {
  return (
    <motion.div
      className="relative max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {/* Main App Window */}
      <motion.div
        className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Window Header */}
        <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="text-sm text-muted-foreground ml-4">
            Bona - Creative Asset Management
          </div>
        </div>

        {/* App Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">B</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">My Projects</h3>
                <p className="text-sm text-muted-foreground">
                  3 active projects
                </p>
              </div>
            </div>
            <motion.button
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              New Project
            </motion.button>
          </div>

          {/* Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Brand Redesign",
                files: 24,
                members: 5,
                color: "bg-blue-500",
              },
              {
                name: "Website Assets",
                files: 18,
                members: 3,
                color: "bg-green-500",
              },
              {
                name: "Marketing Campaign",
                files: 32,
                members: 7,
                color: "bg-purple-500",
              },
            ].map((project, index) => (
              <motion.div
                key={index}
                className="bg-card border border-border rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 ${project.color} rounded-lg`}></div>
                  <h4 className="font-semibold text-sm">{project.name}</h4>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{project.files} files</span>
                  <span>{project.members} members</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* File Upload Area */}
          <motion.div
            className="mt-6 border-2 border-dashed border-border rounded-lg p-8 text-center"
            whileHover={{ borderColor: "hsl(var(--primary))" }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop files here or click to browse
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating UI Elements */}
      <motion.div
        className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold"
        animate={{
          y: [-2, 2, -2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✓ Synced
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🔒 Encrypted
      </motion.div>
    </motion.div>
  );
}
