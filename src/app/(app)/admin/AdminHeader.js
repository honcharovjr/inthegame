import Chip from "@/components/Chip/Chip";
import styles from "./admin.module.css";

const SECTIONS = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "catalog", label: "Catalog", href: "/admin/catalog" },
  { id: "users", label: "Players", href: "/admin/users" },
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
