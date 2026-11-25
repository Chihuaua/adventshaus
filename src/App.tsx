import { useEffect, useState } from "react";
import HouseView from "@/components/HouseView";
import StudioApp from "@/StudioApp";
import { OdinStudio, ApolloStudio } from "@/components/HundeStudio";
import MonsStudio from "@/components/MonsStudio";
import TanzStudio from "@/components/TanzStudio";
import PatchView from "@/components/PatchView";
import MethanStudio from "@/components/MethanStudio";
import NikolausStudio from "@/components/NikolausStudio";
import LuniFeinStudio from "@/components/LuniFeinStudio";
import FigurenAtelier from "@/components/FigurenAtelier";
import { atelierAusHash } from "@/game/atelier/figuren";
import { ausbauVorschauAusHash, istAdventshausHash } from "@/game/adventshaus-ausbau";
import { FigurenEditor } from "@/components/FigurenEditor";
import RenovierungStudio from "@/components/RenovierungStudio";

/** Hash-Weiche: "#studio" Figuren-Studio, "#studio-frosch" Methan Frog, "#editor" Figuren-Editor,
    "#studio-odin"/"#studio-apollo" Hunde-Studios,
    "#traumhaus" das normale Haus ohne Weihnachtsdeko, "#gruselhaus" Gruselhaus, sonst das normale Haus. */
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
  // Vorschläge für den Tapetenwechsel im Musikzimmer (reine Vorschau, kein Teil des Spiels).
  if (hash === "#studio-renovierung") return <RenovierungStudio />;
  if (hash === "#studio-schwebetransporter") return <FigurenAtelier key="schwebetransporter" id="briefkurier" fahrzeug />;
  const atelier = atelierAusHash(hash);
  if (atelier) return <FigurenAtelier key={atelier} id={atelier} />;
  if (hash === "#studio") return <StudioApp />;
  if (hash === "#studio-luni-fein") return <LuniFeinStudio />;
  if (hash === "#studio-odin") return <OdinStudio />;
  if (hash === "#studio-apollo") return <ApolloStudio />;
  if (hash === "#studio-mons") return <MonsStudio />;
  if (hash === "#studio-tanz") return <TanzStudio />;
  if (hash === "#patch") return <PatchView />;
  if (hash === "#studio-frosch") return <MethanStudio />;
  if (hash === "#studio-nikolaus") return <NikolausStudio />;
  if (hash === "#studio-ruprecht") return <NikolausStudio key="ruprecht" gast="ruprecht" />;
  if (hash === "#editor") return <FigurenEditor />;
  // Adventshaus: Klon des Traumhauses, der über den Adventskalender ausgebaut wird.
  // "#adventshaus/12" zeigt eine Ausbaustufe zur Abnahme, ohne den Speicher zu ändern.
  if (istAdventshausHash(hash)) {
    return <HouseView key="adventshaus" welt="adventshaus" ausbauVorschau={ausbauVorschauAusHash(hash)} />;
  }
  if (hash === "#traumhaus") return <HouseView key="traum" welt="traum" />;
  // key: jede Hauswelt bekommt ihre eigene Instanz (und damit ihren eigenen Speicher)
  if (hash === "#gruselhaus") return <HouseView key="gruesel" welt="gruesel" />;
  if (hash === "#weihnachtshaus") return <HouseView key="weihnacht" welt="weihnacht" />;
  return <HouseView key="normal" />;
}
