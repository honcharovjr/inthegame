import { Suspense } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireSuperAdmin } from "@/lib/admin/access";
import { getSiteSettings } from "@/lib/site/settings";
import AdminHeader from "../AdminHeader";
import SettingsForm from "./SettingsForm";
import styles from "../admin.module.css";

export const metadata = { title: "admin: settings" };

export default function AdminSettings() {
  return (
    <main className={styles.page}>
      <AdminHeader active="settings" title="Settings" />
      <Suspense fallback={<Skeleton height={260} radius={22} />}>
        <Settings />
      </Suspense>
    </main>
  );
}

async function Settings() {
  await requireSuperAdmin();
  const settings = await getSiteSettings();
  return (
    <SettingsForm
      initial={{
        operatorName: settings.operator_name ?? "",
        contactEmail: settings.contact_email ?? "",
        minimumAge: settings.minimum_age ? String(settings.minimum_age) : "",
        privacyUpdatedOn: settings.privacy_updated_on ?? "",
      }}
    />
  );
}
