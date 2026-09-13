declare module "connect-sqlite3" {
  import type session from "express-session";

  interface SQLiteStoreOptions {
    db?: string;
    dir?: string;
    table?: string;
  }

  export default function connectSqlite3(
    connect: typeof session,
  ): new (options?: SQLiteStoreOptions) => session.Store;
}
