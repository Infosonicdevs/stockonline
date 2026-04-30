import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getDayBookMain, getDayBookDetail } from "../../services/reports/dayBook";

function Daybook() {
  const loginDate = localStorage.getItem("loginDate")
    ? new Date(localStorage.getItem("loginDate")).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(loginDate);
  const [loading, setLoading] = useState(false);
  const [creditData, setCreditData] = useState([]);
  const [debitData, setDebitData] = useState([]);
  const [summary, setSummary] = useState({ Total_CR: 0, Total_DR: 0, Grand_Total: 0, Opening_Balance: 0, Closing_Balance: 0 });
  const [viewType, setViewType] = useState("Main");

  const fetchDayBook = async (date, type = viewType) => {
    setLoading(true);
    const outletId = localStorage.getItem("Outlet_id") || "1";
    try {
      const response = type === "Main" ? await getDayBookMain(date, outletId) : await getDayBookDetail(date, outletId);
      
      // Parse Summary
      const summaryData = response.data?.Summary || { Total_CR: 0, Total_DR: 0, Grand_total: 0, Grand_Total: 0, Opening_Balance: 0, Closing_Balance: 0 };
      const openingBalance = parseFloat(summaryData.Opening_Balance || 0);

      // Parse List
      let apiList = response.data?.List?.$values || response.data?.List || [];

      // Handle new nested "Details" structure for Detail view
      if (type === "Detail" && response.data?.Details) {
        const detailsArray = response.data.Details.$values || response.data.Details;
        apiList = [];
        detailsArray.forEach(ledger => {
          const entries = ledger.Entries?.$values || ledger.Entries || [];
          entries.forEach(entry => {
            apiList.push({
              ...entry,
              Ledger_name: ledger.Ledger_name,
              Ledger_no: ledger.Ledger_no
            });
          });
        });
      }
      
      let rawCr = [];
      let dr = [];
      
      if (type === "Main") {
        rawCr = apiList.filter((item) => String(item.CrDr_id) === "1").map(item => {
          const amt = item.CR_Amount !== undefined ? item.CR_Amount : (item.cr_amount !== undefined ? item.cr_amount : (item.Amount || 0));
          return {
            ...item,
            Trans_no: item.Ledger_no !== undefined ? item.Ledger_no : (item.ledger_no !== undefined ? item.ledger_no : "-"),
            Narr: item.Ledger_name || item.ledger_name || "N/A",
            Amount: parseFloat(amt),
            Trans_Type: "Cash"
          };
        });
        dr = apiList.filter((item) => String(item.CrDr_id) === "2").map(item => {
          const amt = item.DR_Amount !== undefined ? item.DR_Amount : (item.dr_amount !== undefined ? item.dr_amount : (item.Amount || 0));
          return {
            ...item,
            Trans_no: item.Ledger_no !== undefined ? item.Ledger_no : (item.ledger_no !== undefined ? item.ledger_no : "-"),
            Narr: item.Ledger_name || item.ledger_name || "N/A",
            Amount: parseFloat(amt),
            Trans_Type: "Cash"
          };
        });
      } else {
        rawCr = apiList.filter((item) => String(item.CrDr_id) === "1").map(item => {
          const amt = item.CR_Amount !== undefined && item.CR_Amount !== 0 ? item.CR_Amount : (item.Amount || 0);
          const narrText = item.Narr ? ` (${item.Narr})` : "";
          return {
            ...item,
            Trans_no: item.Trans_no || "-",
            Narr: `${item.Ledger_name || "N/A"}${narrText}`,
            Amount: parseFloat(amt),
            Trans_Type: item.Trans_Type || "Cash"
          };
        });
        dr = apiList.filter((item) => String(item.CrDr_id) === "2").map(item => {
          const amt = item.DR_Amount !== undefined && item.DR_Amount !== 0 ? item.DR_Amount : (item.Amount || 0);
          const narrText = item.Narr ? ` (${item.Narr})` : "";
          return {
            ...item,
            Trans_no: item.Trans_no || "-",
            Narr: `${item.Ledger_name || "N/A"}${narrText}`,
            Amount: parseFloat(amt),
            Trans_Type: item.Trans_Type || "Cash"
          };
        });
      }

      // Prepend Opening Balance to Credit side on top (amount placed in Cash part)
      const cr = [
        {
          Trans_no: "-",
          Narr: "Opening Balance",
          Amount: openingBalance,
          isOpeningBalance: true,
          Trans_Type: "Cash"
        },
        ...rawCr
      ];
      
      setCreditData(cr);
      setDebitData(dr);

      if (response.data?.Summary) {
        const s = response.data.Summary;
        setSummary({
          Total_CR: parseFloat(s.Total_CR || 0),
          Total_DR: parseFloat(s.Total_DR || 0),
          Grand_Total: parseFloat(s.Grand_total !== undefined ? s.Grand_total : (s.Grand_Total || 0)),
          Opening_Balance: parseFloat(s.Opening_Balance || 0),
          Closing_Balance: parseFloat(s.Closing_Balance || 0),
        });
      } else {
        // Fallback calculation
        const totalCr = cr.reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
        const totalDr = dr.reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
        setSummary({
          Total_CR: totalCr,
          Total_DR: totalDr,
          Grand_Total: totalCr - totalDr,
          Opening_Balance: 0,
          Closing_Balance: totalCr - totalDr,
        });
      }
    } catch (error) {
      console.error("Error fetching daybook data:", error);
      toast.error("Failed to fetch daybook data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayBook(selectedDate, viewType);
  }, [selectedDate, viewType]);

  const maxRows = Math.max(creditData.length, debitData.length > 0 ? debitData.length + 1 : 1);

  const totalCreditCash = creditData.reduce((sum, item) => {
    if (item.isOpeningBalance) return sum + parseFloat(item.Amount || 0);
    return sum + (item.Trans_Type === "Cash" ? parseFloat(item.Amount || 0) : 0);
  }, 0);

  const totalCreditTransfer = creditData.reduce((sum, item) => {
    if (item.isOpeningBalance) return sum;
    return sum + (item.Trans_Type !== "Cash" ? parseFloat(item.Amount || 0) : 0);
  }, 0);

  const totalDebitCash = debitData.reduce((sum, item) => {
    return sum + (item.Trans_Type === "Cash" ? parseFloat(item.Amount || 0) : 0);
  }, 0);

  const totalDebitTransfer = debitData.reduce((sum, item) => {
    return sum + (item.Trans_Type !== "Cash" ? parseFloat(item.Amount || 0) : 0);
  }, 0);

  const calculatedClosingBalance = (totalCreditCash + totalCreditTransfer) - (totalDebitCash + totalDebitTransfer);

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0">
        <div
          className="card-header text-white d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0">
            <i className="bi bi-journal-text me-2"></i>Daybook Report
          </h5>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <label className="mb-0 small text-white">View:</label>
              <select
                className="form-select form-select-sm"
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                style={{ width: "120px" }}
              >
                <option value="Main">Main</option>
                <option value="Detail">Detail</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="mb-0 small text-white">Date:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: "160px" }}
              />
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" style={{ color: "#365b80" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered border-secondary align-middle mb-0 text-center" style={{ fontSize: "14px" }}>
                <thead className="table-light">
                  <tr>
                    <th colSpan="4" className="bg-success-subtle text-success fw-bold border-secondary">
                      Credit
                    </th>
                    <th colSpan="4" className="bg-danger-subtle text-danger fw-bold border-secondary">
                      Debit
                    </th>
                  </tr>
                  <tr className="bg-light">
                    {/* Credit Columns */}
                    <th width="10%" rowSpan="2" className="align-middle border-secondary">Trans No</th>
                    <th rowSpan="2" className="align-middle border-secondary">Particulars</th>
                    <th colSpan="2" className="border-secondary">Amount</th>
                    
                    {/* Debit Columns */}
                    <th width="10%" rowSpan="2" className="align-middle border-secondary">Trans No</th>
                    <th rowSpan="2" className="align-middle border-secondary">Particulars</th>
                    <th colSpan="2" className="border-secondary">Amount</th>
                  </tr>
                  <tr className="bg-light">
                    <th width="15%" className="border-secondary">Cash</th>
                    <th width="15%" className="border-secondary">Transfer</th>
                    <th width="15%" className="border-secondary">Cash</th>
                    <th width="15%" className="border-secondary">Transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxRows }).map((_, index) => {
                    const crRow = creditData[index];
                    const drRow = index === 0 ? null : debitData[index - 1];

                    return (
                      <tr key={index}>
                        {/* Credit Side */}
                        {crRow ? (
                          <>
                            <td className={crRow.isOpeningBalance ? "fw-bold bg-light text-primary" : ""}>{crRow.Trans_no}</td>
                            <td className={`text-start ${crRow.isOpeningBalance ? "fw-bold bg-light text-primary" : ""}`}>{crRow.Ledger_name || crRow.Narr || "N/A"}</td>
                            
                            {/* Cash Column */}
                            <td className={`text-end ${crRow.isOpeningBalance ? "fw-bold bg-light text-primary" : "fw-semibold"}`}>
                              {crRow.isOpeningBalance || crRow.Trans_Type === "Cash"
                                ? `₹${parseFloat(crRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : "-"}
                            </td>
                            
                            {/* Transfer Column */}
                            <td className={`text-end border-secondary ${crRow.isOpeningBalance ? "fw-bold bg-light text-primary" : "fw-semibold"}`}>
                              {!crRow.isOpeningBalance && crRow.Trans_Type !== "Cash"
                                ? `₹${parseFloat(crRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border-secondary">-</td>
                            <td className="border-secondary"></td>
                            <td className="border-secondary"></td>
                            <td className="border-secondary"></td>
                          </>
                        )}

                        {/* Debit Side */}
                        {drRow ? (
                          <>
                            <td>{drRow.Trans_no}</td>
                            <td className="text-start">{drRow.Ledger_name || drRow.Narr || "N/A"}</td>
                            
                            {/* Cash Column */}
                            <td className="text-end fw-semibold">
                              {drRow.Trans_Type === "Cash"
                                ? `₹${parseFloat(drRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : "-"}
                            </td>
                            
                            {/* Transfer Column */}
                            <td className="text-end fw-semibold">
                              {drRow.Trans_Type !== "Cash"
                                ? `₹${parseFloat(drRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>-</td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {maxRows === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No entries found for the selected date.
                      </td>
                    </tr>
                  )}
                </tbody>
                
                {maxRows > 0 && (
                  <tfoot className="table-light fw-bold">
                    <tr>
                      {/* Credit Totals */}
                      <td colSpan="2" className="text-end border-secondary">Total Credit:</td>
                      <td className="text-end fw-bold border-secondary">
                        ₹{parseFloat(totalCreditCash).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end fw-bold border-secondary">
                        ₹{parseFloat(totalCreditTransfer).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Debit Totals */}
                      <td colSpan="2" className="text-end border-secondary">Total Debit:</td>
                      <td className="text-end fw-bold border-secondary">
                        ₹{parseFloat(totalDebitCash).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end fw-bold border-secondary">
                        ₹{parseFloat(totalDebitTransfer).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="table-secondary">
                      <td colSpan="8" className="text-center">
                        Closing Balance: <span className={calculatedClosingBalance >= 0 ? "text-success" : "text-danger"}>
                          ₹{parseFloat(calculatedClosingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Daybook;
