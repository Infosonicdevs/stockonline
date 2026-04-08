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

function AssignCounter() {
  const getInitialLoginDate = () => {
    const storedDate = localStorage.getItem("loginDate");
    if (storedDate) {
      // Handle potential different formats or just return as is if it's already YYYY-MM-DD
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

  const [formData, setFormData] = useState({
    Counter_id: "",
    Emp_id: "",
    Login_date: getInitialLoginDate(),
    Status: "1",
    Opn_bal: 0,
    Closing_bal: 0,
    Login_time: getCurrentTime(),
    Log_out_date: "",
    Log_out_time: "",
  });

  const [dataList, setDataList] = useState([]);
  const [counterList, setCounterList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
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

  const filteredList = dataList.filter((item) => {
    const counterName = item.Counter_name || "";
    const empName = item.Emp_name || "";
    const search = searchName.toLowerCase();
    return (
      counterName.toLowerCase().includes(search) ||
      empName.toLowerCase().includes(search)
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClear = () => {
    setFormData({ 
      Counter_id: "",
      Emp_id: "",
      Login_date: getInitialLoginDate(),
      Status: "1",
      Opn_bal: 0,
      Closing_bal: 0,
      Login_time: getCurrentTime(),
      Log_out_date: "",
      Log_out_time: "",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.Counter_id) return toast.error("Select Counter");
    if (!formData.Emp_id) return toast.error("Select Employee");

    try {
      const username = localStorage.getItem("username");
      const currentTime = getCurrentTime();
      const currentDate = new Date().toISOString().split("T")[0];

      let bodyData = {
        ...formData,
        Counter_id: parseInt(formData.Counter_id),
        Emp_id: parseInt(formData.Emp_id),
        Opn_bal: parseFloat(formData.Opn_bal),
        Closing_bal: parseFloat(formData.Closing_bal),
        User_name: username,
      };

      let response;
      if (editIndex !== null) {
        bodyData.Id = dataList[editIndex].Id;

        // On status closed, only then update Logout Date and Time
        if (formData.Status === "0") {
          bodyData.Log_out_date = currentDate;
          bodyData.Log_out_time = currentTime;
        }

        response = await updateAssignedCounter(bodyData);
      } else {
        // Save new assignment
        bodyData.Login_date = getInitialLoginDate();
        bodyData.Login_time = currentTime;
        response = await saveAssignedCounter(bodyData);
      }

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Counter Assigned Successfully!" ||
        response.data === "Updated Successfully!" ||
        response.data.message === "Updated Successfully!"
      ) {
        toast.success(
          editIndex !== null ? "Updated successfully" : "Assigned successfully",
        );
        handleClear();
        fetchAssignedCounters();
        setShowTable(true);
      }
    } catch (error) {
      console.error("Error saving/updating:", error);
      toast.error(error.response?.data || "Failed to process request");
    }
  };

  const handleEdit = (index) => {
    const item = filteredList[index];
    setFormData({
      Counter_id: item.Counter_id,
      Emp_id: item.Emp_id,
      Login_date: item.Login_date ? item.Login_date.split("T")[0] : "",
      Status: item.Status,
      Opn_bal: item.Opn_bal,
      Closing_bal: item.Closing_bal,
      Login_time: item.Login_time,
      Log_out_date: item.Log_out_date ? item.Log_out_date.split("T")[0] : "",
      Log_out_time: item.Log_out_time || "",
    });
    const realIndex = dataList.findIndex((d) => d.Id === item.Id);
    setEditIndex(realIndex);
    setShowTable(false);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    const item = filteredList[index];
    try {
      const bodyData = {
        Id: item.Id,
        User_name: localStorage.getItem("username"),
      };
      const response = await deleteAssignedCounter(bodyData);
      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Record Deleted!"
      ) {
        toast.success("Deleted successfully");
        fetchAssignedCounters();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(error.response?.data || "Failed to delete record");
    }
  };

  return (
    <div className="container my-2" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "800px" }}
      >
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Assign Counter</h5>
        </div>

        {!showTable && (
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label">
                  Counter <span className="text-danger">*</span>
                </label>
                <select
                  name="Counter_id"
                  className="form-select form-select-sm"
                  value={formData.Counter_id}
                  onChange={handleChange}
                >
                  <option value="">Select Counter</option>
                  {counterList.map((c) => (
                    <option key={c.Counter_Id} value={c.Counter_Id}>
                      {c.Counter_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Employee <span className="text-danger">*</span>
                </label>
                <select
                  name="Emp_id"
                  className="form-select form-select-sm"
                  value={formData.Emp_id}
                  onChange={handleChange}
                >
                  <option value="">Select Employee</option>
                  {employeeList.map((e) => (
                    <option key={e.Emp_id} value={e.Emp_id}>
                      {e.Emp_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-md-6">
                <label className="form-label">Opening Balance</label>
                <input
                  type="number"
                  name="Opn_bal"
                  className="form-control form-control-sm"
                  value={formData.Opn_bal}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  name="Status"
                  className="form-select form-select-sm"
                  value={formData.Status}
                  onChange={handleChange}
                >
                  <option value="1">Open</option>
                  <option value="0">Closed</option>
                </select>
              </div>
            </div>

            {editIndex !== null && formData.Status === "0" && (
              <div className="row g-3 mb-2">
                <div className="col-md-6">
                  <label className="form-label">Closing Balance</label>
                  <input
                    type="number"
                    name="Closing_bal"
                    className="form-control form-control-sm"
                    value={formData.Closing_bal}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="text-center mt-3 d-flex justify-content-center gap-2">
              <button type="submit" className="button-save">
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="button-clear"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                onClick={() => setShowTable(true)}
              >
                Show List
              </button>
            </div>
          </form>
        )}

        {showTable && (
          <div className="table-responsive mt-2" style={{ maxHeight: "60vh" }}>
            <div className="d-flex align-items-center justify-content-between mb-2 gap-2 position-sticky top-0 bg-white z-3 py-2 border-bottom">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowTable(false)}
              >
                Back to Form
              </button>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ width: "200px" }}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search..."
                />
              </div>
            </div>

            <table className="table table-bordered table-sm table-striped text-center">
              <thead className="table-light">
                <tr>
                  <th>Actions</th>
                  <th>Sr.No</th>
                  <th>Counter</th>
                  <th>Employee</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8">No records found</td>
                  </tr>
                ) : (
                  filteredList.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-1"
                          onClick={() => handleEdit(index)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                      <td>{index + 1}</td>
                      <td>{item.Counter_name}</td>
                      <td>{item.Emp_name}</td>
                      <td>{item.Opn_bal}</td>
                      <td>{item.Status === "1" ? "Open" : "Closed"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignCounter;
