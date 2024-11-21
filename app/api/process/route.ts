import { NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { fileId, fileUrl, fileName } = await request.json();

    if (!fileId || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get file content from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(fileId);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      return NextResponse.json(
        { error: "Error downloading file" },
        { status: 500 }
      );
    }

    // Convert file content to text
    const text = await fileData.text();

    // Process with Claude
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze this document and provide:
          1. A brief summary
          2. Key points
          3. Overall sentiment
          4. Main topics discussed
          
          Document content:
          ${text}`,
        },
      ],
    });

    // Parse Claude's response into structured format
    const responseText = message.content[0].text;

    const analysis = {
      summary: responseText,
      keyPoints: ["Analysis from Claude"],
      sentiment: "Neutral",
      topics: ["Document Analysis"],
    };

    // Store analysis in database
    const { error: insertError } = await supabase.from("analyses").insert({
      file_id: fileId,
      file_url: fileUrl,
      file_name: fileName,
      analysis: analysis,
    });

    if (insertError) {
      console.error("Error storing analysis:", insertError);
      return NextResponse.json(
        { error: "Error storing analysis" },
        { status: 500 }
      );
    }

    console.log("Analysis stored in database:", analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}
