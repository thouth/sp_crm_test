import { useState } from "react";
import { parseExcel } from "../utils/parseExcel";
import { supabase } from "../utils/supabaseClient";

export default function Import() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFile(e) {
    setLoading(true);
    setMsg("");
    const file = e.target.files[0];
    parseExcel(file, async (rows) => {
      // Duplikatsjekk: hent alle orgnr fra Supabase
      let { data: existingLeads } = await supabase.from("leads").select("orgnr");
      let existingOrgs = new Set((existingLeads ?? []).map(l => l.orgnr));

      // Filtrer ut rows som allerede finnes
      const newRows = rows.filter(r => !existingOrgs.has(r["Org.nr"]));

      // Map Excel-kolonner til db-felt
      for (const row of newRows) {
        await supabase.from("leads").insert([{
          dato: row["Dato"] || "",
          firmanavn: row["Firmanavn"] || "",
          orgnr: row["Org.nr"] || "",
          status: row["Status"] || "",
          kanal: row["Kanal"] || "",
          ansvarlig_selger: row["Ansvarlig selger"] || "",
          arsak_avslag: row["Årsak avslag"] || "",
          eksisterende_kunde: row["Eksisterende kunde"] || "",
          kwp: Number(row["kWp"] ?? 0),
          ppa_pris: Number(row["PPA pris"] ?? 0)
        }]);
      }
      setMsg(`Importert ${newRows.length} nye leads!`);
      setLoading(false);
    });
  }

  return (
    <main style={{padding: 40}}>
      <h2>Importer leads (Excel)</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
      {loading && <p>Laster opp...</p>}
      {msg && <p>{msg}</p>}
    </main>
  );
}
