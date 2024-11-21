"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  topics: string[];
}

interface AnalysisDisplayProps {
  analysis: {
    file_name: string;
    analysis: Analysis;
    created_at: string;
  };
  onProcessAnother: () => void;
}

const AnalysisDisplay = ({
  analysis,
  onProcessAnother,
}: AnalysisDisplayProps) => {
  const { toast } = useToast();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Analysis Results</h2>

      <Card className="p-6">
        {/* Direct display of the analysis */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Analysis:</h3>
            <p className="whitespace-pre-wrap">{analysis.analysis.summary}</p>
          </div>
        </div>
      </Card>

      <Button onClick={onProcessAnother}>Process Another Document</Button>
    </div>
  );
};

export default AnalysisDisplay;
