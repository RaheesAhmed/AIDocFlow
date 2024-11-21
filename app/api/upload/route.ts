
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const fileName = `${Date.now()}-${file.name}`
    
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(data.path)

    return NextResponse.json({
      fileId: data.path,
      fileUrl: publicUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}


// Types for our database
type Analysis = {
  id: string
  file_id: string
  file_name: string
  file_url: string
  analysis: string
  created_at: string
}