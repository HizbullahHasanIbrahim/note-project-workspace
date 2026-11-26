import { create } from "zustand";

export type SupportingTab = "comments" | "backlinks" | "history";

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
}));
