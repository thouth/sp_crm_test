import { useState } from "react";
import { parseExcel } from "../utils/parseExcel";
import { supabase } from "../utils/supabaseClient";

// Funksjon for å konvertere Excel-dato til YYYY-MM-DD
function excelDateToISO(dateSerial) {
  if (!dateSerial || isNaN(dateSerial)) return dateSerial;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + (dateSerial * 24 * 60 * 60 * 1000));
  return date.toISOString().split('T')[0];
}

export default function Import() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ignored, setIgnored] = useState([]);

  async function handleFile(e) {
    setLoading(true);
    setMsg("");
    setIgnored([]);
    const file = e.target.files[0];

    parseExcel(file, async (rows) => {
      // Hent eksisterende leads fra Supabase
      let { data: existingLeads } = await supabase.from("leads").select("orgnr, firmanavn");
      let existingOrgs = new Set((existingLeads ?? []).map(l => (l.orgnr || '').replace(/\s/g, '').toLowerCase()));
      let existingFirmanavn = new Set((existingLeads ?? []).map(l => (l.firmanavn || '').replace(/\s/g, '').toLowerCase()));

      const toInsert = [];
      const duplikater = [];

      for (const row of rows) {
        const org = (row["Org.nr"] || '').replace(/\s/g, '').toLowerCase();
        const firm = (row["Firmanavn"] || '').replace(/\s/g, '').toLowerCase();

        if (existingOrgs.has(org) || existingFirmanavn.has(firm)) {
          duplikater.push({ firmanavn: row["Firmanavn"], orgnr: row["Org.nr"] });
          continue; // Hopp over denne raden
        }
        toInsert.push({
          dato: typeof row["Dato"] === "number" ? excelDateToISO(row["Dato"]) : row["Dato"] || "",
          firmanavn: row["Firmanavn"] || "",
          orgnr: row["Org.nr"] || "",
          status: row["Status"] || "",
          kanal: row["Kanal"] || "",
          ansvarlig_selger: row["Ansvarlig selger"] || "",
          arsak_avslag: row["Årsak avslag"] || "",
          eksisterende_kunde: row["Eksisterende kunde"] || "",
          kwp: Number(row["kWp"] ?? 0),
          ppa_pris: Number(row["PPA pris"] ?? 0)
        });

        // Legg til i eksisterende for å hindre duplikater i samme fil
        existingOrgs.add(org);
        existingFirmanavn.add(firm);
      }

      // Send alle nye rader til Supabase (én og én, kan optimaliseres senere)
      for (const lead of toInsert) {
        await supabase.from("leads").insert([lead]);
      }

      setMsg(`Importert ${toInsert.length} nye leads!`);
      setIgnored(duplikater);
      setLoading(false);
    });
  }

  return (
    <main style={{padding: 40}}>
      <h2>Importer leads (Excel)</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} disabled={loading} />
      {loading && <p>Laster opp...</p>}
      {msg && <p>{msg}</p>}
      {ignored.length > 0 && (
        <div style={{color: "orange", marginTop: 16}}>
          <b>Ignorerte duplikater:</b>
          <ul>
            {ignored.map((d, i) => (
              <li key={i}>
                {d.firmanavn} ({d.orgnr})
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
