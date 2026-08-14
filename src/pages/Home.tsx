export default function Home() {
  return (
    <main className="home">
      <h1>Meridian Kitchen</h1>
      <p>
        Guest ordering, built and owned by the restaurant — no third-party marketplace, no commission fees,
        no data lock-in.
      </p>
      <p className="home-note">
        Each restaurant has its own storefront at <code>/r/:slug</code> and order dashboard at{" "}
        <code>/dashboard/:slug</code>. There's no restaurant directory here yet — v1 launches with a single
        restaurant whose link is shared directly.
      </p>
    </main>
  );
}
