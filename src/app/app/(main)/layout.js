import { Suspense } from "react";
import TabBar from "@/components/TabBar/TabBar";
import { isSuperAdmin } from "@/lib/admin/access";
import styles from "./layout.module.css";

// Frame for the signed-in screens: content plus the main navigation.
export default function AppLayout({ children }) {
  return (
    <div className={styles.app}>
      <div className={styles.content}>{children}</div>
      {/* The menu reads the current address, which is unknown while a page
          with a dynamic part, such as an invite code, is prepared. */}
      <Suspense fallback={null}>
        <Suspense fallback={<TabBar />}>
          <RoleTabBar />
        </Suspense>
      </Suspense>
    </div>
  );
}

// The menu as soon as the role is known. Until then, the plain menu shows.
async function RoleTabBar() {
  return <TabBar isAdmin={await isSuperAdmin()} />;
}
