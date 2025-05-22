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
      let existingOrgs = new Set(
        (existingLeads ?? [])
          .filter(l => l.orgnr) // kun ikke-tomme org.nr
          .map(l => l.orgnr.replace(/\s/g, '').toLowerCase())
      );
      let existingFirmanavn = new Set(
        (existingLeads ?? [])
          .filter(l => l.firmanavn) // kun ikke-tomme firmanavn
          .map(l => l.firmanavn.replace(/\s/g, '').toLowerCase())
      );

      const toInsert = [];
      const duplikater = [];

      for (const row of rows) {
        const org = row["Org.nr"] ? row["Org.nr"].replace(/\s/g, '').toLowerCase() : null;
        const firm = row["Firmanavn"] ? row["Firmanavn"].replace(/\s/g, '').toLowerCase() : null;

        // Ny logikk:
        // Hvis begge finnes, sjekk om noen finnes fra før
        // Hvis kun org finnes, sjekk org
        // Hvis kun firmanavn finnes, sjekk firmanavn
        // Hvis ingen finnes, ikke sjekk duplikat

        let erDuplikat = false;
        if (org && existingOrgs.has(org)) {
          erDuplikat = true;
        } else if (!org && firm && existingFirmanavn.has(firm)) {
          erDuplikat = true;
        } else if (org && firm && (existingOrgs.has(org) || existingFirmanavn.has(firm))) {
          erDuplikat = true;
        }

        if (erDuplikat) {
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

        // Oppdater settet med ny verdi hvis de finnes
        if (org) existingOrgs.add(org);
        if (firm) existingFirmanavn.add(firm);
      }

      // Send alle nye rader til Supabase (en og en, for enkelhet)
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
