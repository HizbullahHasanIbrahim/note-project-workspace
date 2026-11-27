import { create } from "zustand";
import type { CursorAccentToken } from "@/lib/collab-constants";

export type SupportingTab = "comments" | "backlinks" | "history";
export type CollabStatus = "saved" | "syncing" | "offline";

export interface LiveCollaborator {
  clientId: number;
  name: string;
  colorToken: CursorAccentToken;
}

export interface ActiveBacklinkItem {
  id: string;
  relationType: "backlink" | "task_note_link";
  direction: "incoming" | "outgoing";
  pageId: string;
  title: string;
  icon: string | null;
  isPrivateMasked: boolean;
  spaceType: "teamspace" | "private";
}

interface WorkspaceUIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  isSupportingPaneOpen: boolean;
  toggleSupportingPane: () => void;
  setSupportingPaneOpen: (open: boolean) => void;
  activeSupportingTab: SupportingTab;
  setActiveSupportingTab: (tab: SupportingTab) => void;

  isCmdKOpen: boolean;
  setIsCmdKOpen: (open: boolean) => void;

  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;

  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;

  collabStatus: CollabStatus;
  setCollabStatus: (status: CollabStatus) => void;

  liveCollaborators: LiveCollaborator[];
  setLiveCollaborators: (users: LiveCollaborator[]) => void;

  activePageTitle: string | null;
  setActivePageTitle: (title: string | null) => void;

  activeBacklinks: ActiveBacklinkItem[];
  setActiveBacklinks: (items: ActiveBacklinkItem[]) => void;
}

export const useWorkspaceUIStore = create<WorkspaceUIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  isSupportingPaneOpen: true,
  toggleSupportingPane: () =>
    set((state) => ({ isSupportingPaneOpen: !state.isSupportingPaneOpen })),
  setSupportingPaneOpen: (open) => set({ isSupportingPaneOpen: open }),
  activeSupportingTab: "comments",
  setActiveSupportingTab: (tab) => set({ activeSupportingTab: tab }),

  isCmdKOpen: false,
  setIsCmdKOpen: (open) => set({ isCmdKOpen: open }),

  activeTaskId: null,
  setActiveTaskId: (id) => set({ activeTaskId: id }),

  isDarkMode: false,
  toggleTheme: () => {
    set((state) => {
      const next = !state.isDarkMode;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { isDarkMode: next };
    });
  },
  setTheme: (dark) => {
    if (typeof document !== "undefined") {
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ isDarkMode: dark });
  },

  collabStatus: "saved",
  setCollabStatus: (status) => set({ collabStatus: status }),

  liveCollaborators: [],
  setLiveCollaborators: (users) => set({ liveCollaborators: users }),

  activePageTitle: null,
  setActivePageTitle: (title) => set({ activePageTitle: title }),

  activeBacklinks: [],
  setActiveBacklinks: (items) => set({ activeBacklinks: items }),
}));
