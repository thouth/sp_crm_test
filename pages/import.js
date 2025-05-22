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
  const [updated, setUpdated] = useState([]);
  const [inserted, setInserted] = useState([]);

  async function handleFile(e) {
    setLoading(true);
    setMsg("");
    setUpdated([]);
    setInserted([]);
    const file = e.target.files[0];

    parseExcel(file, async (rows) => {
      // Hent alle eksisterende leads fra Supabase
      let { data: existingLeads } = await supabase.from("leads").select("*");

      // Bygg mapper for rask oppslag
      let orgMap = new Map();
      let firmMap = new Map();
      for (const lead of existingLeads ?? []) {
        if (lead.orgnr) orgMap.set(lead.orgnr.replace(/\s/g, '').toLowerCase(), lead);
        if (lead.firmanavn) firmMap.set(lead.firmanavn.replace(/\s/g, '').toLowerCase(), lead);
      }

      const nyInsert = [];
      const nyUpdate = [];

      for (const row of rows) {
        const org = row["Org.nr"] ? row["Org.nr"].replace(/\s/g, '').toLowerCase() : null;
        const firm = row["Firmanavn"] ? row["Firmanavn"].replace(/\s/g, '').toLowerCase() : null;
        let match = null;

        // Finn matchende rad
        if (org && orgMap.has(org)) {
          match = orgMap.get(org);
        } else if (firm && firmMap.has(firm)) {
          match = firmMap.get(firm);
        }

        // Parse/formatter verdier fra rad
        const nyData = {
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
        };

        // Hvis match finnes, oppdater kun tomme felter
        if (match) {
          const oppdatering = {};
          let needsUpdate = false;
          for (let key of Object.keys(nyData)) {
            if (
              (match[key] === null || match[key] === "" || typeof match[key] === "undefined" || (typeof match[key] === "number" && !match[key])) &&
              nyData[key] !== "" && nyData[key] !== null && typeof nyData[key] !== "undefined" && (!(typeof nyData[key] === "number") || nyData[key])
            ) {
              oppdatering[key] = nyData[key];
              needsUpdate = true;
            }
          }
          if (needsUpdate) {
            // Oppdater kun feltene som manglet
            await supabase.from("leads").update(oppdatering).eq('id', match.id);
            nyUpdate.push({ firmanavn: match.firmanavn, orgnr: match.orgnr });
          }
        } else {
          // Ikke duplikat, legg til som ny rad
          await supabase.from("leads").insert([nyData]);
          nyInsert.push({ firmanavn: nyData.firmanavn, orgnr: nyData.orgnr });
        }
      }

      setMsg(`Importert ${nyInsert.length} nye leads. Oppdaterte ${nyUpdate.length} eksisterende leads!`);
      setUpdated(nyUpdate);
      setInserted(nyInsert);
      setLoading(false);
    });
  }

  return (
    <main style={{padding: 40}}>
      <h2>Importer leads (Excel)</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} disabled={loading} />
      {loading && <p>Laster opp...</p>}
      {msg && <p>{msg}</p>}
      {inserted.length > 0 && (
        <div style={{color: "green", marginTop: 16}}>
          <b>La til nye leads:</b>
          <ul>
            {inserted.map((d, i) => (
              <li key={i}>{d.firmanavn} ({d.orgnr})</li>
            ))}
          </ul>
        </div>
      )}
      {updated.length > 0 && (
        <div style={{color: "orange", marginTop: 16}}>
          <b>Oppdaterte eksisterende leads:</b>
          <ul>
            {updated.map((d, i) => (
              <li key={i}>{d.firmanavn} ({d.orgnr})</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
