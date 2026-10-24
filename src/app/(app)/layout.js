import TabBar from "@/components/TabBar/TabBar";
import styles from "./layout.module.css";

// Frame for the signed-in screens: content plus the main navigation.
export default function AppLayout({ children }) {
  return (
    <div className={styles.app}>
      <div className={styles.content}>{children}</div>
      <TabBar />
    </div>
  );
}
