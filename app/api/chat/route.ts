import { NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { fileId, message } = await request.json();

    if (!fileId || !message) {
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

    // Create a new ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        const messageStream = await anthropic.messages.stream({
          messages: [
            {
              role: 'assistant',
              content: `You are a helpful assistant analyzing this document: ${text}`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          model: "claude-3-sonnet-20240229",
          max_tokens: 1024,
        });

        messageStream.on("text", (text) => {
          controller.enqueue(text);
        });

        messageStream.on("error", (error) => {
          console.error("Stream error:", error);
          controller.error(error);
        });

        messageStream.on("end", () => {
          controller.close();
        });
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Error processing chat" },
      { status: 500 }
    );
  }
}
