import React, { useState } from "react";
import { toast } from "react-toastify";
import { getVyapariPatrak } from "../../services/reports/vyapariPatrak";

function Vyaparipatrak() {
  const loginDate = localStorage.getItem("loginDate")
    ? new Date(localStorage.getItem("loginDate")).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(loginDate);
  const [toDate, setToDate] = useState(loginDate);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      toast.warning("Please select both From and To dates.");
      return;
    }

    setLoading(true);
    try {
      const response = await getVyapariPatrak(fromDate, toDate);
      if (response.data) {
        setReportData(response.data);
      } else {
        setReportData(null);
        toast.info("No data found for the selected date range.");
      }
    } catch (error) {
      console.error("Error fetching Trading Account:", error);
      toast.error("Failed to fetch report data.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  let leftSide = [];
  let rightSide = [];

  if (reportData) {
    const incomeList = reportData.Income?.List?.$values || reportData.Income?.List || [];
    const expenseList = reportData.Expense?.List?.$values || reportData.Expense?.List || [];
    const summary = reportData.Summary || {};
    const grossProfit = reportData.Gross_Profit || { PV: 0, Curr: 0 };
    const grossLoss = reportData.Gross_Loss || { PV: 0, Curr: 0 };

    const maxCoreRows = Math.max(incomeList.length, expenseList.length);

    // 1. Populate core rows
    for (let i = 0; i < maxCoreRows; i++) {
      const incItem = incomeList[i];
      const expItem = expenseList[i];

      leftSide.push({
        type: "item",
        Group_name: incItem ? (incItem.Group_name || "-") : "",
        Curr: incItem ? (incItem.Curr || 0) : null
      });

      rightSide.push({
        type: "item",
        Group_name: expItem ? (expItem.Group_name || "-") : "",
        Curr: expItem ? (expItem.Curr || 0) : null
      });
    }

    // Calculate core subtotals
    const leftSubtotal = incomeList.reduce((sum, item) => sum + (item.Curr || 0), 0);
    const rightSubtotal = expenseList.reduce((sum, item) => sum + (item.Curr || 0), 0);

    // 2. Add "Total Income" / "Total Expenses" subtotals
    leftSide.push({
      type: "subtotal",
      Group_name: "Total Income",
      Curr: leftSubtotal,
      isBold: true
    });
    rightSide.push({
      type: "subtotal",
      Group_name: "Total Expenses",
      Curr: rightSubtotal,
      isBold: true
    });

    // 3. Add "Remaining Stock" / "Opening Stock" (always show, even if 0)
    leftSide.push({
      type: "stock",
      Group_name: "Remaining Stock",
      Curr: summary.Akher_Shillak_Maal || 0,
      isBold: true
    });
    rightSide.push({
      type: "stock",
      Group_name: "Opening Stock",
      Curr: summary.Aarambhi_Shillak_Maal || 0,
      isBold: true
    });

    // 4. Add "Gross Profit" / "Gross Loss" (always show, even if 0)
    leftSide.push({
      type: "gross",
      Group_name: "Gross Profit",
      Curr: grossProfit.Curr || 0,
      isBold: true
    });
    rightSide.push({
      type: "gross",
      Group_name: "Gross Loss",
      Curr: grossLoss.Curr || 0,
      isBold: true
    });

    // 5. Calculate Grand Totals
    const leftGrandTotal = leftSubtotal + (summary.Akher_Shillak_Maal || 0) + (grossProfit.Curr || 0);
    const rightGrandTotal = rightSubtotal + (summary.Aarambhi_Shillak_Maal || 0) + (grossLoss.Curr || 0);

    // 6. Add final Grand Total rows
    leftSide.push({
      type: "grandtotal",
      Group_name: "Total",
      Curr: leftGrandTotal,
      isBold: true
    });
    rightSide.push({
      type: "grandtotal",
      Group_name: "Total",
      Curr: rightGrandTotal,
      isBold: true
    });
  }

  const maxRows = Math.max(leftSide.length, rightSide.length);

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0">
        <div
          className="card-header text-white"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>Vyapari Patrak
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100"
                onClick={fetchReport}
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <i className="bi bi-search me-2"></i>
                )}
                View
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th colSpan="2" className="bg-success-subtle text-success fw-bold border-secondary">
                    Income
                  </th>
                  <th colSpan="2" className="bg-danger-subtle text-danger fw-bold border-secondary">
                    Expense
                  </th>
                </tr>
                <tr className="bg-light">
                  {/* Income Columns */}
                  <th className="align-middle border-secondary" style={{ width: "35%" }}>Particulars</th>
                  <th className="align-middle border-secondary" style={{ width: "15%" }}>Amount</th>

                  {/* Expense Columns */}
                  <th className="align-middle border-secondary" style={{ width: "35%" }}>Particulars</th>
                  <th className="align-middle border-secondary" style={{ width: "15%" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData ? (
                  maxRows > 0 ? (
                    Array.from({ length: maxRows }).map((_, index) => {
                      const leftRow = leftSide[index];
                      const rightRow = rightSide[index];

                      return (
                        <tr 
                          key={index}
                          className={
                            leftRow?.type === "subtotal" || rightRow?.type === "subtotal"
                              ? "table-info fw-bold border-top border-bottom"
                              : leftRow?.type === "grandtotal" || rightRow?.type === "grandtotal"
                              ? "table-dark text-white fw-bold"
                              : ""
                          }
                        >
                          {/* Income Side */}
                          {leftRow && leftRow.Group_name ? (
                            <>
                              <td className={`text-start border-secondary ${leftRow.isBold ? "fw-bold" : ""}`}>
                                {leftRow.Group_name}
                              </td>
                              <td className={`text-end border-secondary ${leftRow.isBold ? "fw-bold" : "fw-semibold"}`}>
                                {leftRow.Curr !== null ? `₹${parseFloat(leftRow.Curr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ""}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border-secondary"></td>
                              <td className="border-secondary"></td>
                            </>
                          )}

                          {/* Expense Side */}
                          {rightRow && rightRow.Group_name ? (
                            <>
                              <td className={`text-start border-secondary ${rightRow.isBold ? "fw-bold" : ""}`}>
                                {rightRow.Group_name}
                              </td>
                              <td className={`text-end border-secondary ${rightRow.isBold ? "fw-bold" : "fw-semibold"}`}>
                                {rightRow.Curr !== null ? `₹${parseFloat(rightRow.Curr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ""}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border-secondary"></td>
                              <td className="border-secondary"></td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No records found
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      Select dates and click View
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Vyaparipatrak;
