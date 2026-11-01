import { useEffect, useState } from "react";
import HouseView from "@/components/HouseView";
import TraumhausView from "@/components/TraumhausView";
import StudioApp from "@/StudioApp";

/** Hash-Weiche: "#studio" Figuren-Studio, "#traumhaus" Traumhaus, "#gruselhaus" Gruselhaus, sonst das normale Haus. */
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
  if (hash === "#studio") return <StudioApp />;
  if (hash === "#traumhaus") return <TraumhausView />;
  // key: jede Hauswelt bekommt ihre eigene Instanz (und damit ihren eigenen Speicher)
  if (hash === "#gruselhaus") return <HouseView key="gruesel" welt="gruesel" />;
  return <HouseView key="normal" />;
}
