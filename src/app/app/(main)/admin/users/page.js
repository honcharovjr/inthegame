import { Suspense } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireSuperAdmin } from "@/lib/admin/access";
import { loadUsers } from "@/lib/admin/queries";
import AdminHeader from "../AdminHeader";
import UserList from "./UserList";
import styles from "../admin.module.css";

export const metadata = { title: "admin: players" };

export default function AdminUsers() {
  return (
    <main className={styles.page}>
      <AdminHeader active="users" title="Players" />
      <Suspense
        fallback={
          <div className={styles.stack}>
            <Skeleton height={64} radius={22} />
            <Skeleton height={64} radius={22} delay={80} />
            <Skeleton height={64} radius={22} delay={160} />
          </div>
        }
      >
        <Users />
      </Suspense>
    </main>
  );
}

async function Users() {
  await requireSuperAdmin();
  const users = await loadUsers();
  return <UserList users={users} />;
}
