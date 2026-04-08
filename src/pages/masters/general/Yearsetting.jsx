import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/client";
import { validateRequiredFields } from "../../../utils/validator";
import CommonTable from "../../../components/navigation/CommonTable";

const API_BASE = `/api/Year`;

const today = new Date();
const year = today.getFullYear();

const formatDate = (d) => d.toISOString().split("T")[0];

const currentStartDate = `${year}-04-01`;
const currentEndDate = `${year + 1}-03-31`;

const newStartDate = `${year + 1}-04-01`;
const newEndDate = `${year + 2}-03-31`;

const initialFormData = {
  id: 0,
  currentStart: currentStartDate,
  currentEnd: currentEndDate,
  newStart: newStartDate,
  newEnd: newEndDate,
  selection: "current",
  password: "",
  username: "",
};

function YearSetting() {
  const username = localStorage.getItem("username");
  const [formData, setFormData] = useState(initialFormData);
  const [yearList, setYearList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [activeYear, setActiveYear] = useState(null);

  const columns = [
  {
    label: "Sr. No",
    render: (val, row, index) => index + 1,
  },
  {
    label: "Start Date",
    render: (val, row) => formatDisplayDate(row.start),
  },
  {
    label: "End Date",
    render: (val, row) => formatDisplayDate(row.end),
  },
  {
    label: "Status",
    render: (val, row) =>
      row.selection === "current" ? "Active" : "Close",
  },
];

  const calculateNewEnd = (startStr) => {
    if (!startStr) return "";
    const startDate = new Date(startStr);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);
    return endDate.toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date in local YYYY-MM-DD
  const formatLocalDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Add years in local date
  const addYears = (dateStr, years) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return formatLocalDate(d);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "newStart") {
        // Auto-update newEnd whenever newStart changes
        updated.newEnd = calculateNewEnd(value);
      }

      return updated;
    });
  };
  // Auto-calc dates when currentStart changes
  useEffect(() => {
    if (formData.currentStart) {
      const startDate = new Date(formData.currentStart);

      const currentEnd = new Date(startDate);
      currentEnd.setFullYear(currentEnd.getFullYear() + 1);
      currentEnd.setDate(currentEnd.getDate() - 1);

      const newStart = new Date(startDate);
      newStart.setFullYear(newStart.getFullYear() + 1);

      const newEnd = new Date(newStart);
      newEnd.setFullYear(newEnd.getFullYear() + 1);
      newEnd.setDate(newEnd.getDate() - 1);

      const format = (d) => d.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        currentEnd: format(currentEnd),
        newStart: format(newStart),
        newEnd: format(newEnd),
      }));
    }
  }, [formData.currentStart]);

  // Auto-calc newEnd when currentEnd changes
  useEffect(() => {
    if (formData.currentEnd) {
      const newEnd = formData.newEnd || addYears(formData.currentEnd, 1);
      setFormData((prev) => ({ ...prev, newEnd }));
    }
  }, [formData.currentEnd]);

  // Clear form
  const handleClear = () => {
    if (activeYear) {
      setFormData({
        id: activeYear.id,
        currentStart: activeYear.start,
        currentEnd: activeYear.end,
        newStart: addYears(activeYear.start, 1),
        newEnd: addYears(activeYear.end, 1),
        selection: "current",
        password: "",

        username: activeYear.username || username,

      });
    } else {
      setFormData(initialFormData);
    }
    setEditIndex(null);
  };
  // Load years
  const loadYearSettings = async () => {
    try {
      const res = await apiClient.get(API_BASE);

      const data = res.data.map((y) => ({
        id: y.Year_id,
        start: formatLocalDate(y.Start_date),
        end: formatLocalDate(y.End_date),
        selection: y.Status === 1 ? "current" : "new",
        password: "",
        username: y.User_name || "",
      }));

      setYearList(data);

      const currentYear = data.find((x) => x.selection === "current");

      if (currentYear) {
        setActiveYear(currentYear); // Save active year
        setFormData({
          ...formData,
          currentStart: currentYear.start,
          currentEnd: currentYear.end,
          newStart: addYears(currentYear.start, 1),
          newEnd: addYears(currentYear.end, 1),
          selection: "current",
          password: "",
        });
      }



    } catch (err) {
      toast.error("Failed to load year settings");
    }
  };

  useEffect(() => {
    loadYearSettings();
  }, []);

  // Format date for API (MM/dd/yyyy)
  const formatDateForApi = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return (
      `${(d.getMonth() + 1).toString().padStart(2, "0")}/` +
      `${d.getDate().toString().padStart(2, "0")}/` +
      `${d.getFullYear()}`
    );
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    let fields = [];

    if (editIndex !== null) {
      fields = ["newStart", "newEnd", "selection", "password"];
    } else {
      fields = ["currentStart", "currentEnd", "selection"];
    }

    const { isValid } = validateRequiredFields(formData, fields);
    if (!isValid) return toast.warning("Please fill all required fields!");

    const startDate = formData.newStart || formData.currentStart;
    const endDate = formData.newEnd || formData.currentEnd;

    const payload = {
      Year_id: formData.id,
      Start_date: formatDateForApi(startDate),
      End_date: formatDateForApi(endDate),
      Status: formData.selection === "current" ? 1 : 0,
      Password: formData.password,
      User_name: formData.username || username,
    };

    try {
      if (editIndex !== null) {
        await apiClient.put(API_BASE, payload);
        toast.success("Updated successfully ");
      } else {
        await apiClient.post(API_BASE, payload);
        toast.success("Saved successfully");
      }

      handleClear();
      loadYearSettings();
      setShowTable(true);
    } catch (err) {
      toast.error(err.response?.data || "Error saving data");
    }
  };

  // Edit handler
  const handleEdit = (i) => {
    const y = yearList[i];

    setFormData({
      id: y.id,

      newStart: y.start,  // use the exact start date
      newEnd: y.end,      // use the exact end date
      selection: y.selection,
      password: "",
      username: y.username || username,

    });

    setEditIndex(i);
    setShowTable(false);
  };
  return (
    <div
      className="d-flex justify-content-center align-items-center bg-light "
      style={{ height: "75vh", overflow: "hidden" }}
    >
      <div
        className="bg-white p-4 rounded shadow position-relative"
        style={{ width: "500px", height: "auto", overflow: "hidden" }}
      >
        <div
          className="text-white rounded mb-3 p-2"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold text-center">Year Setting</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit} style={{ overflow: "hidden", fontSize:"14px" }}>
            <div className="row g-3">
              {/* Current Financial Year fields - show only if NOT editing */}
              {editIndex === null && (
                <>
                  <div className="col-md-6">

                    <label className="form-label">Current Financial Year Start</label>
                    <input
                      type="date"
                      name="currentStart"
                      style={{fontSize:"14px",marginBottom:"2px"}}

                      value={formData.currentStart}
                      readOnly
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6">

                    <label className="form-label">Current Financial Year End</label>
                    <input
                      type="date"
                      name="currentEnd"
                                style={{fontSize:"14px",marginBottom:"2px"}}

                      value={formData.currentEnd}
                      readOnly
                      className="form-control"
                    />
                  </div>
                </>
              )}

              {/* New Financial Year fields - always show */}
              <div className="col-md-6">
                <label className="form-label">New Financial Year Start</label>
                <input
                  type="date"
                  name="newStart"
                  value={formData.newStart}

                            style={{fontSize:"14px",marginBottom:"2px"}}

                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">New Financial Year End</label>
                <input
                  type="date"
                  name="newEnd"
                  value={formData.newEnd}

                            style={{fontSize:"14px",marginBottom:"2px"}}

                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ marginLeft: "10px",marginBottom:"2px" }}>
                  Status
                </label>
                <select
                  name="selection"
                  value={formData.selection}
                  onChange={handleChange}
                  className="form-select"
                  style={{ width: "100px", marginLeft: "10px",fontSize:"14px",marginBottom:"2px" }}
                >
                  <option value="current">Active</option>
                  <option value="new">Close</option>
                </select>
              </div>

              {formData.selection === "new" && (
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    style={{ width: "100%" }}
                    required
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div
              className=" d-flex justify-content-center "
              style={{ marginTop: "20px", gap: "10px" }}
            >
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
                onClick={handleClear}
                style={{ fontSize: "14px" }}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                onClick={() => {
                  setShowTable(true);
                }}
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        )  : (

    <CommonTable
      columns={columns}
      data={yearList}
      onEdit={(index) => handleEdit(index)}
      onDelete={null} 
      searchValue={""} 
      onSearchChange={() => {}}
      onClose={() => {
        setShowTable(false);
        handleClear();
      }}
    />

)}
      </div>
    </div>
  );
}

export default YearSetting;

