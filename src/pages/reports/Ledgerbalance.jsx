import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getLedgers,
  getLedgerByNo,
  getLedgerBalances,
  saveLedgerBalance,
  updateLedgerBalance,
  deleteLedgerBalance,
} from "../../services/reports/ledgerBalance";

function LedgerEntry() {
  const username = localStorage.getItem("username");
  const [ledgers, setLedgers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    ledgerNo: "",
    ledgerID: "",
    amount: "00.00",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const selectedLedger = ledgers.find((l) => l.Ledger_id === formData.ledgerID);
  const ledgerNo = selectedLedger?.Ledger_no || "";
  const ledgerName = selectedLedger?.Ledger_name || "";

  //searchbar
  const filteredEntries = entries.filter((e) => {
    const ledger = ledgers.find((l) => l.Ledger_id === e.L_id);
    if (!ledger) return false;

    const search = searchTerm.toLowerCase();

    const values = [ledger.Ledger_no, ledger.Ledger_name, e.Amt];

    return values.some((val) => val?.toString().toLowerCase().includes(search));
  });

  const handleLedgerNoChange = (e) => {
    const ledgerNo = e.target.value;
    setFormData((prev) => ({ ...prev, ledgerNo }));

    const selected = ledgers.find((l) => l.Ledger_no === Number(ledgerNo));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        ledgerID: selected.Ledger_id,
        ledgerNo: selected.Ledger_no,
      }));
    } else {
      setFormData((prev) => ({ ...prev, ledgerID: "" }));
    }
  };

  // Fetch all ledgers for dropdown
  useEffect(() => {
    getLedgers()
      .then((res) => setLedgers(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Auto-fill ledger name when ledgerNo changes
  useEffect(() => {
    if (!formData.ledgerNo) return;
    getLedgerByNo(formData.ledgerNo)
      .then((res) => {
        if (res.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            ledgerName: res.data[0].Ledger_name,
          }));
        }
      })
      .catch((err) => console.error(err));
  }, [formData.ledgerNo]);

  // Ledger name change → fill ledgerNo
  const handleLedgerNameChange = (e) => {
    const ledgerID = Number(e.target.value);
    const selected = ledgers.find((l) => l.Ledger_id === ledgerID);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        ledgerID: selected.Ledger_id,
        ledgerNo: selected.Ledger_no,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const selectedLedger = ledgers.find(
        (l) => l.Ledger_id === formData.ledgerID,
      );

      if (!selectedLedger) {
        toast.error("Ledger not found");
        return;
      }

      if (formData.amount === "" || formData.amount === "00.00") {
        toast.error("Amount should be greater than 0");
        return;
      }

      const payload = {
        L_id: selectedLedger.Ledger_id,
        Amt: parseFloat(formData.amount),
        User_name: username,
      };

      if (editIndex !== null) {
        payload.Opn_bal_id = editIndex;
        await updateLedgerBalance(payload);
        toast.success("Entry updated successfully!");
      } else {
        await saveLedgerBalance(payload);
        toast.success("Entry saved successfully!");
      }

      handleClear();
      fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error("Record already exist");
    }
  };
  const handleClear = () => {
    setFormData({
      ledgerNo: "",
      ledgerID: "", // <-- clear this too
      ledgerName: "",
      amount: "",
    });
    setEditIndex(null);
  };
  // Fetch all ledger entries from backend
  const fetchEntries = async () => {
    try {
      const res = await getLedgerBalances();
      setEntries(res.data);
      setShowTable(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id) => {
    const entry = entries.find((e) => e.Opn_bal_id === id);
    const ledger = ledgers.find((l) => l.Ledger_id === entry.L_id);

    setFormData({
      ledgerID: ledger?.Ledger_id || "",
      ledgerNo: ledger?.Ledger_no || "",
      ledgerName: ledger?.Ledger_name || "",
      amount: entry.Amt,
    });

    setEditIndex(entry.Opn_bal_id);
    setShowTable(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteLedgerBalance({
        Opn_bal_id: id,
        User_name: username,
      });

      fetchEntries();
      toast.success("Entry deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data || "Delete failed");
    }
  };

  return (
    <div className="container my-2">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px" }}
      >
        <div
          className="text-white rounded mb-0 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Ledger Balance</h5>
        </div>

        {!showTable ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="row align-items-end g-2 mt-1 mb-3">
              {/* Ledger No */}
              <div className="col-auto">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "2px" }}
                >
                  Ledger No
                </label>
                <input
                  type="number"
                  name="ledgerNo"
                  value={formData.ledgerNo}
                  onChange={handleLedgerNoChange}
                  className="form-control form-control-sm"
                  style={{ width: "120px" }}
                />
              </div>

              {/* Ledger Name */}
              <div className="col-auto">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "2px" }}
                >
                  Ledger Name
                </label>
                <select
                  value={formData.ledgerID}
                  onChange={handleLedgerNameChange}
                  className="form-select form-select-sm"
                  style={{ width: "280px" }}
                >
                  <option value="">Select Ledger</option>
                  {ledgers.map((l) => (
                    <option key={l.Ledger_id} value={l.Ledger_id}>
                      {l.Ledger_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="col-auto">
                <label
                  className="form-label"
                  style={{
                    fontSize: "14px",
                    marginBottom: "2px",
                    marginLeft: "30px",
                  }}
                >
                  Amount
                </label>
                <input
                  type="text"
                  name="amount"
                  className="form-control form-control-sm"
                  value={formData.amount}
                  onFocus={() => {
                    if (formData.amount === "00.00") {
                      setFormData((prev) => ({ ...prev, amount: "" }));
                    }
                  }}
                  onBlur={() => {
                    if (!formData.amount) {
                      setFormData((prev) => ({ ...prev, amount: "00.00" }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(prev.amount).toFixed(2),
                      }));
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (/^\d*\.?\d*$/.test(val)) {
                      setFormData((prev) => ({ ...prev, amount: val }));
                    }
                  }}
                  style={{ width: "120px", marginLeft: "30px" }}
                />
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-center gap-2">
              <button
                type="submit"
                className="button-save"
                style={{ fontSize: "14px" }}
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="button-clear"
                style={{ fontSize: "14px" }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={() => {
                  fetchEntries();
                  setShowTable(true);
                }}
              >
                Show List
              </button>
            </div>
          </form>
        ) : (
          <div
            className="table-responsive mt-2"
            style={{ maxHeight: "60vh", overflowY: "auto", overflowX: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowTable(false)}
              >
                Close
              </button>

              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-search"></i>
                <label className="fw-semibold text-secondary small mb-0 ms-2">
                  Search
                </label>
                <input
                  type="text"
                  className="form-control "
                  style={{
                    width: "230px",
                    marginRight: "250px",
                    height: "25px",
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table
              className="table table-bordered text-center table-sm table-striped"
              style={{
                whiteSpace: "nowrap",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <thead
                className="table-light"
                style={{ fontSize: "13px", fontWeight: "semibold" }}
              >
                <tr>
                  <th className="table-column-bg-heading">Actions</th>
                  <th className="table-column-bg-heading">Sr. No</th>
                  <th className="table-column-bg-heading">Ledger No</th>
                  <th
                    className="table-column-bg-heading"
                    style={{ width: "90px" }}
                  >
                    Ledger Name
                  </th>
                  <th className="table-column-bg-heading">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="5">No records found</td>
                  </tr>
                ) : (
                  filteredEntries.map((e, index) => {
                    const ledger = ledgers.find((l) => l.Ledger_id === e.L_id);
                    return (
                      <tr key={e.Opn_bal_id}>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-1"
                            onClick={() => handleEdit(e.Opn_bal_id)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(e.Opn_bal_id)}
                          >
                            Delete
                          </button>
                        </td>
                        <td>{index + 1}</td>
                        <td>{ledger?.Ledger_no}</td>
                        <td className="text-start">{ledger?.Ledger_name}</td>
                        <td>{Number(e.Amt).toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LedgerEntry;
