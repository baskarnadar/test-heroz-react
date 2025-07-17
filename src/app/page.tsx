import Image from "next/image";
import styles from "./page.module.css";
import LoginForm from "../components/LoginForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h2>Welcome to the Homepage</h2>
        <LoginForm />
      </main>
    </div>
  );
}
