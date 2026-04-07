import React, { useEffect, useState } from "react";
import apiClient from "../../../api/client";
import {
  getLedgers,
  getLedgerSettings,
  postLedgerSetting,
  putLedgerSetting,
} from "../../../services/masters/ledgerSetting";
import { toast } from "react-toastify";

function LedgerSetting() {
  const [ledgers, setLedgers] = useState([]);
  const [ledgerSettings, setLedgerSettings] = useState([]);
  const [originalLedgerSettings, setOriginalLedgerSettings] = useState([]);
  const username = localStorage.getItem("username");
  const APIURL = import.meta.env.VITE_APIURL;

  useEffect(() => {
    const fetchData = async () => {
      await handleGetLedgerSettings();
      await handleGetLedgers();
    };
    fetchData();
  }, []);

  const handleGetLedgerSettings = async () => {
    try {
      const result = await getLedgerSettings();
      if (result.status === 200) {
        const dbRows = result.data.map((r) => ({
          ...r,
          isNew: false,
          enabled: true,
        }));

        // Save original rows for reset
        setOriginalLedgerSettings(dbRows);

        const totalRows = 10;
        const emptyRows = Array.from(
          { length: totalRows - dbRows.length },
          () => ({
            No: null,
            Purpose: "",
            Ledger_id: null,
            Ledger_no: "",
            isNew: true,
            enabled: false,
          }),
        );

        setLedgerSettings([...dbRows, ...emptyRows]);
      }
    } catch (error) {
      toast.error("Error occurred while getting ledger settings");
    }
  };

  const handleGetLedgers = async () => {
    try {
      const result = await getLedgers();
      if (result.status === 200) {
        setLedgers(result.data);
      }
    } catch (error) {
      toast.error("Error occured while getting ledgers");
    }
  };

  const handleInsertOrUpdate = async () => {
    try {
      // New rows
      const newRecords = ledgerSettings.filter(
        (r) => r.isNew && r.enabled && r.Purpose,
      );

      if (newRecords.length) {
        for (const record of newRecords) {
          await postLedgerSetting({
            Purpose: record.Purpose,
            Ledger_id: record.Ledger_id ? Number(record.Ledger_id) : null, // <-- important
            User_name: username,
          });
        }
      }

      // Update existing rows
      const updatedRecords = ledgerSettings
        .filter((r) => !r.isNew)
        .map((r) => ({
          No: r.No,
          Purpose: r.Purpose,
          Ledger_id: r.Ledger_id ? Number(r.Ledger_id) : null, // <-- important
          User_name: username,
        }));

      if (updatedRecords.length) {
        await putLedgerSetting(updatedRecords);
      }

      toast.success("Ledger settings updated successfully!");
      await handleGetLedgerSettings();
    } catch (error) {
      toast.error("Error saving ledger settings");
    }
  };

  const handleEnableRow = (index) => {
    const rows = [...ledgerSettings];
    rows[index].enabled = true;
    setLedgerSettings(rows);
  };

  const handlePurposeChange = (index, value) => {
    const rows = [...ledgerSettings];
    rows[index].Purpose = value;
    setLedgerSettings(rows);
  };

  const handleLedgerNoChange = async (index, value) => {
    const rows = [...ledgerSettings];
    rows[index].Ledger_no = value;

    if (!value) {
      rows[index].Ledger_id = "";
      setLedgerSettings(rows);
      return;
    }

    try {
      // API call to get ledger by number
      debugger;
      const res = await apiClient.get(`/api/LedgerByNo?L_no=${value}`);
      const data = res.data;
      console.log(data)

      if (data.length > 0 && data[0].Ledger_id) {
        const ledgerId = Number(data[0].Ledger_id); // ensure type match

        // Check if this ledger exists in the dropdown list
        const ledgerExists = ledgers.find(
          (l) => Number(l.Ledger_id) === ledgerId,
        );
        if (ledgerExists) {
          rows[index].Ledger_id = ledgerId; // this will auto-select Ledger Name in dropdown
        } else {
          rows[index].Ledger_id = ""; // ledger not found
        }
      } else {
        rows[index].Ledger_id = "";
      }
    } catch (error) {
      console.error("Error fetching ledger by number", error);
      rows[index].Ledger_id = "";
    }

    setLedgerSettings(rows);
  };

  const handleLedgerChange = (index, value) => {
    const rows = [...ledgerSettings];
    const ledgerId = Number(value);
    rows[index].Ledger_id = ledgerId;

    const ledger = ledgers.find((l) => Number(l.Ledger_id) === ledgerId);
    if (ledger) {
      rows[index].Ledger_no = ledger.Ledger_no; // auto fill Ledger No
    } else {
      rows[index].Ledger_no = "";
    }

    setLedgerSettings(rows);
  };

  const handleResetRow = (index) => {
    const rows = [...ledgerSettings];
    const row = rows[index];
    if (!row) return;

    if (row.isNew) {
      // new row → clear and disable
      row.enabled = false;
      row.Purpose = "";
      row.Ledger_id = null;
      row.Ledger_no = "";
    } else {
      // DB row → revert to original values but stay enabled
      const original = originalLedgerSettings.find((r) => r.No === row.No);
      if (original) {
        row.Purpose = original.Purpose;
        row.Ledger_id = original.Ledger_id;
        row.Ledger_no = original.Ledger_no;
      }
      // DO NOT disable DB row
      row.enabled = true; // optional: keep enabled
    }

    setLedgerSettings(rows);
  };

  const handleResetAllRows = () => {
    ledgerSettings.forEach((_, idx) => handleResetRow(idx));
  };

  return (
    <div
      className="shadow-lg mt-0 container-fluid d-flex flex-column"
      style={{
        width: "1000px",
        maxWidth: "800px",
        background: "#fafafa",
        height: "84vh",
        boxShadow: "0 4px 12px rgba(0.2, 0.5, 0.7, 0.19)",
      }}
    >
      <div
        className="text-white rounded mb-1 p-2"
        style={{
          backgroundColor: "#365b80",
        }}
      >
        <div className="row align-items-center shadow text-center">
          <div className="col-12">
            <h5 className="mt-0 mb-0 fw-semibold">Ledger Setting</h5>
          </div>
        </div>
      </div>
      <table
        className="table table-bordered table-sm table-striped mb-0"
        style={{ fontSize: "0.9rem", width: "100%" }}
      >
        <thead>
          <tr className="text-center">
            <th>No</th>
            <th>Purpose</th>
            <th>Ledger No</th>
            <th>Ledger Name</th>
            <th>
              <b>+</b>
            </th>
          </tr>
        </thead>
        <tbody>
          {ledgerSettings.map((row, index) => (
            <tr key={index} style={{ height: "40px" }}>
              <td style={{ width: "20px" }}>{row.No || "-"}</td>
              <td style={{ width: "140px" }}>
                {row.enabled ? (
                  row.isNew ? (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.Purpose}
                      onChange={(e) =>
                        handlePurposeChange(index, e.target.value)
                      }
                      style={{ fontSize: "1rem", padding: "2px" }}
                    />
                  ) : (
                    <span style={{ fontSize: "1rem", padding: "2px" }}>
                      {row.Purpose}
                    </span>
                  )
                ) : (
                  "-"
                )}
              </td>
              <td style={{ width: "80px" }}>
                {row.enabled ? (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.Ledger_no || ""}
                    onChange={(e) =>
                      handleLedgerNoChange(index, e.target.value)
                    }
                    style={{ fontSize: "1rem", padding: "2px" }}
                    disabled={row.isNew && !row.enabled}
                  />
                ) : (
                  "-"
                )}
              </td>
              <td
                style={{
                  width: "280px",
                }}
              >
                {row.enabled ? (
                  <select
                    className="form-select form-select-sm"
                    value={row.Ledger_id || ""}
                    onChange={(e) => handleLedgerChange(index, e.target.value)}
                    style={{
                      fontSize: "1rem",
                      padding: "2px",
                      minWidth: "200px",
                      maxWidth: "100%", // prevent overflow
                    }}
                  >
                    <option value="">Select Ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.Ledger_id} value={ledger.Ledger_id}>
                        {ledger.Ledger_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  "-"
                )}
              </td>
              <td style={{ width: "20px" }} className="text-center">
                {row.isNew && !row.enabled ? (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleEnableRow(index)}
                  >
                    +
                  </button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="d-flex justify-content-center mt-1"
        style={{ gap: "10px" }}
      >
        <button
          className="btn btn-primary btn-md"
          onClick={handleInsertOrUpdate}
        >
          ✓
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => handleResetAllRows()}
        >
          x
        </button>
      </div>
    </div>
  );
}

export default LedgerSetting;

