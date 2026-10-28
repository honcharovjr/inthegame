import { Suspense } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireSuperAdmin } from "@/lib/admin/access";
import { loadCatalog } from "@/lib/admin/queries";
import AdminHeader from "../AdminHeader";
import CatalogManager from "./CatalogManager";
import styles from "../admin.module.css";

export const metadata = { title: "Admin: catalog" };

export default function AdminCatalog() {
  return (
    <main className={styles.page}>
      <AdminHeader active="catalog" title="Catalog" />
      <Suspense
        fallback={
          <div className={styles.stack}>
            <Skeleton height={64} radius={22} />
            <Skeleton height={64} radius={22} delay={80} />
            <Skeleton height={64} radius={22} delay={160} />
          </div>
        }
      >
        <Catalog />
      </Suspense>
    </main>
  );
}

async function Catalog() {
  await requireSuperAdmin();
  const { catalog, custom } = await loadCatalog();
  return <CatalogManager catalog={catalog} custom={custom} />;
}
