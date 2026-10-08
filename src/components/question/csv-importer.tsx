"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Modal } from "../ui/modal";
import { QuestionInput } from "@/lib/validations/question";
import { ParseError } from "@/lib/utils/csv-parser";
import {
  FileText,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";

export interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: QuestionInput[]) => void;
  targetSetId?: string;
}

export function CSVImporter({ isOpen, onClose, onImport, targetSetId }: CSVImporterProps) {
  const [format, setFormat] = React.useState<"csv" | "json">("csv");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [parseResult, setParseResult] = React.useState<{
    success: boolean;
    validQuestions: QuestionInput[];
    errors: ParseError[];
    totalRows: number;
    validCount: number;
    errorCount: number;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith(".json");
    setFormat(isJson ? "json" : "csv");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text || "");
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          content,
          targetSetId,
        }),
      });

      const data = await res.json();
      setParseResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/api/questions/import?template=csv", "_blank");
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.validQuestions.length > 0) {
      onImport(parseResult.validQuestions);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Questions (CSV / JSON)"
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Top Controls and Download Template */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormat("csv");
                setParseResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                format === "csv"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              CSV Format
            </button>
            <button
              type="button"
              onClick={() => {
                setFormat("json");
                setParseResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                format === "json"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              JSON Array
            </button>
          </div>

          {format === "csv" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs gap-1.5 border-slate-700 hover:border-slate-500"
            >
              <Download className="w-3.5 h-3.5 text-violet-400" />
              Download CSV Template
            </Button>
          )}
        </div>

        {/* File Drag / Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Upload file or paste raw content:</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-violet-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              Browse local file
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.json,.txt"
              className="hidden"
            />
          </div>

          <textarea
            rows={6}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setParseResult(null);
            }}
            placeholder={
              format === "csv"
                ? `question,optionA,optionB,optionC,optionD,correctAnswer,topic,difficulty,timeLimit,explanation\n"If 2x = 10, what is x?","5","10","2","20","A","QUANTITATIVE","EASY",20,"x = 10/2 = 5"`
                : `[\n  {\n    "question": "What is the capital of France?",\n    "optionA": "Paris",\n    "optionB": "Rome",\n    "correctAnswer": "A",\n    "topic": "GENERAL_REASONING",\n    "difficulty": "EASY"\n  }\n]`
            }
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={loading}
            disabled={!content.trim()}
            onClick={handleValidate}
            className="gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-violet-400" />
            Validate Dataset
          </Button>
        </div>

        {/* Validation Result Box */}
        {parseResult && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Validation Report:</span>
              <div className="flex items-center gap-2">
                <Badge variant={parseResult.validCount > 0 ? "success" : "secondary"}>
                  {parseResult.validCount} Valid Questions
                </Badge>
                {parseResult.errorCount > 0 && (
                  <Badge variant="danger">{parseResult.errorCount} Errors Found</Badge>
                )}
              </div>
            </div>

            {/* Error List */}
            {parseResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 space-y-1.5">
                {parseResult.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 text-[11px] text-rose-300"
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                    <span>
                      <strong className="text-white">Row {err.row}:</strong> [{err.field}]{" "}
                      {err.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {parseResult.validCount > 0 && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Ready to append {parseResult.validCount} verified questions to your set.
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Import {parseResult.validCount} Questions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
