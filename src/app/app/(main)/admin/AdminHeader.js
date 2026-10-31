import Chip from "@/components/Chip/Chip";
import styles from "./admin.module.css";

const SECTIONS = [
  { id: "overview", label: "Overview", href: "/app/admin" },
  { id: "catalog", label: "Catalog", href: "/app/admin/catalog" },
  { id: "users", label: "Players", href: "/app/admin/users" },
  { id: "settings", label: "Settings", href: "/app/admin/settings" },
];

// Title and section switch shared by the admin pages.
export default function AdminHeader({ active, title }) {
  return (
    <header className={styles.header}>
      <p className={styles.kicker}>Admin panel</p>
      <h1 className={styles.title}>{title}</h1>
      <nav className={styles.sections} aria-label="Admin sections">
        {SECTIONS.map((section) => (
          <Chip
            key={section.id}
            href={section.href}
            tone={active === section.id ? "active" : "white"}
            aria-current={active === section.id ? "page" : undefined}
          >
            {section.label}
          </Chip>
        ))}
      </nav>
    </header>
  );
}
