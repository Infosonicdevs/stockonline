import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import { toast } from "react-toastify";

function Taluka() {
  const [formData, setFormData] = useState({
    stateId: "",
    stateNameEn: "",
    districtId: "",
    districtNameEn: "",
    talukaNameEn: "",
    talukaNameMr: "",
  });
  const username = localStorage.getItem("username");
  const [searchText, setSearchText] = useState("");
  const [talukasData, setTalukasData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [allDistricts, setAllDistricts] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [districtsForState, setDistrictsForState] = useState([]);

  // search filter
  const filteredTalukas = talukasData.filter((t) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;

    return (
      (t.State?.toLowerCase() || "").includes(term) || // State Name
      (t.Dist?.toLowerCase() || "").includes(term) || // District Name
      (t.Taluka?.toLowerCase() || "").includes(term) || // Taluka Name
      (t.Taluka_RL?.toLowerCase() || "").includes(term) // Taluka Marathi
    );
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.stateId) fetchDistricts(formData.stateId);
    else setDistrictsForState([]);
  }, [formData.stateId]);

  const fetchStates = async () => {
    try {
      const res = await apiClient.get("/api/State");
      const data = res.data.data || res.data;
      setStateList(data);
    } catch (err) {
      toast.error("Error fetching states:");
    }
  };

  const loadInitialData = async () => {
    try {
      const stateRes = await apiClient.get("/api/State");
      const states = stateRes.data.data || stateRes.data || [];
      setStateList(states);

      let districts = [];
      for (let s of states) {
        const distRes = await apiClient.get(`/api/GetDist?State_id=${s.State_id}`);
        const dData = distRes.data.data || distRes.data || [];
        districts = [...districts, ...dData];
      }

      setAllDistricts(districts);

      const talukaRes = await apiClient.get("/api/Taluka");
      const talukas = talukaRes.data.data || talukaRes.data || [];

      //  MAIN FIX – enrich old data
      const enriched = talukas.map((t) => {
        const district = districts.find((d) => d.Dist_id === t.Dist_id);
        const state = states.find((s) => s.State_id === district?.State_id);

        return {
          ...t,
          State_id: state?.State_id || "",
          State: state?.State || "",
          Dist: district?.Dist || "",
        };
      });

      setTalukasData(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
    }
  };

  const fetchDistricts = async (stateId) => {
    try {
      const res = await apiClient.get(`/api/GetDist?State_id=${stateId}`);
      const data = res.data.data || res.data;
      setDistrictsForState(data);
    } catch {
      setDistrictsForState([]);
    }
  };

  const fetchTalukas = async () => {
    try {
      const res = await apiClient.get("/api/Taluka");
      const data = res.data.data || res.data;
      setTalukasData(data);
    } catch {
      toast.error("Failed to fetch Talukas!");
    }
  };

  const handleClear = () => {
    setFormData({
      stateId: "",
      stateNameEn: "",
      districtId: "",
      districtNameEn: "",
      talukaNameEn: "",
      talukaNameMr: "",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { districtId, talukaNameEn, talukaNameMr, stateId } = formData;

    if (!stateId || !districtId || !talukaNameEn) {
      return toast.warning("Please fill all fields!");
    }

    const payload = {
      Dist_id: districtId,
      Taluka: talukaNameEn,
      Taluka_RL: talukaNameMr,
      User_name: username,
    };

    try {
      // UPDATE
      if (editIndex !== null) {
        payload.Taluka_id = editIndex; // editIndex is now ID

        await apiClient.put("/api/Taluka", payload);

        toast.success("Updated Successfully!");

        await loadInitialData(); // table refresh without page refresh
      }
      // SAVE
      else {
        await apiClient.post("/api/Taluka", payload);

        toast.success("Saved Successfully!");

        await loadInitialData(); // main fix
      }

      handleClear();
    } catch (err) {
      toast.error(err.response?.data || "Error saving data");
    }
  };
  const handleEdit = async (data) => {
    setEditIndex(data.Taluka_id);

    // Set State first
    setFormData({
      stateId: data.State_id,
      stateNameEn: data.State,
      districtId: data.Dist_id,
      districtNameEn: data.Dist,
      talukaNameEn: data.Taluka,
      talukaNameMr: data.Taluka_RL,
    });

    // Load districts for state
    const res = await apiClient.get(`/api/GetDist?State_id=${data.State_id}`);
    const dData = res.data.data || res.data;
    setDistrictsForState(dData);

    // Then set district
    setFormData((prev) => ({
      ...prev,
      districtId: data.Dist_id,
      districtNameEn: data.Dist,
    }));

    setShowTable(false);
  };

  const handleDelete = async (data) => {
    try {
      const payload = {
        Taluka_id: data.Taluka_id,
        User_name: username,
      };

      const res = await apiClient.post("/api/DelTaluka", payload);

      if (res.data === "Record can not be deleted" || res.data.data === "Record can not be deleted") {
        toast.error("Taluka is used somewhere, cannot delete!");
        return;
      }
      const updated = talukasData.filter((t) => t.Taluka_id !== data.Taluka_id);
      setTalukasData(updated);

      toast.success("Deleted Successfully!");
    } catch (err) {
      toast.error(err.response?.data || "Error deleting record");
    }
  };

  return (
    <div className="container my-1">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px" }}
      >
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-bold">Taluka Information</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3" style={{ fontSize: "14px" }}>
              <div className="col me-4">
                <label>State</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  name="stateId"
                  value={Number(formData.stateId) || ""}
                  onChange={(e) => {
                    const stateId = parseInt(e.target.value, 10);
                    const state = stateList.find((s) => s.State_id === stateId);

                    setFormData((prev) => ({
                      ...prev,
                      stateId: stateId,
                      stateNameEn: state?.State || "",
                      districtId: "",
                      districtNameEn: "",
                      talukaNameEn: "",
                    }));

                    if (stateId) fetchDistricts(stateId);
                    else setDistrictsForState([]);
                  }}
                  disabled={stateList.length === 0}
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">Select State</option>
                  {stateList.map((s) => (
                    <option key={s.State_id} value={s.State_id}>
                      {s.State}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <label>District</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  name="districtId"
                  value={Number(formData.districtId) || ""}
                  onChange={(e) => {
                    const distId = parseInt(e.target.value, 10);
                    const district = districtsForState.find(
                      (d) => d.Dist_id === distId,
                    );

                    setFormData((prev) => ({
                      ...prev,
                      districtId: distId,
                      districtNameEn: district?.Dist || "",
                      talukaNameEn: "",
                    }));
                  }}
                  disabled={!formData.stateId || districtsForState.length === 0}
                  className="form-control form-control-sm"
                  style={{ width: "180px", marginRight: " 40px" }}
                >
                  <option value="">Select District</option>
                  {districtsForState.map((d) => (
                    <option key={d.Dist_id} value={d.Dist_id}>
                      {d.Dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <label>Taluka</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <input
                  type="text"
                  name="talukaNameEn"
                  value={formData.talukaNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, talukaNameEn: e.target.value })
                  }
                  className="form-control form-control-sm"
                  disabled={!formData.districtId}
                  style={{ width: "180px" }}
                />
              </div>
            </div>

            <div className="row g-3 mb-3" style={{ fontSize: "14px" }}>
              <div className="col">
                <label>Taluka (Regional)</label>
                <input
                  type="text"
                  name="talukaNameMr"
                  value={formData.talukaNameMr}
                  onChange={(e) =>
                    setFormData({ ...formData, talukaNameMr: e.target.value })
                  }
                  className="form-control form-control-sm"
                  disabled={!formData.talukaNameEn}
                  style={{ width: "180px" }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 d-flex justify-content-center gap-2">
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
        ) : (
          <div className="mt-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowTable(false);
                  handleClear();
                }}
              >
                Close
              </button>

              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-search"></i>
                <label className="fw-semibold text-secondary small mb-0">
                  Search{" "}
                </label>
                <input
                  type="text"
                  className="form-control "
                  style={{
                    width: "250px",
                    height: "25px",
                    marginRight: "210px",
                  }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div
              className="table-responsive mt-2"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                overflowX: "auto",
              }}
            >
              <table
                className="table table-bordered text-center table-sm table-striped"
                style={{
                  whiteSpace: "nowrap",
                  width: "max-content",
                  minWidth: "100%",
                }}
              >
                <thead
                  className="table-light"
                  style={{
                    fontSize: "13px",
                    fontWeight: "semibold",
                  }}
                >
                  <tr>
                    <th className="table-column-bg-heading">Actions</th>
                    <th className="table-column-bg-heading">State</th>
                    <th className="table-column-bg-heading">District</th>
                    <th className="table-column-bg-heading">Taluka</th>
                    <th className="table-column-bg-heading">
                      Taluka (Marathi)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTalukas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredTalukas.map((d, i) => (
                      <tr key={i}>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-1"
                            onClick={() => handleEdit(d)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(d)}
                          >
                            Delete
                          </button>
                        </td>
                        <td>{d.State}</td>
                        <td>{d.Dist}</td>
                        <td>{d.Taluka}</td>
                        <td>{d.Taluka_RL}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Taluka;
