import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalKWp: 0,
    avgPrice: 0,
    eksisterendeKunde: 0,
    nyeKunde: 0
  });

  useEffect(() => {
    async function fetchStats() {
      let { data } = await supabase.from("leads").select("*");
      if (!data) return;
      let totalKWp = data.reduce((sum, l) => sum + (Number(l.kwp) || 0), 0);
      let avgPrice = data.length ? (data.reduce((sum, l) => sum + (Number(l.ppa_pris) || 0), 0) / data.length) : 0;
      let eksisterende = data.filter(l => l.eksisterende_kunde && l.eksisterende_kunde.toLowerCase().startsWith("s")).length;
      setStats({
        totalLeads: data.length,
        totalKWp,
        avgPrice: avgPrice.toFixed(2),
        eksisterendeKunde: eksisterende,
        nyeKunde: data.length - eksisterende
      });
    }
    fetchStats();
  }, []);

  return (
    <main style={{padding: 40}}>
      <h2>Dashboard</h2>
      <div>
        <p><b>Totalt antall leads:</b> {stats.totalLeads}</p>
        <p><b>Total kWp:</b> {stats.totalKWp}</p>
        <p><b>Gj.snitt PPA pris:</b> {stats.avgPrice}</p>
        <p><b>Eksisterende kunder:</b> {stats.eksisterendeKunde}</p>
        <p><b>Nye kunder:</b> {stats.nyeKunde}</p>
      </div>
    </main>
  );
}
