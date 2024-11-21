// app/documents/page.tsx
"use client"

import { useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import AnalysisDisplay from '@/components/AnalysisDisplay'
import { useToast } from '@/hooks/use-toast'

interface Analysis {
  file_name: string
  analysis: {
    summary: string
    keyPoints: string[]
    sentiment: string
    topics: string[]
  }
  created_at: string
}

export default function DocumentPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const { toast } = useToast()

  const handleAnalysisComplete = async (fileId: string, fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(`/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileUrl,
          fileName,
        }),
      })

      if (!response.ok) {
        throw new Error('Processing failed')
      }

      const data = await response.json()
      console.log(data)
      
      setCurrentAnalysis({
        file_name: fileName,
        analysis: data,
        created_at: new Date().toISOString()
      })

      toast({
        title: "Analysis Complete",
        description: "Your document has been successfully analyzed.",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      })
    }
  }

  const handleProcessAnother = () => {
    setCurrentAnalysis(null)
  }

  return (
    <div className="container mx-auto py-8">
      {!currentAnalysis ? (
        <DocumentUpload onAnalysisComplete={handleAnalysisComplete} />
      ) : (
        <AnalysisDisplay 
          analysis={currentAnalysis}
          onProcessAnother={handleProcessAnother}
        />
      )}
    </div>
  )
}