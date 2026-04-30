import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAssignedCounters,
  saveAssignedCounter,
  updateAssignedCounter,
  deleteAssignedCounter,
} from "../../../services/masters/AssignCounterService";
import { getCounters } from "../../../services/masters/counter";
import { getEmployees } from "../../../services/masters/user";

const EmployeeAssignmentRow = ({ emp, counterList, existingAssignment, onSave }) => {
  const branchCounters = counterList.filter(c => c.Outlet_id === emp.Outlet_id);
  
  const [selectedCounter, setSelectedCounter] = useState("");
  const [opnBal, setOpnBal] = useState(0);
  const [status, setStatus] = useState("1");
  const [closingBal, setClosingBal] = useState(0);

  // Sync state with existing assignment when it changes
  useEffect(() => {
    if (existingAssignment) {
      setSelectedCounter(existingAssignment.Counter_id || "");
      setOpnBal(existingAssignment.Opn_bal || 0);
      setStatus(existingAssignment.Status || "1");
      setClosingBal(existingAssignment.Closing_bal || 0);
    } else {
      setSelectedCounter("");
      setOpnBal(0);
      setStatus("1");
      setClosingBal(0);
    }
  }, [existingAssignment]);

  const handleSave = () => {
    if (!selectedCounter) {
      toast.error("Please select a counter for " + emp.Emp_name);
      return;
    }
    onSave({
      Emp_id: emp.Emp_id,
      Counter_id: selectedCounter,
      Opn_bal: opnBal,
      Status: status,
      Closing_bal: closingBal,
      existingAssignment
    });
  };

  return (
    <tr>
      <td className="align-middle fw-medium">{emp.Emp_name}</td>
      <td className="align-middle">
        <select 
          className="form-select form-select-sm" 
          value={selectedCounter} 
          onChange={e => setSelectedCounter(e.target.value)}
        >
          <option value="">Select Counter</option>
          {branchCounters.map(c => (
            <option key={c.Counter_Id} value={c.Counter_Id}>{c.Counter_name}</option>
          ))}
        </select>
      </td>
      <td className="align-middle">
        <input 
          type="number" 
          className="form-control form-control-sm" 
          value={opnBal} 
          onChange={e => setOpnBal(e.target.value)} 
          placeholder="Opening"
        />
      </td>
      <td className="align-middle">
        <select 
          className="form-select form-select-sm" 
          value={status} 
          onChange={e => setStatus(e.target.value)}
        >
          <option value="1">Open</option>
          <option value="0">Closed</option>
        </select>
      </td>
      <td className="align-middle">
        {status === "0" ? (
          <input 
            type="number" 
            className="form-control form-control-sm" 
            value={closingBal} 
            onChange={e => setClosingBal(e.target.value)} 
            placeholder="Closing"
          />
        ) : (
          <span className="text-muted text-center d-block">-</span>
        )}
      </td>
      <td className="align-middle text-center">
        <button 
          className={`btn btn-sm ${existingAssignment ? "btn-warning" : "btn-primary"}`} 
          onClick={handleSave}
        >
          {existingAssignment ? "Update" : "Assign"}
        </button>
      </td>
    </tr>
  );
};

function AssignCounter() {
  const getInitialLoginDate = () => {
    const storedDate = localStorage.getItem("loginDate");
    if (storedDate) {
      return storedDate.split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [dataList, setDataList] = useState([]);
  const [counterList, setCounterList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    fetchAssignedCounters();
    fetchCounters();
    fetchEmployees();
  }, []);

  const fetchAssignedCounters = async () => {
    try {
      const response = await getAssignedCounters();
      const data = response.data?.$values || response.data;
      setDataList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching assigned counters:", error);
      toast.error("Failed to load assigned counters");
    }
  };

  const fetchCounters = async () => {
    try {
      const response = await getCounters();
      const data = response.data?.$values || response.data;
      setCounterList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching counters:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      const data = response.data?.$values || response.data;
      setEmployeeList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSaveRow = async (rowData) => {
    try {
      const username = localStorage.getItem("username");
      const currentTime = getCurrentTime();
      const currentDate = new Date().toISOString().split("T")[0];
      const initialDate = getInitialLoginDate();

      let bodyData = {
        Counter_id: parseInt(rowData.Counter_id),
        Emp_id: parseInt(rowData.Emp_id),
        Opn_bal: parseFloat(rowData.Opn_bal) || 0,
        Closing_bal: parseFloat(rowData.Closing_bal) || 0,
        Status: rowData.Status,
        User_name: username,
      };

      let response;
      if (rowData.existingAssignment) {
        bodyData.Id = rowData.existingAssignment.Id;
        // Keep original login date/time when updating
        bodyData.Login_date = rowData.existingAssignment.Login_date;
        bodyData.Login_time = rowData.existingAssignment.Login_time;
        bodyData.Log_out_date = rowData.existingAssignment.Log_out_date || "";
        bodyData.Log_out_time = rowData.existingAssignment.Log_out_time || "";
        
        // On status closed, only then update Logout Date and Time
        if (rowData.Status === "0") {
          bodyData.Log_out_date = currentDate;
          bodyData.Log_out_time = currentTime;
        }

        response = await updateAssignedCounter(bodyData);
      } else {
        // Save new assignment
        bodyData.Login_date = initialDate;
        bodyData.Login_time = currentTime;
        bodyData.Log_out_date = "";
        bodyData.Log_out_time = "";
        response = await saveAssignedCounter(bodyData);
      }

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Counter Assigned Successfully!" ||
        response.data === "Updated Successfully!" ||
        response.data?.message === "Updated Successfully!"
      ) {
        toast.success(rowData.existingAssignment ? "Updated successfully" : "Assigned successfully");
        fetchAssignedCounters();
      } else {
        toast.error("Failed to process request");
      }
    } catch (error) {
      console.error("Error saving/updating:", error);
      toast.error(error.response?.data || "Failed to process request");
    }
  };

  const filteredEmployees = employeeList.filter((emp) => 
    emp.Emp_name?.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div className="container my-2" style={{ fontSize: "14px" }}>
      <div className="bg-white p-4 rounded shadow mx-auto" style={{ maxWidth: "1000px" }}>
        <div className="text-white rounded mb-3 p-2 text-center" style={{ backgroundColor: "#365b80" }}>
          <h5 className="mb-0 fw-semibold">Assign Counter</h5>
        </div>

        <div className="mb-3">
          <input 
            type="text" 
            className="form-control form-control-sm" 
            placeholder="Search Employee..." 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light sticky-top">
              <tr>
                <th>Employee Name</th>
                <th style={{ minWidth: "150px" }}>Counter</th>
                <th style={{ width: "120px" }}>Opn Bal</th>
                <th style={{ width: "100px" }}>Status</th>
                <th style={{ width: "120px" }}>Cls Bal</th>
                <th className="text-center" style={{ width: "80px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => {
                  // Find if employee has an active assignment (either open or closed but not permanently archived, depends on logic. Usually Is_closed !== '1')
                  const existingAssignment = dataList.find(d => 
                    d.Emp_id === emp.Emp_id && 
                    (d.Status === "1" || d.Is_closed !== "1")
                  );
                  
                  return (
                    <EmployeeAssignmentRow 
                      key={emp.Emp_id} 
                      emp={emp} 
                      counterList={counterList} 
                      existingAssignment={existingAssignment} 
                      onSave={handleSaveRow}
                    />
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-3 text-muted">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AssignCounter;
