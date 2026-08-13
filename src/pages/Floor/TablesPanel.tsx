import { useCallback, useMemo, useState, type FormEvent } from "react";
import { createTable, deleteTable, getOrders, getTables, updateTable } from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { ACTIVE_ORDER_STATUSES } from "../../../shared/types";

export default function TablesPanel() {
  const tablesFetcher = useCallback(() => getTables(), []);
  const ordersFetcher = useCallback(() => getOrders({ statuses: ACTIVE_ORDER_STATUSES }), []);
  const { data: tables, error: tablesError, refetch: refetchTables } = usePolling(tablesFetcher, 5000);
  const { data: activeOrders } = usePolling(ordersFetcher, 5000);

  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSeats, setEditSeats] = useState("");

  const statusByTable = useMemo(() => {
    const map = new Map<string, string>();
    activeOrders?.forEach((order) => {
      if (!map.has(order.tableId)) map.set(order.tableId, order.status);
    });
    return map;
  }, [activeOrders]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setFormError(null);
    try {
      await createTable({ label: label.trim(), seats: seats ? Number(seats) : undefined });
      setLabel("");
      setSeats("");
      refetchTables();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create table");
    }
  }

  function startEdit(id: string, currentLabel: string, currentSeats: number | null) {
    setEditingId(id);
    setEditLabel(currentLabel);
    setEditSeats(currentSeats?.toString() ?? "");
  }

  async function saveEdit(id: string) {
    try {
      await updateTable(id, { label: editLabel.trim(), seats: editSeats ? Number(editSeats) : undefined });
      setEditingId(null);
      refetchTables();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update table");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this table? This can't be undone.")) return;
    try {
      await deleteTable(id);
      refetchTables();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete table — it may have existing orders");
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/guest/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div>
      <form className="form-row" onSubmit={handleCreate}>
        <input placeholder="Table label (e.g. Table 4)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input
          type="number"
          min={1}
          placeholder="Seats"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          style={{ maxWidth: 100 }}
        />
        <button type="submit">Add table</button>
      </form>

      {(formError || tablesError) && <div className="error-banner">{formError ?? tablesError}</div>}

      {!tables || tables.length === 0 ? (
        <p className="empty-state">No tables yet.</p>
      ) : (
        <div className="table-grid">
          {tables.map((table) => {
            const activeStatus = statusByTable.get(table.id);
            const guestUrl = `${window.location.origin}/guest/${table.guestToken}`;
            return (
              <div className="table-card" key={table.id}>
                {editingId === table.id ? (
                  <>
                    <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                    <input
                      type="number"
                      min={1}
                      value={editSeats}
                      onChange={(e) => setEditSeats(e.target.value)}
                      placeholder="Seats"
                    />
                    <div className="order-actions">
                      <button type="button" onClick={() => saveEdit(table.id)}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="table-card-header">
                      <strong>{table.label}</strong>
                      {activeStatus && <span className={`status-badge ${activeStatus}`}>{activeStatus.replace("_", " ")}</span>}
                    </div>
                    {table.seats && <div className="order-meta">{table.seats} seats</div>}
                    <div className="guest-link">{guestUrl}</div>
                    <div className="order-actions">
                      <button type="button" onClick={() => copyLink(table.guestToken)}>
                        Copy link
                      </button>
                      <button type="button" onClick={() => startEdit(table.id, table.label, table.seats)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(table.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
