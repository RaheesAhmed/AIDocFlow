"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, File, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { FileWithPath } from 'react-dropzone'

interface UploadResponse {
  fileId: string
  fileUrl: string
}

interface ErrorResponse {
  message: string
}

export const DocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const file = acceptedFiles[0]
      
      // First, upload to storage
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorResponse: ErrorResponse = await response.json()
        throw new Error(errorResponse.message)
      }

      const { fileId, fileUrl } = await response.json() as UploadResponse

      // Start processing
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileUrl,
          fileName: file.name
        })
      })

      if (!processResponse.ok) {
        const errorResponse: ErrorResponse = await processResponse.json()
        throw new Error(errorResponse.message)
      }

      // Handle successful upload & processing
      setUploadProgress(100)
      
    } catch (error) {
      console.error('Error:', error)
      // Handle error state
    } finally {
      setIsUploading(false)
    }
  }, [])

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
                Uploading and processing your document... {uploadProgress}%
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