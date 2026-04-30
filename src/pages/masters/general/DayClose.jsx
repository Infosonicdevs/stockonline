import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getOutlets } from "../../../services/masters/outlet";
import { getDayCloseList, saveDayClose, closeDay } from "../../../services/masters/dayClose";

function DayClose() {
  const loginDate = localStorage.getItem("loginDate") 
    ? new Date(localStorage.getItem("loginDate")).toISOString().split("T")[0] 
    : new Date().toISOString().split("T")[0];

  const [closeDate, setCloseDate] = useState(loginDate);
  const [outlets, setOutlets] = useState([]);
  const [outletStatuses, setOutletStatuses] = useState({}); // { outletId: { Counters: [], ... } }
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [closeDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await getOutlets();
      const data = response.data?.$values || response.data || [];
      const validOutlets = Array.isArray(data) ? data : [];
      setOutlets(validOutlets);
      
      // Fetch status for each outlet immediately
      const statusPromises = validOutlets.map(outlet => 
        saveDayClose({ 
          Outlet_id: outlet.Outlet_id, 
          Trans_date: closeDate 
        })
          .then(res => ({ 
            id: outlet.Outlet_id, 
            data: res.data?.$values || res.data || {} 
          }))
          .catch(err => {
            console.error(`Error fetching status for outlet ${outlet.Outlet_id}:`, err);
            return { id: outlet.Outlet_id, data: null };
          })
      );

      const statusResults = await Promise.all(statusPromises);
      const statusMap = {};
      statusResults.forEach(res => {
        if (res.data) statusMap[res.id] = res.data;
      });
      setOutletStatuses(statusMap);

    } catch (error) {
      console.error("Error fetching outlets:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (outlet) => {
    try {
      setLoading(true);
      const response = await saveDayClose({
        Outlet_id: outlet.Outlet_id,
        Trans_date: closeDate
      });
      
      const data = response.data?.$values || response.data || {};
      setOutletStatuses(prev => ({
        ...prev,
        [outlet.Outlet_id]: data
      }));
      
      setSelectedOutlet(outlet);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching counter details:", error);
      toast.error("Failed to fetch counter details");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDayClose = async (outletId) => {
    const status = getStatusData(outletId);
    const totalCounters = status.Counters?.length || 0;

    let confirmMessage = "Are you sure you want to close the day for this outlet?";
    if (totalCounters === 0) {
      confirmMessage = "No login activity detected for today. Are you sure you want to close the day with zero transactions?";
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      const payload = {
        Outlet_id: status.Outlet_id,
        Trans_date: status.Trans_date,
        LastTotal: status.LastTotal || 0,
        TodayCR: status.TodayCR || 0,
        TodayDR: status.TodayDR || 0,
        TodayTotal: status.TodayTotal || 0,
        FinalTotal: status.FinalTotal || 0,
        TotalLogin: status.TotalLogin || 0,
        TotalLogout: status.TotalLogout || 0
      };

      const response = await closeDay(payload);

      if (response.status === 200 || response.data === "Saved Successfully!" || response.data?.message === "Saved Successfully!") {
        toast.success("Day closed successfully");
        setShowModal(false);
        fetchInitialData();
      }
    } catch (error) {
      console.error("Error closing day:", error);
      toast.error(error.response?.data || "Failed to process day close");
    }
  };

  const handleProcessAllReady = async () => {
    const readyOutlets = outlets.filter(outlet => {
      const status = getStatusData(outlet.Outlet_id);
      const totalCounters = status.Counters?.length || 0;
      const closedCounters = status.Counters?.filter(c => c.Log_out_date !== null).length || 0;
      return totalCounters === closedCounters;
    });

    if (readyOutlets.length === 0) {
      toast.info("No outlets are ready for Day Close");
      return;
    }

    if (!window.confirm(`Are you sure you want to process Day Close for ${readyOutlets.length} outlet(s)?`)) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const outlet of readyOutlets) {
      try {
        const status = getStatusData(outlet.Outlet_id);
        const payload = {
          Outlet_id: status.Outlet_id,
          Trans_date: status.Trans_date,
          LastTotal: status.LastTotal || 0,
          TodayCR: status.TodayCR || 0,
          TodayDR: status.TodayDR || 0,
          TodayTotal: status.TodayTotal || 0,
          FinalTotal: status.FinalTotal || 0,
          TotalLogin: status.TotalLogin || 0,
          TotalLogout: status.TotalLogout || 0
        };
        await closeDay(payload);
        successCount++;
      } catch (error) {
        console.error(`Error closing day for outlet ${outlet.Outlet_id}:`, error);
        failCount++;
      }
    }

    setLoading(false);
    if (successCount > 0) toast.success(`Successfully closed ${successCount} outlet(s)`);
    if (failCount > 0) toast.error(`Failed to close ${failCount} outlet(s)`);
    fetchInitialData();
  };

  const getStatusData = (outletId) => outletStatuses[outletId] || { Counters: [] };

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm border-0">
        <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#365b80" }}>
          <h5 className="mb-0">Day Close Processing</h5>
          <div className="d-flex align-items-center gap-2">
            <label className="mb-0 small">Date:</label>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={closeDate}
              disabled
              style={{ width: "150px" }}
            />
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" style={{ color: "#365b80" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th width="50">#</th>
                    <th>Code</th>
                    <th>Outlet Name</th>
                    <th>Mobile</th>
                    <th>Total Counters</th>
                    <th>Closed Counters</th>
                    <th>Status</th>
                    <th className="text-end">Today's Total</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet, index) => {
                    const status = getStatusData(outlet.Outlet_id);
                    const totalCounters = status.Counters?.length || 0;
                    const closedCounters = status.Counters?.filter(c => c.Log_out_date !== null).length || 0;
                    const allClosed = totalCounters === closedCounters;

                    return (
                      <tr key={outlet.Outlet_id}>
                        <td>{index + 1}</td>
                        <td>{outlet.Outlet_code}</td>
                        <td>{outlet.Outlet_name}</td>
                        <td>{outlet.Contact_no}</td>
                        <td>{totalCounters}</td>
                        <td>{closedCounters}</td>
                        <td>
                          {totalCounters === 0 ? (
                            <span className="badge bg-secondary">No Activity</span>
                          ) : allClosed ? (
                            <span className="badge bg-success">All Closed</span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              {totalCounters - closedCounters} Open
                            </span>
                          )}
                        </td>
                        <td className="text-end">₹{status.FinalTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button 
                              className="btn btn-sm text-white"
                              style={{ backgroundColor: "#365b80" }}
                              onClick={() => handleViewDetails(outlet)}
                            >
                              <i className="bi bi-eye me-1"></i> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {outlets.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-3 text-muted">No outlets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {(() => {
          if (outlets.length === 0 || loading) return null;

          const isAllReady = outlets.every(outlet => {
            const status = getStatusData(outlet.Outlet_id);
            const totalCounters = status.Counters?.length || 0;
            const closedCounters = status.Counters?.filter(c => c.Log_out_date !== null).length || 0;
            return totalCounters === closedCounters;
          });

          return isAllReady && (
            <div className="card-footer bg-white border-top-0 text-center py-3">
              <button 
                className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
                onClick={handleProcessAllReady}
              >
                <i className="bi bi-calendar-check-fill me-2"></i>
                  Day Close 
              </button>
            </div>
          );
        })()}
      </div>

      {/* Counter Details Modal */}
      {showModal && selectedOutlet && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white" style={{ backgroundColor: "#365b80" }}>
                <h5 className="modal-title">Counter Details - {selectedOutlet.Outlet_name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Counter</th>
                        <th>Employee</th>
                        <th className="text-end">Opening Bal</th>
                        <th className="text-end">Sale</th>
                        <th className="text-end">Dr</th>
                        <th className="text-end">Closing Bal</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStatusData(selectedOutlet.Outlet_id).Counters?.map((counter, idx) => (
                        <tr key={idx}>
                          <td className="ps-3">
                            <div className="fw-bold">{counter.Counter_name}</div>
                            <small className="text-muted">ID: {counter.Counter_id}</small>
                          </td>
                          <td>{counter.Emp_id}</td>
                          <td className="text-end">₹{counter.Opn_bal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                          <td className="text-end text-success">₹{counter.Total_CR?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                          <td className="text-end text-danger">₹{counter.Total_DR?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                          <td className="text-end fw-bold">₹{counter.Closing_bal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                          <td className="text-center">
                            {counter.Log_out_date !== null ? (
                              <span className="badge bg-success-subtle text-success border border-success">
                                <i className="bi bi-check-circle-fill me-1"></i> Closed
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger">
                                <i className="bi bi-x-circle-fill me-1"></i> Open
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!getStatusData(selectedOutlet.Outlet_id).Counters || getStatusData(selectedOutlet.Outlet_id).Counters.length === 0) && (
                        <tr>
                          <td colSpan="7" className="text-center py-3 text-muted">No counter data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div>
                  {(() => {
                    const status = getStatusData(selectedOutlet.Outlet_id);
                    const totalCounters = status.Counters?.length || 0;
                    const closedCounters = status.Counters?.filter(c => c.Log_out_date !== null).length || 0;
                    const allClosed = totalCounters === closedCounters;
                    
                    return allClosed && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleProcessDayClose(selectedOutlet.Outlet_id)}
                      >
                        <i className="bi bi-calendar-check me-1"></i> Process Day Close
                      </button>
                    );
                  })()}
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DayClose;
