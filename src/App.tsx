import { useEffect, useState } from "react";
import HouseView from "@/components/HouseView";
import StudioApp from "@/StudioApp";

/** Kleine Hash-Weiche: "#studio" zeigt das Figuren-Studio, sonst das Haus. */
function useHash() {
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  return hash === "#studio" ? <StudioApp /> : <HouseView />;
}
