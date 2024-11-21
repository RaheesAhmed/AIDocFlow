"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, File, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { FileWithPath } from 'react-dropzone'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadProps {
  onAnalysisComplete: (fileId: string, fileUrl: string, fileName: string) => Promise<void>
}

interface UploadResponse {
  fileId: string
  fileUrl: string
}

const DocumentUpload = ({ onAnalysisComplete }: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const file = acceptedFiles[0]
      
      // Show upload started toast
      toast({
        title: "Upload Started",
        description: "Your document is being uploaded...",
      })

      // First, upload to storage
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { fileId, fileUrl } = await response.json() as UploadResponse

      setUploadProgress(50)

      // Show processing toast
      toast({
        title: "Upload Complete",
        description: "Now processing your document...",
      })

      // Call the parent's analysis handler
      await onAnalysisComplete(fileId, fileUrl, file.name)
      
      setUploadProgress(100)
      
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "There was an error uploading your document.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [onAnalysisComplete, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary-500" />
              <div className="text-sm text-gray-600">
                {uploadProgress < 50 
                  ? `Uploading your document... ${uploadProgress * 2}%`
                  : `Processing your document... ${(uploadProgress - 50) * 2}%`
                }
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  Drop your document here or click to upload
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, TXT, DOC, DOCX
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Select File
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default DocumentUpload