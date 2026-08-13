import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="home">
      <h1>Meridian Kitchen</h1>
      <p>Menu architecture, table management, and direct guest ordering.</p>
      <nav className="home-links">
        <Link to="/floor">Floor</Link>
        <Link to="/kitchen">Kitchen</Link>
      </nav>
      <p className="home-note">
        Guests order from a table-specific link (<code>/guest/:token</code>) generated on the Floor page —
        there's no general entry point here.
      </p>
    </main>
  );
}
