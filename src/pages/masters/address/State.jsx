import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import { deleteState } from "../../../services/masters/region";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";

function State() {
  const [formData, setFormData] = useState({
    stateNameEn: "",
    stateNameMr: "",
  });
  const username = localStorage.getItem("username");
  const [searchName, setSearchName] = useState("");
  const [states, setStates] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    { label: "State", accessor: "stateNameEn" },
    { label: "State (Regional)", accessor: "stateNameMr" },
  ];

  const filteredStates = states.filter((s) => {
    const term = searchName.trim().toLowerCase();
    if (!term) return true;

    return (
      (s.stateNameEn?.toLowerCase() || "").includes(term) || // State Name
      (s.stateNameMr?.toLowerCase() || "").includes(term) // State Name Regional
    );
  });

  useEffect(() => {
    fetchStates();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClear = () => {
    setFormData({ stateNameEn: "", stateNameMr: "" });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stateNameEn) {
      return toast.warning("Please fill all fields!");
    }

    try {
      const payload = {
        State: formData.stateNameEn,
        State_RL: formData.stateNameMr,
        User_name: username,
        ...(editIndex !== null && { State_id: formData.State_id }),
      };

      if (editIndex !== null) {
        await apiClient.put("/api/State", payload);
      } else {
        await apiClient.post("/api/State", payload);
      }

      toast.success(editIndex !== null ? "Updated successfully" : "Saved successfully");
      await fetchStates();
      handleClear();
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await apiClient.get("/api/State");
      const mapped = res.data.map((s) => ({
        State_id: s.State_id,
        stateNameEn: s.State,
        stateNameMr: s.State_RL,
      }));
      setStates(mapped);
    } catch (err) {
      toast.error("Failed to load states");
    }
  };

  const handleEdit = (data) => {
    const stateId = data.State_id;
    apiClient.get(`/api/State?S_id=${stateId}`).then((res) => {
      const stateData = res.data;
      setFormData({
        stateNameEn: stateData[0].State,
        stateNameMr: stateData[0].State_RL,
        User_name: username,
        State_id: stateData[0].State_id,
      });
      setEditIndex(stateData[0].State_id);
      setShowTable(false);
    });
  };

  const handleDelete = async (data) => {
    try {
      const stateId = data.State_id;

      await deleteState({ State_id: stateId, User_name: username });
      toast.success("Deleted successfully");

      // Reload table
      await fetchStates();
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  return (
    <div className="container my-1">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px" }}
      >
        <div
          className="text-white rounded mb-2 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">State Information</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            {/* Row: State / District (Regional) */}
            <div className="row g-3 mb-0" style={{ fontSize: "14px" }}>
              <div className="col me-4">
                <label className="fw-small">State</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <input
                  type="text"
                  name="stateNameEn"
                  value={formData.stateNameEn}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "240px" }}
                />
              </div>

              <div className="col">
                <label className="fw-small">State (Regional)</label>
                <input
                  type="text"
                  name="stateNameMr"
                  value={formData.stateNameMr}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "240px" }}
                  disabled={!formData.stateNameEn}
                />
              </div>
            </div>

            {/* Buttons */}
            <div
              className=" d-flex justify-content-center "
              style={{ marginTop: "15px", gap: "10px" }}
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
        ) : <CommonTable
          columns={columns}
          data={filteredStates}
          onEdit={(index) => handleEdit(filteredStates[index])}
          onDelete={(index) => handleDelete(filteredStates[index])}
          searchValue={searchName}
          onSearchChange={setSearchName}
          onClose={() => {
            setShowTable(false);
            handleClear();
          }}
        />}
      </div>
    </div>
  );
}

export default State;

