import { useEffect, useState } from "react";
import HouseView from "@/components/HouseView";
import TraumhausView from "@/components/TraumhausView";
import StudioApp from "@/StudioApp";
import { OdinStudio, ApolloStudio } from "@/components/HundeStudio";
import MonsStudio from "@/components/MonsStudio";
import TanzStudio from "@/components/TanzStudio";
import PatchView from "@/components/PatchView";

/** Hash-Weiche: "#studio" Figuren-Studio, "#studio-odin"/"#studio-apollo" Hunde-Studios,
    "#traumhaus" Traumhaus, "#gruselhaus" Gruselhaus, sonst das normale Haus. */
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
  if (hash === "#studio-odin") return <OdinStudio />;
  if (hash === "#studio-apollo") return <ApolloStudio />;
  if (hash === "#studio-mons") return <MonsStudio />;
  if (hash === "#studio-tanz") return <TanzStudio />;
  if (hash === "#patch") return <PatchView />;
  if (hash === "#traumhaus") return <TraumhausView />;
  // key: jede Hauswelt bekommt ihre eigene Instanz (und damit ihren eigenen Speicher)
  if (hash === "#gruselhaus") return <HouseView key="gruesel" welt="gruesel" />;
  if (hash === "#weihnachtshaus") return <HouseView key="weihnacht" welt="weihnacht" />;
  return <HouseView key="normal" />;
}
