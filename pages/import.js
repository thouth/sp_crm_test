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
      // Hent eksisterende leads
      let { data: existingLeads } = await supabase.from("leads").select("orgnr, firmanavn");
      let existingOrgs = new Set((existingLeads ?? []).map(l => (l.orgnr || '').replace(/\s/g, '').toLowerCase()));
      let existingFirmanavn = new Set((existingLeads ?? []).map(l => (l.firmanavn || '').replace(/\s/g, '').toLowerCase()));

      // Filtrer ut rader som finnes fra før (enten orgnr ELLER firmanavn)
      const newRows = rows.filter(row => {
        const org = (row["Org.nr"] || '').replace(/\s/g, '').toLowerCase();
        const firm = (row["Firmanavn"] || '').replace(/\s/g, '').toLowerCase();
        return !existingOrgs.has(org) && !existingFirmanavn.has(firm);
      });

      // Legg til nye rader
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
