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
  pageType?: "document" | "database" | "task_item";
  databasePageId?: string | null;
}

export interface ActiveCommentItem {
  id: string;
  pageId: string;
  blockId: string | null;
  isBlockDeleted: boolean;
  authorId: string;
  authorName: string;
  parentCommentId: string | null;
  content: string;
  isResolved: boolean;
  createdAtIso: string;
}

export interface WorkspaceMemberSummary {
  userId: string;
  fullName: string;
  email: string;
  role: "admin" | "member" | "viewer";
}

export interface SelectedEditorBlock {
  id: string;
  preview: string;
}

export interface ActiveVersionItem {
  id: string;
  pageId: string;
  titleSnapshot: string;
  createdBy: string;
  authorName: string;
  createdAtIso: string;
  snapshotBytes: number;
}

interface WorkspaceUIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  isMobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;

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

  activePageId: string | null;
  setActivePageId: (id: string | null) => void;

  activePageTitle: string | null;
  setActivePageTitle: (title: string | null) => void;

  activeBacklinks: ActiveBacklinkItem[];
  setActiveBacklinks: (items: ActiveBacklinkItem[]) => void;

  activeComments: ActiveCommentItem[];
  setActiveComments: (items: ActiveCommentItem[]) => void;

  activeSelectedBlock: SelectedEditorBlock | null;
  setActiveSelectedBlock: (block: SelectedEditorBlock | null) => void;

  activeVersions: ActiveVersionItem[];
  setActiveVersions: (items: ActiveVersionItem[]) => void;
}

export const useWorkspaceUIStore = create<WorkspaceUIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  sidebarWidth: 280,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  isMobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  toggleMobileDrawer: () =>
    set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),

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

  activePageId: null,
  setActivePageId: (id) => set({ activePageId: id }),

  activePageTitle: null,
  setActivePageTitle: (title) => set({ activePageTitle: title }),

  activeBacklinks: [],
  setActiveBacklinks: (items) => set({ activeBacklinks: items }),

  activeComments: [],
  setActiveComments: (items) => set({ activeComments: items }),

  activeSelectedBlock: null,
  setActiveSelectedBlock: (block) => set({ activeSelectedBlock: block }),

  activeVersions: [],
  setActiveVersions: (items) => set({ activeVersions: items }),
}));
