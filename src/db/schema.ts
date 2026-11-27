import { relations } from "drizzle-orm";
import {
  mysqlTable,
  char,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  double,
  boolean,
  mysqlEnum,
  json,
  date,
  uniqueIndex,
  customType,
} from "drizzle-orm/mysql-core";

/**
 * Tipe data khusus LONGBLOB untuk menyimpan biner Yjs CRDT state
 */
export const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "longblob";
  },
});

// ==========================================
// 1. users
// ==========================================
export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  authProvider: mysqlEnum("auth_provider", ["email", "google"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 2. workspaces
// ==========================================
export const workspaces = mysqlTable("workspaces", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  ownerId: char("owner_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  maxMembers: int("max_members").default(20).notNull(),
  storageLimitBytes: bigint("storage_limit_bytes", { mode: "number" })
    .default(1073741824)
    .notNull(),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" })
    .default(0)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 3. workspace_invites
// ==========================================
export const workspaceInvites = mysqlTable("workspace_invites", {
  id: char("id", { length: 36 }).primaryKey(),
  workspaceId: char("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
  defaultRole: mysqlEnum("default_role", ["member", "viewer"])
    .default("member")
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 4. workspace_members
// ==========================================
export const workspaceMembers = mysqlTable(
  "workspace_members",
  {
    id: char("id", { length: 36 }).primaryKey(),
    workspaceId: char("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["admin", "member", "viewer"]).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_user_unique_idx").on(table.workspaceId, table.userId),
  ]
);

// ==========================================
// 5. pages
// ==========================================
export const pages = mysqlTable("pages", {
  id: char("id", { length: 36 }).primaryKey(),
  workspaceId: char("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  parentPageId: char("parent_page_id", { length: 36 }),
  createdBy: char("created_by", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  spaceType: mysqlEnum("space_type", ["teamspace", "private"]).notNull(),
  pageType: mysqlEnum("page_type", [
    "document",
    "database",
    "task_item",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  crdtState: longblob("crdt_state"),
  positionOrder: double("position_order").default(1000.0).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==========================================
// 6. page_blocks
// ==========================================
export const pageBlocks = mysqlTable("page_blocks", {
  id: char("id", { length: 36 }).primaryKey(),
  pageId: char("page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  blockType: mysqlEnum("block_type", [
    "paragraph",
    "heading",
    "checklist",
    "code",
    "table",
  ]).notNull(),
  contentText: text("content_text"),
  propertiesJson: json("properties_json"),
  positionOrder: double("position_order").default(1000.0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==========================================
// 7. tasks
// ==========================================
export const tasks = mysqlTable("tasks", {
  id: char("id", { length: 36 }).primaryKey(),
  databasePageId: char("database_page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  detailPageId: char("detail_page_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => pages.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done"])
    .default("todo")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
    .default("medium")
    .notNull(),
  assigneeId: char("assignee_id", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  dueDate: date("due_date"),
  positionOrder: double("position_order").default(1000.0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==========================================
// 8. page_relations
// ==========================================
export const pageRelations = mysqlTable("page_relations", {
  id: char("id", { length: 36 }).primaryKey(),
  sourcePageId: char("source_page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  targetPageId: char("target_page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  relationType: mysqlEnum("relation_type", [
    "backlink",
    "task_note_link",
  ]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 9. comments
// ==========================================
export const comments = mysqlTable("comments", {
  id: char("id", { length: 36 }).primaryKey(),
  pageId: char("page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  // Soft reference ke block_id tanpa foreign key cascade agar komentar orphaned tetap tersimpan
  blockId: char("block_id", { length: 36 }),
  isBlockDeleted: boolean("is_block_deleted").default(false).notNull(),
  authorId: char("author_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: char("parent_comment_id", { length: 36 }),
  content: text("content").notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==========================================
// 10. comment_mentions
// ==========================================
export const commentMentions = mysqlTable("comment_mentions", {
  id: char("id", { length: 36 }).primaryKey(),
  commentId: char("comment_id", { length: 36 })
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  mentionedUserId: char("mentioned_user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 11. attachments
// ==========================================
export const attachments = mysqlTable("attachments", {
  id: char("id", { length: 36 }).primaryKey(),
  workspaceId: char("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  pageId: char("page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  uploadedBy: char("uploaded_by", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  storageKey: varchar("storage_key", { length: 255 }).notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 12. page_versions (Version History Snapshots)
// ==========================================
export const pageVersions = mysqlTable("page_versions", {
  id: char("id", { length: 36 }).primaryKey(),
  pageId: char("page_id", { length: 36 })
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  createdBy: char("created_by", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titleSnapshot: varchar("title_snapshot", { length: 255 }).notNull(),
  crdtSnapshot: longblob("crdt_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// RELATIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  ownedWorkspaces: many(workspaces),
  memberships: many(workspaceMembers),
  pagesCreated: many(pages),
  pageVersionsCreated: many(pageVersions),
  tasksAssigned: many(tasks),
  comments: many(comments),
  mentions: many(commentMentions),
  attachments: many(attachments),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  invites: many(workspaceInvites),
  pages: many(pages),
  attachments: many(attachments),
}));

export const workspaceInvitesRelations = relations(
  workspaceInvites,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvites.workspaceId],
      references: [workspaces.id],
    }),
  })
);

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  })
);

export const pagesRelations = relations(pages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [pages.workspaceId],
    references: [workspaces.id],
  }),
  parentPage: one(pages, {
    fields: [pages.parentPageId],
    references: [pages.id],
    relationName: "parentChildPages",
  }),
  subPages: many(pages, {
    relationName: "parentChildPages",
  }),
  creator: one(users, {
    fields: [pages.createdBy],
    references: [users.id],
  }),
  blocks: many(pageBlocks),
  tasksInDatabase: many(tasks, { relationName: "databaseTasks" }),
  taskDetail: one(tasks, {
    fields: [pages.id],
    references: [tasks.detailPageId],
    relationName: "taskDetailPage",
  }),
  comments: many(comments),
  attachments: many(attachments),
  versions: many(pageVersions),
  outgoingRelations: many(pageRelations, {
    relationName: "sourcePageRelations",
  }),
  incomingRelations: many(pageRelations, {
    relationName: "targetPageRelations",
  }),
}));

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  page: one(pages, {
    fields: [pageBlocks.pageId],
    references: [pages.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  databasePage: one(pages, {
    fields: [tasks.databasePageId],
    references: [pages.id],
    relationName: "databaseTasks",
  }),
  detailPage: one(pages, {
    fields: [tasks.detailPageId],
    references: [pages.id],
    relationName: "taskDetailPage",
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
}));

export const pageRelationsRelations = relations(pageRelations, ({ one }) => ({
  sourcePage: one(pages, {
    fields: [pageRelations.sourcePageId],
    references: [pages.id],
    relationName: "sourcePageRelations",
  }),
  targetPage: one(pages, {
    fields: [pageRelations.targetPageId],
    references: [pages.id],
    relationName: "targetPageRelations",
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  page: one(pages, {
    fields: [comments.pageId],
    references: [pages.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  mentions: many(commentMentions),
}));

export const commentMentionsRelations = relations(
  commentMentions,
  ({ one }) => ({
    comment: one(comments, {
      fields: [commentMentions.commentId],
      references: [comments.id],
    }),
    mentionedUser: one(users, {
      fields: [commentMentions.mentionedUserId],
      references: [users.id],
    }),
  })
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [attachments.workspaceId],
    references: [workspaces.id],
  }),
  page: one(pages, {
    fields: [attachments.pageId],
    references: [pages.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const pageVersionsRelations = relations(pageVersions, ({ one }) => ({
  page: one(pages, {
    fields: [pageVersions.pageId],
    references: [pages.id],
  }),
  creator: one(users, {
    fields: [pageVersions.createdBy],
    references: [users.id],
  }),
}));
