import Link from "next/link";

export default function Home() {
  return (
    <main style={{padding: 40}}>
      <h1>CRM Demo</h1>
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/leads">Leads</Link></li>
        <li><Link href="/import">Import Data</Link></li>
      </ul>
    </main>
  );
}
