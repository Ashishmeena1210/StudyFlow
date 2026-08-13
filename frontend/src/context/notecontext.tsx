/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Note {
  id: string;
  subjectId: string;
  subjectName: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  subjectId: string;
  subjectName: string;
  goalId?: string;
  goalTitle?: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface NoteContextType {
  notes: Note[];
  addNote: (data: CreateNoteData) => Note;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  getNotesForSubject: (subjectIdOrName: string) => Note[];
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const defaultNotes: Note[] = [
  {
    id: "note-1",
    subjectId: "sub-networks",
    subjectName: "Networks",
    goalId: "g1",
    goalTitle: "Master Computer Networks & Protocols",
    taskId: "1",
    taskTitle: "Network Layer Protocols",
    title: "OSI 7-Layer Model Reference & Protocols",
    content: `# OSI 7-Layer Model Reference

- **Layer 7 - Application**: HTTP, FTP, SMTP, DNS
- **Layer 6 - Presentation**: SSL/TLS, JPEG, ASCII
- **Layer 5 - Session**: NetBIOS, PPTP
- **Layer 4 - Transport**: TCP, UDP (Port Numbers)
- **Layer 3 - Network**: IP, ICMP, ARP (Routing & IP Addresses)
- **Layer 2 - Data Link**: Ethernet, MAC Addresses, Switches
- **Layer 1 - Physical**: Cables, Hubs, Fiber Optics

## Key Takeaways
TCP is connection-oriented with 3-way handshake (SYN, SYN-ACK, ACK), while UDP is connectionless and faster.`,
    tags: ["Networks", "OSI", "Protocols"],
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "note-2",
    subjectId: "sub-networks",
    subjectName: "Networks",
    goalId: "g1",
    goalTitle: "Master Computer Networks & Protocols",
    title: "Subnet Mask & CIDR Notation Cheatsheet",
    content: `# Subnetting & CIDR Cheatsheet

- **/24** = 255.255.255.0 (256 Total IPs, 254 Usable Hosts)
- **/28** = 255.255.255.240 (16 Total IPs, 14 Usable Hosts)
- **/30** = 255.255.255.252 (4 Total IPs, 2 Usable - Point-to-Point)

Formula for usable hosts: $2^{(32 - N)} - 2$`,
    tags: ["Subnetting", "CIDR", "IPv4"],
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "note-3",
    subjectId: "sub-math",
    subjectName: "Mathematics",
    goalId: "g2",
    goalTitle: "Calculus & Advanced Integration",
    taskId: "2",
    taskTitle: "Integration by Parts",
    title: "Integration Formulas & Standard Methods",
    content: `# Integration Rules

1. **Integration by Parts**: $\\int u \\, dv = u v - \\int v \\, du$
2. **LIATE Rule** for choosing $u$: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.`,
    tags: ["Math", "Calculus", "Integration"],
    isFavorite: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("studyflow-notes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return defaultNotes;
      }
    }
    return defaultNotes;
  });

  useEffect(() => {
    localStorage.setItem("studyflow-notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = (data: CreateNoteData): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: "note-" + crypto.randomUUID(),
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      title: data.title.trim(),
      content: data.content.trim(),
      tags: data.tags || [],
      isFavorite: data.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((current) => [newNote, ...current]);
    return newNote;
  };

  const updateNote = (id: string, data: Partial<Note>) => {
    setNotes((current) =>
      current.map((n) =>
        n.id === id
          ? { ...n, ...data, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((current) => current.filter((n) => n.id !== id));
  };

  const toggleFavoriteNote = (id: string) => {
    setNotes((current) =>
      current.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  };

  const getNote = (id: string) => {
    return notes.find((n) => n.id === id);
  };

  const getNotesForSubject = (subjectIdOrName: string) => {
    return notes.filter(
      (n) =>
        n.subjectId === subjectIdOrName ||
        n.subjectName.toLowerCase() === subjectIdOrName.toLowerCase()
    );
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        addNote,
        updateNote,
        deleteNote,
        toggleFavoriteNote,
        getNote,
        getNotesForSubject,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNotes must be used inside NoteProvider");
  }
  return context;
}
