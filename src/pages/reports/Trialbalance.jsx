import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTrialBalance } from "../../services/reports/trialbalance";

function Trialbalance() {
  const loginDate = localStorage.getItem("loginDate")
    ? new Date(localStorage.getItem("loginDate")).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(loginDate);
  const [toDate, setToDate] = useState(loginDate);
  const [loading, setLoading] = useState(false);
  
  const [creditData, setCreditData] = useState([]);
  const [debitData, setDebitData] = useState([]);
  const [summary, setSummary] = useState({ Total_Credit: 0, Total_Debit: 0 });

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      toast.warning("Please select both From and To dates.");
      return;
    }

    setLoading(true);
    try {
      const response = await getTrialBalance(fromDate, toDate);
      if (response.data) {
        // Some APIs return lists with $values wrapper, others directly array. Handling both just in case.
        const cList = response.data.Credit_List?.$values || response.data.Credit_List || [];
        const dList = response.data.Debit_List?.$values || response.data.Debit_List || [];
        
        setCreditData(cList);
        setDebitData(dList);
        
        if (response.data.Summary) {
          setSummary({
            Total_Credit: response.data.Summary.Total_Credit || 0,
            Total_Debit: response.data.Summary.Total_Debit || 0,
          });
        } else {
          setSummary({
            Total_Credit: cList.reduce((acc, curr) => acc + (curr.Amount || 0), 0),
            Total_Debit: dList.reduce((acc, curr) => acc + (curr.Amount || 0), 0),
          });
        }
      } else {
        setCreditData([]);
        setDebitData([]);
        setSummary({ Total_Credit: 0, Total_Debit: 0 });
        toast.info("No data found for the selected date range.");
      }
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      toast.error("Failed to fetch report data.");
      setCreditData([]);
      setDebitData([]);
      setSummary({ Total_Credit: 0, Total_Debit: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxRows = Math.max(creditData.length, debitData.length);

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0">
        <div
          className="card-header text-white"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>Trial Balance
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
                Show Report
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th colSpan="2" className="bg-success-subtle text-success fw-bold border-secondary">
                    Credit
                  </th>
                  <th colSpan="2" className="bg-danger-subtle text-danger fw-bold border-secondary">
                    Debit
                  </th>
                </tr>

                <tr className="bg-light">
                  {/* Credit Columns */}
                  <th className="align-middle border-secondary w-25">Particulars</th>
                  <th className="align-middle border-secondary w-25">Amount</th>

                  {/* Debit Columns */}
                  <th className="align-middle border-secondary w-25">Particulars</th>
                  <th className="align-middle border-secondary w-25">Amount</th>
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
                ) : maxRows > 0 ? (
                  Array.from({ length: maxRows }).map((_, index) => {
                    const crRow = creditData[index];
                    const drRow = debitData[index];

                    return (
                      <tr key={index}>
                        {/* Credit Side */}
                        {crRow ? (
                          <>
                            <td className="text-start border-secondary">
                              {crRow.Ledger_name_EN || crRow.Ledger_name || "N/A"}
                            </td>
                            <td className="text-end fw-semibold border-secondary">
                              ₹{parseFloat(crRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border-secondary"></td>
                            <td className="border-secondary"></td>
                          </>
                        )}

                        {/* Debit Side */}
                        {drRow ? (
                          <>
                            <td className="text-start border-secondary">
                              {drRow.Ledger_name_EN || drRow.Ledger_name || "N/A"}
                            </td>
                            <td className="text-end fw-semibold border-secondary">
                              ₹{parseFloat(drRow.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                )}
              </tbody>

              {!loading && maxRows > 0 && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td className="text-end border-secondary text-success">Total Credit:</td>
                    <td className="text-end fw-bold border-secondary text-success">
                      ₹{parseFloat(summary.Total_Credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-end border-secondary text-danger">Total Debit:</td>
                    <td className="text-end fw-bold border-secondary text-danger">
                      ₹{parseFloat(summary.Total_Debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trialbalance;
