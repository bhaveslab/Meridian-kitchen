import { useState } from "react";
import { Link } from "react-router-dom";
import TablesPanel from "./TablesPanel";
import MenuPanel from "./MenuPanel";

type Tab = "tables" | "menu";

export default function FloorPage() {
  const [tab, setTab] = useState<Tab>("tables");

  return (
    <div className="page">
      <div className="page-header">
        <h1>Floor</h1>
        <Link to="/">Home</Link>
      </div>
      <div className="tabs">
        <button type="button" className={tab === "tables" ? "active" : ""} onClick={() => setTab("tables")}>
          Tables
        </button>
        <button type="button" className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>
          Menu
        </button>
      </div>
      {tab === "tables" ? <TablesPanel /> : <MenuPanel />}
    </div>
  );
}
