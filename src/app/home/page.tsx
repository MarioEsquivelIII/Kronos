"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ComingUp from "@/components/ComingUp";
import WeekCalendar from "@/components/WeekCalendar";
import ChatBar from "@/components/ChatBar";
import EventContextMenu from "@/components/EventContextMenu";
import EditEventModal from "@/components/EditEventModal";
import EventDetailPanel from "@/components/EventDetailPanel";
import { CalendarEvent, sampleEvents, generateId } from "@/lib/events";
import { ChatMessage } from "@/lib/chat";
import { useTheme } from "@/lib/theme";
import { User } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [view, setView] = useState<"home" | "calendar">("home");
  const [contextMenu, setContextMenu] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [detailPanel, setDetailPanel] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const [chatMode, setChatMode] = useState<"collapsed" | "floating" | "sidebar" | "fullscreen">("collapsed");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Fallback: check localStorage for non-Supabase auth
        const stored = localStorage.getItem("kronos_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setDisplayName(parsed.name || parsed.email?.split("@")[0] || "User");
          return;
        }
        router.push("/login");
        return;
      }
      setUser(user);
      setDisplayName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User"
      );
    });
  }, [router, supabase.auth]);

  const handleContextMenu = useCallback((event: CalendarEvent, x: number, y: number) => {
    setContextMenu({ event, x, y });
    setDetailPanel(null);
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDetailPanel(null);
    setContextMenu(null);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
  }, []);

  const handleSaveEvent = useCallback((updated: CalendarEvent) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === updated.id);
      if (exists) return prev.map((e) => (e.id === updated.id ? updated : e));
      return [...prev, updated];
    });
    setEditingEvent(null);
  }, []);

  const handleAddEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleClickEvent = useCallback((event: CalendarEvent, x: number, y: number) => {
    setDetailPanel({ event, x, y });
    setContextMenu(null);
  }, []);

  const handleSendMessage = async (content: string, imageBase64?: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: imageBase64 ? `${content || ""} [Uploaded an image]` : content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, events, imageBase64, today: new Date().toISOString().split("T")[0] }),
      });

      const data = await res.json();
      let responseText = data.response || data.error || "Sorry, something went wrong.";

      // Parse action blocks — try multiple formats
      const jsonPatterns = [
        /```json\s*([\s\S]*?)```/,
        /```\s*([\s\S]*?\{"actions"[\s\S]*?)```/,
        /(\{"actions"\s*:\s*\[[\s\S]*\]\s*\})/,
      ];

      let parsed = null;
      for (const pattern of jsonPatterns) {
        const match = responseText.match(pattern);
        if (match) {
          try {
            parsed = JSON.parse(match[1] || match[0]);
            responseText = responseText.replace(match[0], "").trim();
            break;
          } catch {
            // Try next pattern
          }
        }
      }

      if (parsed?.actions) {
        setEvents((prev) => {
          let updated = [...prev];
          const toAdd: CalendarEvent[] = [];

          for (const action of parsed.actions) {
            if (action.type === "delete") {
              // Delete by ID or by title match
              if (action.id) {
                updated = updated.filter((e) => e.id !== action.id);
              } else if (action.title) {
                // Fuzzy match by title for moves
                const titleLower = action.title.toLowerCase();
                const dateFilter = action.date;
                updated = updated.filter((e) => {
                  const match = e.title.toLowerCase().includes(titleLower) || titleLower.includes(e.title.toLowerCase());
                  if (dateFilter) return !(match && e.date === dateFilter);
                  return !match;
                });
              }
            } else if (action.type === "add") {
              toAdd.push({
                id: generateId(),
                title: action.title,
                date: action.date,
                startTime: action.startTime,
                endTime: action.endTime,
                color: action.color || "green",
              });
            }
          }

          return [...updated, ...toAdd];
        });
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't reach the AI service. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("kronos_user");
    router.push("/login");
  };

  if (!user && !displayName) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-lg" style={{ background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md" style={{ background: "var(--accent)" }}>
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M8 6 L16 2 L24 6 L24 18 L16 26 L8 18Z" fill="white" opacity="0.9"/>
                <path d="M16 10 L22 14 L22 22 L16 26 L10 22 L10 14Z" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Kronos</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--bg-tertiary)" }}>
            <button
              onClick={() => setView("home")}
              className="px-3.5 py-1 rounded-md text-[12px] font-medium transition-colors"
              style={{ background: view === "home" ? "var(--bg-secondary)" : "transparent", color: view === "home" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: view === "home" ? "0 1px 2px rgba(0,0,0,0.1)" : "none" }}
            >
              Home
            </button>
            <button
              onClick={() => setView("calendar")}
              className="px-3.5 py-1 rounded-md text-[12px] font-medium transition-colors"
              style={{ background: view === "calendar" ? "var(--bg-secondary)" : "transparent", color: view === "calendar" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: view === "calendar" ? "0 1px 2px rgba(0,0,0,0.1)" : "none" }}
            >
              Calendar
            </button>
          </div>

          {/* User menu + theme toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => router.push("/account")}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors overflow-hidden"
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: "var(--accent)" }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      {view === "home" ? (
        <main className={`pt-8 transition-all ${chatExpanded && chatMode !== "sidebar" ? "pb-[58vh]" : "pb-16"} ${chatMode === "sidebar" ? "mr-100" : ""}`}>
          <div className="space-y-8">
            {/* Greeting */}
            <div className="max-w-2xl mx-auto px-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              <h1 className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {displayName}
              </h1>
            </div>

            <ComingUp events={events} onContextMenu={handleContextMenu} />
          </div>
        </main>
      ) : (
        <div className={`flex flex-col transition-all ${chatMode === "sidebar" ? "mr-100" : ""}`} style={{ height: "calc(100vh - 48px)" }}>
          <WeekCalendar
            events={events}
            onContextMenu={handleContextMenu}
            onAddEvent={handleAddEvent}
            onClickEvent={handleClickEvent}
            onUpdateEvent={handleSaveEvent}
          />
        </div>
      )}

      {/* Chat bar */}
      <ChatBar
        messages={messages}
        onSendMessage={handleSendMessage}
        isExpanded={chatExpanded}
        onToggleExpand={() => setChatExpanded(!chatExpanded)}
        isLoading={chatLoading}
        onModeChange={setChatMode}
      />

      {/* Context menu */}
      {contextMenu && (
        <EventContextMenu
          event={contextMenu.event}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={handleDeleteEvent}
          onEdit={handleEditEvent}
        />
      )}

      {/* Edit modal (from context menu) */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* Detail panel (Notion-style, from clicking event) */}
      {detailPanel && (
        <EventDetailPanel
          event={detailPanel.event}
          position={{ x: detailPanel.x, y: detailPanel.y }}
          onClose={() => setDetailPanel(null)}
          onSave={handleSaveEvent}
          onDelete={(id) => { handleDeleteEvent(id); setDetailPanel(null); }}
        />
      )}
    </div>
  );
}
