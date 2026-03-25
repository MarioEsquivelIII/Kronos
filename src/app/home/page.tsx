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
        body: JSON.stringify({ message: content, events, imageBase64 }),
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
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg-primary) 90%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "var(--accent-green)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="text-sm font-semibold font-heading" style={{ color: "var(--text-primary)" }}>Kronos</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--bg-secondary)" }}>
            <button
              onClick={() => setView("home")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ background: view === "home" ? "var(--bg-hover)" : "transparent", color: view === "home" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              Home
            </button>
            <button
              onClick={() => setView("calendar")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ background: view === "calendar" ? "var(--bg-hover)" : "transparent", color: view === "calendar" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              Calendar
            </button>
          </div>

          {/* User menu + theme toggle */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => router.push("/account")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: "var(--accent-green)" }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{displayName}</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`pt-8 transition-all ${chatExpanded && chatMode !== "sidebar" ? "pb-[58vh]" : "pb-16"} ${chatMode === "sidebar" ? "mr-[400px]" : ""}`}>
        {view === "home" ? (
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
        ) : (
          <WeekCalendar
            events={events}
            onContextMenu={handleContextMenu}
            onAddEvent={handleAddEvent}
            onClickEvent={handleClickEvent}
          />
        )}
      </main>

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
