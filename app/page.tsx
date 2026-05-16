"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload, FileText, Zap, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, Loader2, RotateCcw,
  Calendar, Building2, ClipboardList, Target, Users,
  ShieldCheck, MessageSquare, Send, ArrowRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalysisResult {
  tenderTitle: string;
  authority: string;
  estimatedValue: string;
  eligibility: { status: "QUALIFIED" | "PARTIAL" | "NOT_QUALIFIED"; reasons: string[] };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  winProbability: number;
  scopeOfWork: string[];
  requiredDocuments: { name: string; mandatory: boolean; notes?: string }[];
  keyDates: { label: string; date: string }[];
  contacts: { name: string; role: string; phone?: string; email?: string }[];
  warnings: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", color)}>
      {children}
    </span>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon size={14} className="text-accent" />
          </div>
          <span className="font-semibold text-sm text-ink">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="shimmer-line h-4 w-1/3" />
      <div className="shimmer-line h-3 w-full" />
      <div className="shimmer-line h-3 w-4/5" />
      <div className="shimmer-line h-3 w-2/3" />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    if (f.size > 50 * 1024 * 1024) { setError("File must be under 50MB."); return; }
    setFile(f);
    setStatus("ready");
    setError("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setResult(null);
    setError("");
    setChatHistory([]);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setStatus("done");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatHistory(p => [...p, { role: "user", text: q }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: JSON.stringify(result) }),
      });
      const data = await res.json();
      setChatHistory(p => [...p, { role: "ai", text: data.answer || "Sorry, I couldn't answer that." }]);
    } catch {
      setChatHistory(p => [...p, { role: "ai", text: "Something went wrong. Try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError("");
    setChatHistory([]);
  };

  const eligibilityConfig = {
    QUALIFIED: { label: "Eligible", color: "bg-success/10 text-success", icon: CheckCircle2 },
    PARTIAL: { label: "Partially Eligible", color: "bg-warn/10 text-warn", icon: AlertTriangle },
    NOT_QUALIFIED: { label: "Not Eligible", color: "bg-danger/10 text-danger", icon: XCircle },
  };

  const riskConfig = {
    LOW: { label: "Low Risk", color: "bg-success/10 text-success" },
    MEDIUM: { label: "Medium Risk", color: "bg-warn/10 text-warn" },
    HIGH: { label: "High Risk", color: "bg-danger/10 text-danger" },
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-display text-lg font-medium text-ink">TenderAI</span>
          </div>
          <span className="text-xs text-muted">Powered by Gemini</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Hero text */}
        {status === "idle" && (
          <div className="text-center mb-8">
            <h1 className="font-display text-5xl text-ink mb-3 leading-tight">
              Analyse any tender <br />
              <em>in seconds</em>
            </h1>
            <p className="text-muted text-base max-w-sm mx-auto">
              Upload a PDF, our AI reads every page and gives you a clear breakdown — eligibility, scope, risks, dates.
            </p>
          </div>
        )}

        {/* ── Upload area ── */}
        {(status === "idle" || status === "ready") && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200",
              isDragging
                ? "border-accent bg-accent/5 scale-[1.01]"
                : status === "ready"
                ? "border-success bg-success/5"
                : "border-border bg-card hover:border-accent/50 hover:bg-accent/2"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {status === "ready" && file ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                  <FileText size={24} className="text-success" />
                </div>
                <p className="font-semibold text-ink text-sm mb-1 max-w-xs truncate">{file.name}</p>
                <p className="text-xs text-muted mb-1">{(file.size / 1024 / 1024).toFixed(1)} MB · PDF</p>
                <p className="text-xs text-success font-medium">Ready to analyse ✓</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Upload size={24} className="text-accent" />
                </div>
                <p className="font-semibold text-ink text-sm mb-1">
                  {isDragging ? "Drop it here" : "Drop tender PDF here"}
                </p>
                <p className="text-xs text-muted mb-4">or click to browse · max 50 MB</p>
                <span className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-full">
                  <Upload size={12} /> Browse File
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
            <XCircle size={14} className="text-danger shrink-0" />
            <p className="text-xs text-danger font-medium">{error}</p>
          </div>
        )}

        {/* ── Analyse button ── */}
        {status === "ready" && (
          <button
            onClick={analyze}
            className="w-full flex items-center justify-center gap-2.5 bg-accent hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-base transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap size={18} />
            Start AI Analysis
            <ArrowRight size={16} />
          </button>
        )}

        {/* ── Analyzing skeleton ── */}
        {status === "analyzing" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Loader2 size={28} className="text-accent animate-spin mx-auto mb-3" />
              <p className="font-semibold text-sm text-ink">Reading your tender document…</p>
              <p className="text-xs text-muted mt-1">Gemini is analysing every clause and condition</p>
              <div className="flex justify-center gap-6 mt-5">
                {["Extracting text", "Checking eligibility", "Identifying risks", "Building checklist"].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                      <Loader2 size={12} className="text-accent animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                    </div>
                    <span className="text-[10px] text-muted">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* ── Results ── */}
        {status === "done" && result && (
          <div className="space-y-4 animate-fade-up">

            {/* Top summary card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1 uppercase tracking-wide font-medium">Tender</p>
                  <h2 className="font-display text-xl text-ink leading-snug">{result.tenderTitle}</h2>
                  {result.authority && (
                    <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
                      <Building2 size={12} /> {result.authority}
                    </p>
                  )}
                </div>
                {result.estimatedValue && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted mb-0.5">Est. Value</p>
                    <p className="font-display text-2xl text-accent font-medium">{result.estimatedValue}</p>
                  </div>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(() => {
                  const e = eligibilityConfig[result.eligibility.status];
                  return (
                    <Badge color={e.color}>
                      <e.icon size={11} /> {e.label}
                    </Badge>
                  );
                })()}
                <Badge color={riskConfig[result.riskLevel].color}>
                  {riskConfig[result.riskLevel].label}
                </Badge>
                <Badge color="bg-accent/10 text-accent">
                  🎯 {result.winProbability}% win probability
                </Badge>
              </div>

              {/* Eligibility reasons */}
              {result.eligibility.reasons.length > 0 && (
                <div className="space-y-1.5">
                  {result.eligibility.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink/80">
                      <CheckCircle2 size={11} className="text-success shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {result.warnings?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-warn">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Dates */}
            {result.keyDates?.length > 0 && (
              <Section title="Key Dates" icon={Calendar}>
                <div className="pt-4 space-y-2">
                  {result.keyDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted">{d.label}</span>
                      <span className="text-sm font-semibold text-ink">{d.date}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Scope of Work */}
            {result.scopeOfWork?.length > 0 && (
              <Section title="Scope of Work" icon={Target}>
                <ul className="pt-4 space-y-2">
                  {result.scopeOfWork.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink/90">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Required Documents */}
            {result.requiredDocuments?.length > 0 && (
              <Section title={`Required Documents (${result.requiredDocuments.length})`} icon={ClipboardList}>
                <div className="pt-4 space-y-2">
                  {result.requiredDocuments.map((doc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-paper">
                      <FileText size={14} className="text-accent mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{doc.name}</p>
                        {doc.notes && <p className="text-xs text-muted mt-0.5">{doc.notes}</p>}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        doc.mandatory ? "bg-danger/10 text-danger" : "bg-border text-muted"
                      )}>
                        {doc.mandatory ? "Mandatory" : "Optional"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Contacts */}
            {result.contacts?.length > 0 && (
              <Section title="Authority Contacts" icon={Users} defaultOpen={false}>
                <div className="pt-4 space-y-3">
                  {result.contacts.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-paper">
                      <p className="font-semibold text-sm text-ink">{c.name}</p>
                      <p className="text-xs text-muted mb-2">{c.role}</p>
                      <div className="flex flex-wrap gap-3">
                        {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-accent font-medium">📞 {c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`} className="text-xs text-accent font-medium">✉ {c.email}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Ask AI */}
            <Section title="Ask AI About This Tender" icon={MessageSquare} defaultOpen={false}>
              <div className="pt-4">
                <div className="min-h-[80px] max-h-60 overflow-y-auto space-y-3 mb-3">
                  {chatHistory.length === 0 && (
                    <p className="text-xs text-muted text-center py-4">
                      Ask anything — EMD amount, eligibility criteria, submission process…
                    </p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                        msg.role === "user" ? "bg-accent text-white" : "bg-paper text-ink border border-border"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-paper border border-border rounded-xl px-4 py-2.5">
                        <Loader2 size={14} className="text-accent animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm bg-paper border border-border rounded-xl px-3.5 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-muted"
                    placeholder="e.g. What is the EMD amount?"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-accent hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl px-4 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </Section>

            {/* Analyse another */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 border border-border bg-card hover:bg-paper text-sm font-medium text-ink rounded-2xl py-3.5 transition-colors"
            >
              <RotateCcw size={14} /> Analyse another document
            </button>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <XCircle size={32} className="text-danger mx-auto" />
            <div>
              <p className="font-semibold text-ink">Analysis failed</p>
              <p className="text-sm text-muted mt-1">{error}</p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
