import Character from "@/components/Character/Character";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Character size={120} />
      <h1>In the Game</h1>
    </main>
  );
}
