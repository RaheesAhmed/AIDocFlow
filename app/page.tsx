import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Zap } from 'lucide-react'

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pb-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 mb-8">
            <span className="text-primary-600 text-sm font-medium">Now in beta</span>
            <span className="ml-2 text-primary-600">•</span>
            <span className="ml-2 text-primary-700 text-sm font-medium">Special launch pricing</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-6xl font-display font-bold text-secondary-900 tracking-tight mb-6">
            Transform Your Documents
            <br />
            <span className="text-primary-600">with AI-Powered Analysis</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-xl text-secondary-600 mb-10">
            Upload any document and get instant insights, summaries, and key information extracted automatically. Save hours of manual work with our intelligent document processing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 inline-block transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="outline"
              className="border-2 border-secondary-200 hover:border-secondary-300 text-secondary-700"
            >
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-secondary-900 mb-2">100K+</div>
              <div className="text-secondary-600">Documents Processed</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-secondary-900 mb-2">98%</div>
              <div className="text-secondary-600">Accuracy Rate</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-secondary-900 mb-2">4.9/5</div>
              <div className="text-secondary-600">User Rating</div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
              <div className="rounded-lg bg-primary-50 p-3">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-secondary-900">Smart Extraction</h3>
                <p className="text-secondary-600">Automatically extract key information</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
              <div className="rounded-lg bg-primary-50 p-3">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-secondary-900">Instant Analysis</h3>
                <p className="text-secondary-600">Get insights in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero