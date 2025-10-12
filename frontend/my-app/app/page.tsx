"use client"

import React, { useState, useEffect } from 'react';
import Link from "next/link"
import { MessageSquare, Brain, BookOpen, Sparkles, ArrowRight, Zap, Target, TrendingUp, Users, Award, CheckCircle, Menu, X } from 'lucide-react';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat Assistant",
      description: "Ask questions and get instant answers from your course materials using advanced retrieval-augmented generation.",
      stats: "10K+ Questions Answered Daily"
    },
    {
      icon: Brain,
      title: "Smart Quiz Generator",
      description: "Generate custom quizzes on any topic with multiple difficulty levels and instant feedback on your answers.",
      stats: "5K+ Quizzes Generated"
    },
    {
      icon: BookOpen,
      title: "Flashcard Studio",
      description: "Create intelligent flashcards automatically and study with spaced repetition for better retention.",
      stats: "95% Retention Rate"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Students", icon: Users },
    { value: "98%", label: "Success Rate", icon: TrendingUp },
    { value: "200+", label: "Institutions", icon: Award },
    { value: "4.9/5", label: "Rating", icon: Target }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-black dark:bg-white rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gray-900 dark:bg-gray-100 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gray-800 dark:bg-gray-200 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-black/90 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-800' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Sparkles className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div className="absolute inset-0 bg-black dark:bg-white rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <span className="text-2xl font-bold text-black dark:text-white">Reviso</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Testimonials</a>
              <Link href="/login">
                <button className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  Get Started
                </button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-black dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 animate-fadeIn">
              <a href="#features" className="block text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="block text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="block text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Testimonials</a>
              <Link href="/login">
                <button className="w-full px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full shadow-lg animate-fadeIn">
            <Zap className="w-4 h-4 text-black dark:text-white" />
            <span className="text-sm font-semibold text-black dark:text-white">AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-fadeIn">
            <span className="text-black dark:text-white">
              Master Your Studies with
            </span>
            <br />
            <span className="text-gray-600 dark:text-gray-400 italic">
              Intelligent Learning
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeIn animation-delay-200">
            Leverage advanced RAG technology to chat with your course materials, generate personalized quizzes, and create smart flashcards for effective learning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fadeIn animation-delay-400">
            <Link href="/login">
              <button className="group px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                Start Learning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white rounded-full font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Watch Demo
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fadeIn animation-delay-600">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-2xl hover:scale-105 hover:border-black dark:hover:border-white transition-all duration-300">
                <stat.icon className="w-8 h-8 text-black dark:text-white mx-auto mb-2" />
                <div className="text-3xl font-bold text-black dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black dark:text-white">
              Three Powerful Learning Tools
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Everything you need to excel in your studies</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;
              return (
                <div
                  key={index}
                  className={`group relative bg-white dark:bg-black rounded-3xl p-8 border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                    isActive 
                      ? 'border-black dark:border-white shadow-2xl' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`absolute inset-0 bg-black dark:bg-white rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                    isActive ? 'bg-black dark:bg-white shadow-lg' : 'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    <Icon className={`w-8 h-8 transition-colors ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-black dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                    <CheckCircle className="w-4 h-4" />
                    <span>{feature.stats}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-black dark:bg-white rounded-3xl p-1">
            <div className="bg-white dark:bg-black rounded-3xl p-12 text-center border-2 border-black dark:border-white">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full">
                <Award className="w-5 h-5 text-black dark:text-white" />
                <span className="text-sm font-semibold text-black dark:text-white">Specialized Curriculum</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
                Tailored for Your Courses
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Currently supporting Data Mining, Network Systems, and Distributed Computing
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <div className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full text-base font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all">
                  Data Mining
                </div>
                <div className="px-6 py-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded-full text-base font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all">
                  Network Systems
                </div>
                <div className="px-6 py-3 bg-gray-700 dark:bg-gray-300 text-white dark:text-black rounded-full text-base font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all">
                  Distributed Computing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-black dark:bg-white rounded-3xl p-12 md:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-black mb-6">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-gray-300 dark:text-gray-700 mb-8 max-w-2xl mx-auto">
                Join thousands of students already accelerating their academic success with Reviso
              </p>
              <Link href="/login">
                <button className="px-10 py-5 bg-white dark:bg-black text-black dark:text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <div className="text-xl font-bold text-black dark:text-white">Reviso</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">© 2025 Powered by AI</div>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; opacity: 0; animation-fill-mode: forwards; }
        .animation-delay-400 { animation-delay: 0.4s; opacity: 0; animation-fill-mode: forwards; }
        .animation-delay-600 { animation-delay: 0.6s; opacity: 0; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );
}