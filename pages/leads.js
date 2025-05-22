import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Leads() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    async function fetchLeads() {
      let { data } = await supabase.from("leads").select("*").order("dato", {ascending: false});
      setLeads(data ?? []);
    }
    fetchLeads();
  }, []);

  return (
    <main style={{padding: 40}}>
      <h2>Leads</h2>
      <table border="1" cellPadding={5} style={{width: "100%"}}>
        <thead>
          <tr>
            <th>Dato</th>
            <th>Firmanavn</th>
            <th>Org.nr</th>
            <th>Status</th>
            <th>Kanal</th>
            <th>Ansvarlig selger</th>
            <th>Årsak avslag</th>
            <th>Eksisterende kunde</th>
            <th>kWp</th>
            <th>PPA pris</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={l.id ?? i}>
              <td>{l.dato}</td>
              <td>{l.firmanavn}</td>
              <td>{l.orgnr}</td>
              <td>{l.status}</td>
              <td>{l.kanal}</td>
              <td>{l.ansvarlig_selger}</td>
              <td>{l.arsak_avslag}</td>
              <td>{l.eksisterende_kunde}</td>
              <td>{l.kwp}</td>
              <td>{l.ppa_pris}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
