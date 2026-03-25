"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/lib/chat";

type ChatMode = "collapsed" | "floating" | "sidebar" | "fullscreen";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ChatBarProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, imageBase64?: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLoading?: boolean;
  onModeChange?: (mode: "collapsed" | "floating" | "sidebar" | "fullscreen") => void;
}

const initialActions = [
  "What's planned today?",
  "Add an event",
  "Show my week",
];

const followUpActions = [
  "What's next?",
  "Find free time",
  "Show my week",
  "Reschedule something",
];

const recipes = [
  { label: "Summarize my day", color: "bg-[#5a8a4a]" },
  { label: "Find free time", color: "bg-[#5a4167]" },
  { label: "Weekly recap", color: "bg-[#6b5a3e]" },
  { label: "Sync calendar", color: "bg-[#415a67]" },
];

export default function ChatBar({ messages, onSendMessage, isExpanded, onToggleExpand, isLoading, onModeChange }: ChatBarProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("collapsed");
  const [showChips, setShowChips] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Wrap setMode to notify parent
  const updateMode = useCallback((newMode: ChatMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // Click-outside-to-collapse for floating and sidebar modes
  useEffect(() => {
    if (mode !== "floating" && mode !== "sidebar") return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        updateMode("collapsed");
        if (isExpanded) onToggleExpand();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode, isExpanded, onToggleExpand, updateMode]);

  // Voice input
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalText) {
        setInput((prev) => prev + finalText);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    // Auto-expand chat when voice starts
    if (mode === "collapsed") {
      updateMode("floating");
      if (!isExpanded) onToggleExpand();
    }
  }, [mode, isExpanded, onToggleExpand, updateMode]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    // If there's text, auto-send it
    if (input.trim() || interimTranscript.trim()) {
      const fullText = input + interimTranscript;
      if (fullText.trim()) {
        onSendMessage(fullText.trim());
        setInput("");
        setInterimTranscript("");
      }
    }
  }, [input, interimTranscript, onSendMessage]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (mode !== "collapsed") inputRef.current?.focus();
  }, [mode]);

  // Sync external expand state
  useEffect(() => {
    if (isExpanded && mode === "collapsed") updateMode("floating");
    if (!isExpanded && mode !== "collapsed") updateMode("collapsed");
  }, [isExpanded, mode, updateMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imagePreview) || isLoading) return;
    if (mode === "collapsed") {
      updateMode("floating");
      if (!isExpanded) onToggleExpand();
    }
    onSendMessage(input.trim(), imagePreview || undefined);
    setInput("");
    setImagePreview(null);
  };

  // Paste image handler (Cmd+V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          if (mode === "collapsed") {
            updateMode("floating");
            if (!isExpanded) onToggleExpand();
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [mode, isExpanded, onToggleExpand, updateMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      if (mode === "collapsed") {
        updateMode("floating");
        onToggleExpand();
      }
    };
    reader.readAsDataURL(file);
  };

  const openMode = (newMode: ChatMode) => {
    setMode(newMode);
    setShowModeMenu(false);
    if (newMode === "collapsed") {
      if (isExpanded) onToggleExpand();
    } else {
      if (!isExpanded) onToggleExpand();
    }
  };

  const handleBarMouseEnter = () => {
    chipTimerRef.current = setTimeout(() => setShowChips(true), 200);
  };

  const handleBarMouseLeave = () => {
    if (chipTimerRef.current) clearTimeout(chipTimerRef.current);
    setShowChips(false);
  };

  // Shared input box component
  const renderInputBox = () => (
    <div className="rounded-xl overflow-hidden transition-colors" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
      <div className="flex items-center gap-2 px-3 pt-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>My calendar</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>All events</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          value={input + interimTranscript}
          onChange={(e) => { setInput(e.target.value); setInterimTranscript(""); }}
          onPaste={handlePaste}
          placeholder={isListening ? "Listening..." : "What do you have planned today?"}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </form>
      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md transition-colors" title="Upload image (schedule, screenshot)" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
          </button>
          <button type="button" className="p-1.5 rounded-md transition-colors" title="Settings" onClick={() => openMode(mode === "sidebar" ? "floating" : "sidebar")} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleVoice} className={`p-2 rounded-full transition-all ${isListening ? "bg-[#5a8a4a] animate-pulse" : ""}`} style={!isListening ? { background: "var(--bg-hover)" } : undefined} title={isListening ? "Stop recording (sends message)" : "Voice input"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isListening ? "white" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </button>
          <button onClick={handleSubmit} disabled={(!input.trim() && !imagePreview) || isLoading} className="p-2 rounded-full transition-colors disabled:opacity-30" style={{ background: "var(--bg-hover)" }} title="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() || imagePreview ? "#5a8a4a" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16V8M8 12l4-4 4 4" /></svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecipes = () => (
    <div className="w-full max-w-md">
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Recipes</p>
      <div className="flex flex-wrap gap-2">
        {recipes.map((r) => (
          <button key={r.label} onClick={() => onSendMessage(r.label)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
            <div className={`w-3 h-3 rounded ${r.color}`} />
            {r.label}
          </button>
        ))}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/></svg>
          All recipes
        </button>
      </div>
    </div>
  );

  const renderRecentChats = () => (
    <div className="w-full max-w-md mt-6">
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Recent chats</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>No recent chats yet</p>
    </div>
  );

  const renderImagePreview = () => {
    if (!imagePreview) return null;
    return (
      <div className="px-4 pt-3">
        <div className="relative inline-block">
          <img src={imagePreview} alt="Upload preview" className="h-20 rounded-lg" style={{ border: "1px solid var(--border-color)" }} />
          <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors" style={{ background: "var(--bg-hover)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    );
  };

  const lastMessage = messages[messages.length - 1];
  const showFollowUps = lastMessage?.role === "assistant" && !isLoading;
  const activeActions = messages.length > 0 && showFollowUps ? followUpActions : initialActions;

  const renderMessages = () => (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-[#5a8a4a] text-white rounded-br-md" : "rounded-bl-md"}`} style={msg.role === "assistant" ? { background: "var(--bg-tertiary)", color: "var(--text-primary)" } : undefined}>
            {msg.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "var(--bg-tertiary)" }}>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      {showFollowUps && (
        <div className="flex flex-wrap gap-2 mt-2">
          {followUpActions.map((action) => (
            <button key={action} onClick={() => onSendMessage(action)} className="px-3 py-1.5 rounded-full text-xs transition-colors" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
              {action}
            </button>
          ))}
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center w-full">
      <h1 className="text-3xl font-semibold mb-8" style={{ color: "var(--text-primary)" }}>Ask anything</h1>
      <div className="w-full max-w-md mb-8">
        {renderImagePreview()}
        {renderInputBox()}
      </div>
      {renderRecipes()}
      {renderRecentChats()}
    </div>
  );

  const renderKronosBackButton = () => (
    <button
      onClick={() => { updateMode("collapsed"); if (isExpanded) onToggleExpand(); }}
      className="flex items-center gap-2 p-2 rounded-lg transition-colors"
      title="Back to calendar"
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div className="w-8 h-8 rounded-lg bg-[#5a8a4a] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
    </button>
  );

  // ========== FULLSCREEN MODE ==========
  if (mode === "fullscreen") {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center px-4 py-3 flex-shrink-0">
          {renderKronosBackButton()}
        </div>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex flex-col items-center w-full max-w-2xl">{renderEmptyState()}</div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="max-w-2xl mx-auto space-y-4">{renderMessages()}</div>
            </div>
            <div className="border-t flex-shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
              {renderImagePreview()}
              <div className="flex items-center gap-2 px-4 pt-2">
                {activeActions.map((action) => (
                  <button key={action} onClick={() => onSendMessage(action)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all whitespace-nowrap" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    <div className="w-2.5 h-2.5 rounded bg-[#5a8a4a]/50" />
                    {action}
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5">{renderInputBox()}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  const containerClass = (() => {
    switch (mode) {
      case "sidebar": return "fixed top-14 right-0 bottom-0 w-[400px] z-50 flex flex-col border-l";
      case "floating": return "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[600px] max-w-[90vw] h-[50vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border";
      default: return "";
    }
  })();

  // ========== FLOATING / SIDEBAR MODES ==========
  if (mode !== "collapsed") {
    return (
      <div ref={containerRef} className={containerClass} style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New chat</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setInput("")} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              New chat
            </button>
            <div className="relative">
              <button onClick={() => setShowModeMenu(!showModeMenu)} className="p-1.5 rounded-md transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
              </button>
              {showModeMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                  {[
                    { m: "floating" as ChatMode, label: "Floating", icon: "M2 3h20v18H2z" },
                    { m: "sidebar" as ChatMode, label: "Sidebar", icon: "M2 3h20v18H2zM15 3v18" },
                    { m: "fullscreen" as ChatMode, label: "Full screen", icon: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" },
                  ].map(({ m, label, icon }) => (
                    <button key={m} onClick={() => openMode(m)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors" style={{ color: mode === m ? "var(--text-primary)" : "var(--text-secondary)", background: mode === m ? "var(--bg-hover)" : "transparent" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full py-8">{renderEmptyState()}</div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="max-w-2xl mx-auto space-y-4">{renderMessages()}</div>
            </div>
            <div className="border-t flex-shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
              {renderImagePreview()}
              <div className="flex items-center gap-2 px-4 pt-2">
                {activeActions.map((action) => (
                  <button key={action} onClick={() => onSendMessage(action)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all whitespace-nowrap" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    <div className="w-2.5 h-2.5 rounded bg-[#5a8a4a]/50" />
                    {action}
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5">{renderInputBox()}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ========== COLLAPSED MODE — compact floating pill ==========
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" onMouseEnter={handleBarMouseEnter} onMouseLeave={handleBarMouseLeave}>
      <div className={`flex items-center justify-center gap-2 mb-2 transition-all duration-200 ${showChips ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        {activeActions.map((action) => (
          <button key={action} onClick={() => onSendMessage(action)} className="px-2.5 py-1 rounded-full text-[11px] transition-all whitespace-nowrap backdrop-blur-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
            {action}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onPaste={handlePaste} placeholder="What do you have planned today?" className="bg-transparent text-sm outline-none w-64" style={{ color: "var(--text-primary)" }} />
        <div className="flex items-center gap-0.5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 rounded-full transition-colors" title="Upload image">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
          </button>
          <button type="button" onClick={() => { updateMode("floating"); if (!isExpanded) onToggleExpand(); }} className="p-1 rounded-full transition-colors" title="Open chat settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </button>
          <button type="button" onClick={toggleVoice} className={`p-1 rounded-full transition-all ${isListening ? "bg-[#5a8a4a] animate-pulse" : ""}`} title={isListening ? "Stop recording" : "Voice input"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isListening ? "white" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </button>
          <button type="submit" disabled={!input.trim() || isLoading} className="p-1 rounded-full transition-colors disabled:opacity-30">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#5a8a4a" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16V8M8 12l4-4 4 4" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
