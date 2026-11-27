"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  GripVertical,
  Plus,
} from "lucide-react";
import { MAX_PAGE_NESTING_DEPTH } from "@/lib/collab-constants";
import {
  createPageAction,
  movePageAction,
  switchPageSpaceAction,
} from "@/app/workspace/[workspaceId]/page-actions";
import { cn } from "@/lib/utils";

export interface NestedPageItem {
  id: string;
  title: string;
  icon: string | null;
  pageType: "document" | "database" | "task_item";
  spaceType: "teamspace" | "private";
  parentPageId: string | null;
  createdBy: string;
  positionOrder: number;
}

interface FlattenedPageNode {
  id: string;
  page: NestedPageItem;
  depth: number;
  hasChildren: boolean;
  subtreeHeight: number;
}

interface NestedPageTreeProps {
  workspaceId: string;
  spaceType: "teamspace" | "private";
  pages: NestedPageItem[];
  currentUserId: string;
  canEdit: boolean;
  isAdmin: boolean;
  onError?: (msg: string) => void;
}

function buildFlattenedTree(
  pages: NestedPageItem[],
  expandedIds: Set<string>
): {
  nodes: FlattenedPageNode[];
  childrenMap: Map<string, NestedPageItem[]>;
  pageMap: Map<string, NestedPageItem>;
} {
  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const childrenMap = new Map<string, NestedPageItem[]>();
  const roots: NestedPageItem[] = [];

  const sorted = [...pages].sort((a, b) => a.positionOrder - b.positionOrder);

  for (const p of sorted) {
    if (p.parentPageId && pageMap.has(p.parentPageId)) {
      const list = childrenMap.get(p.parentPageId) ?? [];
      list.push(p);
      childrenMap.set(p.parentPageId, list);
    } else {
      roots.push(p);
    }
  }

  const heightCache = new Map<string, number>();
  const getSubtreeHeight = (id: string, visited = new Set<string>()): number => {
    if (heightCache.has(id)) return heightCache.get(id)!;
    if (visited.has(id)) return 1;
    visited.add(id);
    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) {
      heightCache.set(id, 1);
      return 1;
    }
    let maxChild = 0;
    for (const c of children) {
      maxChild = Math.max(maxChild, getSubtreeHeight(c.id, visited));
    }
    const h = 1 + maxChild;
    heightCache.set(id, h);
    return h;
  };

  const nodes: FlattenedPageNode[] = [];
  const visited = new Set<string>();

  const walk = (list: NestedPageItem[], depth: number) => {
    for (const item of list) {
      if (visited.has(item.id) || depth > MAX_PAGE_NESTING_DEPTH) continue;
      visited.add(item.id);
      const children = childrenMap.get(item.id) ?? [];
      nodes.push({
        id: item.id,
        page: item,
        depth,
        hasChildren: children.length > 0,
        subtreeHeight: getSubtreeHeight(item.id),
      });
      if (children.length > 0 && expandedIds.has(item.id)) {
        walk(children, depth + 1);
      }
    }
  };

  walk(roots, 1);
  return { nodes, childrenMap, pageMap };
}

function isDescendant(
  potentialDescendantId: string,
  ancestorId: string,
  pageMap: Map<string, NestedPageItem>
): boolean {
  let curr: string | null = potentialDescendantId;
  const visited = new Set<string>();
  while (curr) {
    if (curr === ancestorId) return true;
    if (visited.has(curr)) return false;
    visited.add(curr);
    curr = pageMap.get(curr)?.parentPageId ?? null;
  }
  return false;
}

interface SortableTreeRowProps {
  node: FlattenedPageNode;
  workspaceId: string;
  isActive: boolean;
  isExpanded: boolean;
  canEdit: boolean;
  canSwitchSpace: boolean;
  isPending: boolean;
  dropState: "none" | "valid" | "invalid";
  onToggleExpand: (id: string) => void;
  onCreateSubpage: (parentId: string) => void;
  onSwitchSpace: (pageId: string, target: "teamspace" | "private") => void;
}

function SortableTreeRow({
  node,
  workspaceId,
  isActive,
  isExpanded,
  canEdit,
  canSwitchSpace,
  isPending,
  dropState,
  onToggleExpand,
  onCreateSubpage,
  onSwitchSpace,
}: SortableTreeRowProps) {
  const { page, depth, hasChildren } = node;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id, disabled: !canEdit });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    paddingLeft: `${(depth - 1) * 14 + 6}px`,
  };

  const href =
    page.pageType === "database"
      ? `/workspace/${workspaceId}/database/${page.id}`
      : `/workspace/${workspaceId}/page/${page.id}`;

  const FallbackIcon = page.pageType === "database" ? Database : FileText;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Indikator garis drop horizontal (SDD.md §5.3) */}
      {dropState !== "none" && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute left-2 right-2 bottom-0 h-[2px] z-20 pointer-events-none flex items-center",
            dropState === "valid" ? "bg-primary" : "bg-error"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full -ml-1",
              dropState === "valid" ? "bg-primary" : "bg-error"
            )}
          />
        </div>
      )}

      <div
        className={cn(
          "min-h-[44px] pr-2 rounded-full flex items-center gap-1 transition-colors",
          isActive
            ? "bg-secondary-container text-on-secondary-container font-semibold"
            : "text-on-surface hover:bg-surface-container",
          isDragging && "opacity-40"
        )}
      >
        {/* Drag handle */}
        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Seret untuk mengubah urutan ${page.title}`}
            className={cn(
              "w-5 h-7 rounded-full flex items-center justify-center shrink-0",
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity",
              "text-on-surface-variant hover:text-on-surface cursor-grab active:cursor-grabbing",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none"
            )}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Expand / Collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(page.id)}
            aria-label={isExpanded ? `Ciutkan ${page.title}` : `Bentangkan ${page.title}`}
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              "text-on-surface-variant hover:bg-surface-container-highest transition-colors",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-2 shrink-0" />
        )}

        {/* Tautan Halaman */}
        <Link
          href={href}
          className={cn(
            "flex-1 min-w-0 py-2 flex items-center gap-2 text-label-large",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none rounded-full"
          )}
        >
          <span className="text-sm shrink-0">
            {page.icon || <FallbackIcon className="w-4 h-4 text-on-surface-variant" />}
          </span>
          <span className="truncate">{page.title}</span>
        </Link>

        {/* Aksi cepat: Pindah ruang & Tambah sub-halaman */}
        {canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
            {canSwitchSpace && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  onSwitchSpace(
                    page.id,
                    page.spaceType === "private" ? "teamspace" : "private"
                  )
                }
                title={
                  page.spaceType === "private"
                    ? "Publikasikan ke Shared Teamspace"
                    : "Pindahkan ke Private Space"
                }
                aria-label={
                  page.spaceType === "private"
                    ? `Publikasikan ${page.title} ke Shared Teamspace`
                    : `Pindahkan ${page.title} ke Private Space`
                }
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "text-on-surface-variant hover:bg-surface-container-highest transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            )}

            {depth < MAX_PAGE_NESTING_DEPTH && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => onCreateSubpage(page.id)}
                title="Tambah sub-halaman"
                aria-label={`Tambah sub-halaman di dalam ${page.title}`}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "text-on-surface-variant hover:bg-surface-container-highest transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function NestedPageTree({
  workspaceId,
  spaceType,
  pages,
  currentUserId,
  canEdit,
  isAdmin,
  onError,
}: NestedPageTreeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(pages.map((p) => p.id)));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { nodes, pageMap } = useMemo(
    () => buildFlattenedTree(pages, expandedIds),
    [pages, expandedIds]
  );

  const activeNode = useMemo(
    () => nodes.find((n) => n.id === activeId) ?? null,
    [nodes, activeId]
  );

  // Evaluasi apakah target drop valid sesuai aturan kedalaman maks 5 tingkat & anti-circular
  const evaluateDropValidity = (draggedId: string, targetId: string): boolean => {
    if (draggedId === targetId) return false;
    const dragged = nodes.find((n) => n.id === draggedId);
    const target = nodes.find((n) => n.id === targetId);
    if (!dragged || !target) return false;

    if (isDescendant(targetId, draggedId, pageMap)) {
      return false;
    }

    // Ketika ditempatkan sejajar setelah target (mengikuti parent target), cek total kedalaman
    const targetParentDepth = target.depth - 1;
    if (targetParentDepth + dragged.subtreeHeight > MAX_PAGE_NESTING_DEPTH) {
      return false;
    }

    return true;
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateSubpage = (parentId: string) => {
    setExpandedIds((prev) => new Set(prev).add(parentId));
    startTransition(async () => {
      const res = await createPageAction({
        workspaceId,
        parentPageId: parentId,
        spaceType,
        title: "Sub-halaman Baru",
      });
      if (res.error) {
        onError?.(res.error);
        return;
      }
      if (res.pageId) {
        router.push(`/workspace/${workspaceId}/page/${res.pageId}`);
        router.refresh();
      }
    });
  };

  const handleSwitchSpace = (pageId: string, target: "teamspace" | "private") => {
    startTransition(async () => {
      const res = await switchPageSpaceAction({
        workspaceId,
        pageId,
        targetSpaceType: target,
      });
      if (res.error) {
        onError?.(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);

    if (!evaluateDropValidity(draggedId, targetId)) {
      onError?.(
        `Tidak dapat memindahkan halaman: melanggar aturan circular reference atau batas ${MAX_PAGE_NESTING_DEPTH} tingkat.`
      );
      return;
    }

    const targetPage = pageMap.get(targetId);
    if (!targetPage) return;

    const newParentId = targetPage.parentPageId;
    const siblings = pages
      .filter((p) => p.parentPageId === newParentId && p.id !== draggedId)
      .sort((a, b) => a.positionOrder - b.positionOrder);

    const targetIndex = siblings.findIndex((s) => s.id === targetId);
    const prevSiblingId = targetIndex >= 0 ? siblings[targetIndex].id : null;
    const nextSiblingId =
      targetIndex >= 0 && targetIndex + 1 < siblings.length
        ? siblings[targetIndex + 1].id
        : null;

    startTransition(async () => {
      const res = await movePageAction({
        workspaceId,
        pageId: draggedId,
        newParentId,
        prevSiblingId,
        nextSiblingId,
      });
      if (res.error) {
        onError?.(res.error);
        return;
      }
      router.refresh();
    });
  };

  if (nodes.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-on-surface-variant italic">
        Belum ada halaman.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={nodes.map((n) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {nodes.map((node) => {
            const hrefPage = `/workspace/${workspaceId}/page/${node.id}`;
            const hrefDb = `/workspace/${workspaceId}/database/${node.id}`;
            const isActive = pathname === hrefPage || pathname === hrefDb;

            let dropState: "none" | "valid" | "invalid" = "none";
            if (activeId && overId === node.id && activeId !== node.id) {
              dropState = evaluateDropValidity(activeId, node.id)
                ? "valid"
                : "invalid";
            }

            const canSwitchSpace =
              node.page.createdBy === currentUserId ||
              (node.page.spaceType === "private" && isAdmin);

            return (
              <SortableTreeRow
                key={node.id}
                node={node}
                workspaceId={workspaceId}
                isActive={isActive}
                isExpanded={expandedIds.has(node.id)}
                canEdit={canEdit}
                canSwitchSpace={canSwitchSpace}
                isPending={isPending}
                dropState={dropState}
                onToggleExpand={handleToggleExpand}
                onCreateSubpage={handleCreateSubpage}
                onSwitchSpace={handleSwitchSpace}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeNode ? (
          <div className="min-h-[40px] px-4 py-2 rounded-full bg-surface-container-highest text-on-surface text-label-large font-semibold shadow-md flex items-center gap-2">
            <span>{activeNode.page.icon || "📄"}</span>
            <span className="truncate max-w-[180px]">{activeNode.page.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
