import { greeting } from "@/src/logic";

export default function Home() {
  return (
    <main style={{ padding: "4rem", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Encore
      </p>
      <h1>Take one cover song from first practice to published.</h1>
      <p>{greeting()}</p>
      <p>
        The application foundation is ready. Song mapping arrives in the next product version.
      </p>
    </main>
  );
}
