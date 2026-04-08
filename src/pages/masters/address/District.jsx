import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import { deleteDistrict } from "../../../services/masters/region";
import { toast } from "react-toastify";
import CommonTable from "../../../components/navigation/CommonTable";

function District() {
  const username = localStorage.getItem("username");
  const [formData, setFormData] = useState({
    Dist_id: null,
    State_id: "",
    Dist: "",
    Dist_RL: "",
    User_name: username,
  });

  const [searchText, setSearchText] = useState("");
  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const columns = [
    {
      label: "Sr. No.",
      render: (val, row, index) => index + 1,
    },
    {
      label: "State",
      render: (val, row) =>
        states.find((s) => s.State_id === row.State_id)?.stateNameEn || "",
    },
    { label: "District", accessor: "Dist" },
    { label: "District (Regional)", accessor: "Dist_RL" },
  ];

  const filteredDistricts = districts.filter((d) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;

    const stateNameEn =
      states.find((s) => s.State_id === d.State_id)?.stateNameEn || "";

    return (
      stateNameEn.toLowerCase().includes(term) || // State Name
      (d.Dist?.toLowerCase() || "").includes(term) || // District Name
      (d.Dist_RL?.toLowerCase() || "").includes(term) // District Name Regional
    );
  });

  useEffect(() => {
    fetchStates();
    fetchDistricts();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClear = () => {
    setFormData({
      Dist_id: null,
      State_id: "",
      Dist: "",
      Dist_RL: "",
      User_name: username,
    });
    setEditIndex(null);
  };

  const fetchStates = async () => {
    try {
      const res = await apiClient.get("/api/State");
      const mapped = res.data.map((s) => ({
        State_id: s.State_id,
        stateNameEn: s.State,
      }));
      setStates(mapped);
    } catch (err) {
      toast.error("Failed to load states");
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await apiClient.get("/api/Dist");
      setDistricts(
        res.data.map((d) => ({
          Dist_id: d.Dist_id,
          State_id: d.State_id,
          Dist: d.Dist,
          Dist_RL: d.Dist_RL,
          User_name: username,
        })),
      );
    } catch (err) {
      toast.error("Failed to load districts");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { State_id, Dist, Dist_id } = formData;

    if (!State_id || !Dist) return toast.warning("Please fill all fields!");

    if (!Dist_id) {
      const duplicate = districts.some(
        (d) =>
          d.State_id === State_id &&
          d.Dist.trim().toLowerCase() === Dist.trim().toLowerCase(),
      );
      if (duplicate) {
        toast.error("Record already exists!");
        return;
      }
    }

    try {
      if (Dist_id) {
        await apiClient.put("/api/Dist", formData);
      } else {
        await apiClient.post("/api/Dist", formData);
      }

      toast.success(Dist_id ? "Updated successfully" : "Saved successfully");
      await fetchDistricts();
      handleClear();
      setShowTable(true);
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };
  // Edit a district
  const handleEdit = (data) => {
    setFormData({
      Dist_id: data.Dist_id,
      State_id: data.State_id,
      Dist: data.Dist,
      Dist_RL: data.Dist_RL,
      User_name: username,
    });

    setEditIndex(data.Dist_id);
    setShowTable(false);
  };
  // Delete a district
  const handleDelete = async (data) => {
    try {
      const Dist_id = data.Dist_id;
      await deleteDistrict({ Dist_id, User_name: username });
      toast.success("Deleted successfully");
      fetchDistricts();
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
  };

  return (
    <div className="container my-1" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px", height: "auto" }}
      >
        <div
          className="text-white rounded mb-2 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">District Information</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            <div className="row mb-3 g-3">
              <div className="col-auto me-4">
                <label className="fw-small">State</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  name="State_id"
                  value={formData.State_id}
                  className="form-control form-control-sm"
                  style={{ width: "250px" }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      State_id: parseInt(e.target.value) || "",
                    })
                  }
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.State_id} value={s.State_id}>
                      {s.stateNameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <label className="fw-small" style={{ marginLeft: "25px" }}>
                  District
                </label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <input
                  type="text"
                  name="Dist"
                  value={formData.Dist}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "250px", marginLeft: " 25px" }}
                />
              </div>
            </div>

            <div className="row mb-3 g-3">
              <div className="col-auto">
                <label className="fw-small">District (Regional)</label>
                <input
                  type="text"
                  name="Dist_RL"
                  value={formData.Dist_RL}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                  style={{ width: "250px" }}
                  disabled={!formData.Dist}
                />
              </div>
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
        ) : 
        <CommonTable
          columns={columns}
          data={filteredDistricts}
          onEdit={(index) => handleEdit(filteredDistricts[index])}
          onDelete={(index) => handleDelete(filteredDistricts[index])}
          searchValue={searchText}
          onSearchChange={setSearchText}
          onClose={() => {
            setShowTable(false);
            handleClear();
          }}
        />}
      </div>
    </div>
  );
}

export default District;

