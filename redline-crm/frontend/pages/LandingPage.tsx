import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle2,
  Globe,
  Headphones,
  Bot
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Power Dialer',
      description: 'Make calls directly from your browser with Twilio integration. Record calls, track duration, and boost productivity.',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'SMS Campaigns',
      description: 'Send personalized SMS messages to your leads and customers. Track delivery and responses in real-time.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Lead Management',
      description: 'Organize leads into folders, track statuses, and never lose a potential customer again.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Visualize your sales performance with beautiful charts and actionable insights.',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Assistant',
      description: 'Generate professional emails and get smart suggestions powered by artificial intelligence.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Multi-Country Support',
      description: 'Purchase phone numbers from 50+ countries and expand your business globally.',
    },
  ];

  const benefits = [
    'Unlimited call recordings',
    'Real-time call transcription',
    'DNC (Do Not Call) compliance',
    'Team collaboration tools',
    'CRM integrations',
    '24/7 customer support',
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-red-600 font-bold text-xl">R</span>
            </div>
            <span className="text-xl font-bold">RedLine CRM</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-400 hover:text-white transition-colors">Features</a>
            <a href="#benefits" className="text-neutral-400 hover:text-white transition-colors">Benefits</a>
            <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/sign-in" 
              className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/sign-up" 
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors shadow-lg shadow-red-900/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Supercharge Your Sales Team</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent leading-tight">
              The CRM Built for <br />
              <span className="text-red-500">High-Volume Calling</span>
            </h1>

            <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
              Close more deals with our all-in-one sales platform. Power dialer, SMS campaigns, lead management, and AI assistance — everything you need to crush your targets.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/sign-up" 
                className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-lg transition-all shadow-xl shadow-red-900/30 hover:shadow-red-900/50 group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#features" 
                className="flex items-center gap-2 px-8 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold text-lg transition-colors border border-neutral-700"
              >
                See Features
              </a>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-2 shadow-2xl">
              <div className="bg-neutral-900 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-neutral-600">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Sell More</h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              A complete toolkit designed for modern sales teams who want to close more deals faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6 hover:bg-neutral-800 hover:border-neutral-600 transition-all group"
              >
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Teams Choose <span className="text-red-500">RedLine</span>
              </h2>
              <p className="text-xl text-neutral-400 mb-8">
                Join thousands of sales professionals who trust RedLine CRM to manage their customer relationships and close more deals.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-neutral-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/sign-up" 
                className="inline-flex items-center gap-2 mt-10 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors group"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Enterprise Security</h4>
                    <p className="text-sm text-neutral-400">SOC 2 compliant with end-to-end encryption for all your data.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">99.9% Uptime</h4>
                    <p className="text-sm text-neutral-400">Reliable infrastructure that keeps your sales team running 24/7.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Dedicated Support</h4>
                    <p className="text-sm text-neutral-400">Our team is here to help you succeed with personalized onboarding.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-900/20 to-red-600/10 border-y border-red-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Sales?</h2>
          <p className="text-xl text-neutral-400 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link 
            to="/sign-up" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-lg transition-all shadow-xl shadow-red-900/30 group"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">R</span>
              </div>
              <span className="font-semibold">RedLine CRM</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-neutral-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm text-neutral-600">
              © 2026 RedLine CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
