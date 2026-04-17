import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCounters } from "../../../services/masters/counter";
import { getEmployees } from "../../../services/masters/user";
import { saveCounterClose } from "../../../services/masters/counterClose";
import { getAssignedCounters } from "../../../services/masters/AssignCounterService";

function CounterClose() {
  const getCurrentDate = () => {
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
    Id: "",
    Counter_id: "",
    Emp_id: "",
    Bill_from: "",
    Bill_to: "",
    Total_sale: "",
    Cash_sale: "",
    Card_pay: "",
    Upi_pay: "",
    Cust_points: "",
    Cash_return: "",
    Office_return: "",
    Logout_date: getCurrentDate(),
    Logout_time: getCurrentTime(),
  });

  const [counterList, setCounterList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch counters and employees lists for dropdowns (or display)
      const [countersRes, employeesRes, assignedRes] = await Promise.all([
        getCounters(),
        getEmployees(),
        getAssignedCounters()
      ]);

      const counters = countersRes.data?.$values || countersRes.data;
      const employees = employeesRes.data?.$values || employeesRes.data;
      const assigned = assignedRes.data?.$values || assignedRes.data;

      setCounterList(Array.isArray(counters) ? counters : []);
      setEmployeeList(Array.isArray(employees) ? employees : []);

      // 2. Get current logged in Emp_id
      const loggedInEmpId = localStorage.getItem("Emp_id");
      
      if (loggedInEmpId && Array.isArray(assigned)) {
        // 3. Find assigned counter for this employee
        const userAssignment = assigned.find(a => String(a.Emp_id) === String(loggedInEmpId) && a.Status === "1");
        
        if (userAssignment) {
          // Filter lists to only show the relevant assignment
          const filteredCounter = counters.filter(c => String(c.Counter_Id) === String(userAssignment.Counter_id));
          const filteredEmployee = employees.filter(e => String(e.Emp_id) === String(userAssignment.Emp_id));
          
          if (filteredCounter.length > 0) setCounterList(filteredCounter);
          if (filteredEmployee.length > 0) setEmployeeList(filteredEmployee);

          setFormData(prev => ({
            ...prev,
            Id: userAssignment.Id,
            Counter_id: userAssignment.Counter_id,
            Emp_id: userAssignment.Emp_id
          }));
        } else {
          // If no active assignment found, still pre-fill Emp_id and filter employee list if possible
          const filteredEmployee = employees.filter(e => String(e.Emp_id) === String(loggedInEmpId));
          if (filteredEmployee.length > 0) setEmployeeList(filteredEmployee);

          setFormData(prev => ({
            ...prev,
            Emp_id: loggedInEmpId
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClear = () => {
    setFormData({
      ...formData,
      Bill_from: "",
      Bill_to: "",
      Total_sale: "",
      Cash_sale: "",
      Card_pay: "",
      Upi_pay: "",
      Cust_points: "",
      Cash_return: "",
      Office_return: "",
      Logout_date: getCurrentDate(),
      Logout_time: getCurrentTime(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.Counter_id) return toast.error("Select Counter");
    if (!formData.Emp_id) return toast.error("Select Employee");

    try {
      const username = localStorage.getItem("username") || "TRT";
      
      let bodyData = {
        ...formData,
        Id: parseInt(formData.Id) || 0,
        Counter_id: parseInt(formData.Counter_id),
        Emp_id: parseInt(formData.Emp_id),
        Bill_from: parseFloat(formData.Bill_from) || 0,
        Bill_to: parseFloat(formData.Bill_to) || 0,
        Total_sale: parseFloat(formData.Total_sale) || 0,
        Cash_sale: parseFloat(formData.Cash_sale) || 0,
        Card_pay: parseFloat(formData.Card_pay) || 0,
        Upi_pay: parseFloat(formData.Upi_pay) || 0,
        Cust_points: parseFloat(formData.Cust_points) || 0,
        Cash_return: parseFloat(formData.Cash_return) || 0,
        Office_return: parseFloat(formData.Office_return) || 0,
        Logout_date: getCurrentDate(),
        Logout_time: getCurrentTime(),
        User: username,
      };

      const response = await saveCounterClose(bodyData);

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data === "Saved Successfully!" ||
        response.data.message === "Saved Successfully!"
      ) {
        toast.success("Counter Closed Successfully");
        handleClear();
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error.response?.data || "Failed to process request");
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
          <h5 className="mb-0 fw-semibold">Counter Close</h5>
        </div>

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
              <label className="form-label">Bill From</label>
              <input
                type="number"
                name="Bill_from"
                className="form-control form-control-sm"
                value={formData.Bill_from}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Bill To</label>
              <input
                type="number"
                name="Bill_to"
                className="form-control form-control-sm"
                value={formData.Bill_to}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label className="form-label">Total Sale</label>
              <input
                type="number"
                name="Total_sale"
                className="form-control form-control-sm"
                value={formData.Total_sale}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Cash Sale</label>
              <input
                type="number"
                name="Cash_sale"
                className="form-control form-control-sm"
                value={formData.Cash_sale}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label className="form-label">Card Pay</label>
              <input
                type="number"
                name="Card_pay"
                className="form-control form-control-sm"
                value={formData.Card_pay}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">UPI Pay</label>
              <input
                type="number"
                name="Upi_pay"
                className="form-control form-control-sm"
                value={formData.Upi_pay}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label className="form-label">Customer Points</label>
              <input
                type="number"
                name="Cust_points"
                className="form-control form-control-sm"
                value={formData.Cust_points}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Cash Return</label>
              <input
                type="number"
                name="Cash_return"
                className="form-control form-control-sm"
                value={formData.Cash_return}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-2">
            <div className="col-md-12">
              <label className="form-label">Office Return</label>
              <input
                type="number"
                name="Office_return"
                className="form-control form-control-sm"
                value={formData.Office_return}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="text-center mt-3 d-flex justify-content-center gap-2">
            <button type="submit" className="button-save" style={{ fontSize: "14px" }}>
              Save
            </button>
            <button
              type="button"
              className="button-clear"
              style={{ fontSize: "14px" }}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CounterClose;
