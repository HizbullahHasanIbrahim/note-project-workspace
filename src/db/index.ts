import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Menggunakan pool koneksi TCP 127.0.0.1:3306 untuk menghindari socket Linux
const connectionUri =
  process.env.DATABASE_URL ||
  "mysql://root:@127.0.0.1:3306/note_project_workspace";

const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle(poolConnection, { schema, mode: "default" });
