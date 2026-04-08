import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import { toast } from "react-toastify";
import CommonTable from "../../../components/navigation/CommonTable";

function City() {
  const [formData, setFormData] = useState({
    stateId: "",
    stateNameEn: "",
    districtId: "",
    districtNameEn: "",
    talukaId: "",
    talukaNameEn: "",
    cityNameEn: "",
    cityNameMr: "",
  });
  const username = localStorage.getItem("username");
  const [searchText, setSearchText] = useState("");
  const [citiesData, setCitiesData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [allTalukas, setAllTalukas] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);

  const columns = [
    {
      label: "Sr. No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Taluka",
      render: (val, row) => getTalukaName(row.Taluka_id),
    },
    { label: "City", accessor: "City" },
  ];


  // searchbar

  useEffect(() => {
    // Initial fetch
    fetchStates();
    fetchAllDistricts();
    fetchAllTalukas();
    fetchCities();
  }, []);

  const fetchStates = async () => {
    const res = await apiClient.get("/api/State");
    const data = res.data.data || res.data || [];
    setStates(data);
  };

  const fetchAllDistricts = async () => {
    const res = await apiClient.get("/api/Dist");
    const data = res.data.data || res.data || [];
    setDistricts(data);
  };

  const fetchAllTalukas = async () => {
    const res = await apiClient.get("/api/Taluka");
    const data = res.data.data || res.data || [];
    setAllTalukas(data);
  };

  const fetchCities = async () => {
    const res = await apiClient.get("/api/City");
    const data = res.data.data || res.data || [];
    setCitiesData(data);
  };

  const getStateName = (stateId) => {
    const state = states.find((s) => Number(s.State_id) === Number(stateId));
    return state ? state.State : "";
  };

  const getDistrictName = (distId) => {
    const dist = districts.find((d) => Number(d.Dist_id) === Number(distId));
    return dist ? dist.Dist : "";
  };

  const getTalukaName = (talukaId) => {
    const t = allTalukas.find((t) => Number(t.Taluka_id) === Number(talukaId));
    return t ? t.Taluka : "";
  };
  const filteredCities = citiesData.filter((c) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;

    return (
      (getTalukaName(c.Taluka_id).toLowerCase() || "").includes(term) ||
      (c.City?.toLowerCase() || "").includes(term) ||
      (c.City_RL?.toLowerCase() || "").includes(term)
    );
  });

  const handleClear = () => {
    setFormData({
      stateId: "",
      stateNameEn: "",
      districtId: "",
      districtNameEn: "",
      talukaId: "",
      talukaNameEn: "",
      cityNameEn: "",
      cityNameMr: "",
    });
    setEditIndex(null);
  };

  // Save / Update City
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { stateId, districtId, talukaId, cityNameEn, cityNameMr } = formData;

    if (!stateId || !districtId || !talukaId || !cityNameEn.trim()) {
      return toast.warning("Please fill all fields!");
    }

    const payload = {
      State_id: Number(stateId),
      Dist_id: Number(districtId),
      Taluka_id: Number(talukaId),
      City: cityNameEn.trim(),
      City_RL: cityNameMr.trim(),
      User_name: username,
    };

    try {
      if (editIndex !== null) {
        payload.City_id = editIndex;
        await apiClient.put("/api/City", payload);
        toast.success("Updated Successfully!");
      } else {
        await apiClient.post("/api/City", payload);
        toast.success("Saved Successfully!");
      }

      // ⭐ IMPORTANT FIX
      await fetchAllTalukas(); // Taluka names refresh
      await fetchCities(); // City table refresh

      handleClear();
    } catch (err) {
      console.error("Error submitting city:", err.response || err);
      toast.error(err.response?.data || "Error saving data");
    }
  };

  const handleDelete = async (data) => {
    try {
      const cityId = data.City_id;
      if (!cityId) return toast.warning("Cannot delete: City ID missing");

      await apiClient.post("/api/DelCity", { City_id: cityId, User_name: username });
      toast.success("Deleted Successfully!");
      fetchCities();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting data");
    }
  };
  // Edit city
  const handleEdit = async (data) => {
    setEditIndex(data.City_id);

    //  Set stateId first
    setFormData((prev) => ({
      ...prev,
      stateId: data.State_id || "",
      stateNameEn: getStateName(data.State_id),
    }));

    //  Fetch districts for this state
    let updatedDistricts = [];
    if (data.State_id) {
      const distRes = await apiClient.get(`/api/GetDist?State_id=${data.State_id}`);
      updatedDistricts = distRes.data.data || distRes.data || [];
      setDistricts(updatedDistricts);
    }

    // Fetch talukas for this district
    let updatedTalukas = [];
    if (data.Dist_id) {
      const talRes = await apiClient.get(`/api/GetTaluka?Dist_id=${data.Dist_id}`);
      updatedTalukas = talRes.data.data || talRes.data || [];
      setTalukas(updatedTalukas);
    }

    //  Now set formData AFTER districts and talukas are ready
    setFormData({
      stateId: data.State_id || "",
      stateNameEn: getStateName(data.State_id),
      districtId: data.Dist_id || "",
      districtNameEn:
        updatedDistricts.find((d) => Number(d.Dist_id) === Number(data.Dist_id))
          ?.Dist || "",
      talukaId: data.Taluka_id || "",
      talukaNameEn:
        updatedTalukas.find((t) => Number(t.Taluka_id) === Number(data.Taluka_id))
          ?.Taluka || "",
      cityNameEn: data.City || "",
      cityNameMr: data.City_RL || "",
    });

    setShowTable(false);
  };
  return (
    <div className="container my-1" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{ maxWidth: "700px" }}
      >
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-bold">City Information</h5>
        </div>

        {!showTable ? (
          <form onSubmit={handleSubmit}>
            {/* State / District / Taluka */}
            <div className="row g-3 mb-3">
              <div className="col">
                <label className="fw-small">State</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  value={formData.stateId}
                  onChange={async (e) => {
                    const stateId = e.target.value;
                    const stateObj = states.find(
                      (s) => Number(s.State_id) === Number(stateId),
                    );
                    setFormData({
                      ...formData,
                      stateId,
                      stateNameEn: stateObj?.State || "",
                      districtId: "",
                      districtNameEn: "",
                      talukaId: "",
                      talukaNameEn: "",
                    });
                    const res = await apiClient.get(`/api/GetDist?State_id=${stateId}`);
                    const dData = res.data.data || res.data || [];
                    setDistricts(dData);
                    setTalukas([]);
                  }}
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.State_id} value={s.State_id}>
                      {s.State}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <label className="fw-small">District</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  value={formData.districtId}
                  onChange={async (e) => {
                    const distId = e.target.value;
                    const distObj = districts.find(
                      (d) => Number(d.Dist_id) === Number(distId),
                    );
                    setFormData({
                      ...formData,
                      districtId: distId,
                      districtNameEn: distObj?.Dist || "",
                      talukaId: "",
                      talukaNameEn: "",
                    });
                    const res = await apiClient.get(`/api/GetTaluka?Dist_id=${distId}`);
                    const tData = res.data.data || res.data || [];
                    setTalukas(tData);
                  }}
                  disabled={!formData.stateId}
                  className="form-control form-control-sm"
                  style={{ width: "180px" }}
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.Dist_id} value={d.Dist_id}>
                      {d.Dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <label className="fw-small">Taluka</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <select
                  value={formData.talukaId}
                  onChange={(e) => {
                    const talukaObj = talukas.find(
                      (t) => Number(t.Taluka_id) === Number(e.target.value),
                    );
                    setFormData({
                      ...formData,
                      talukaId: e.target.value,
                      talukaNameEn: talukaObj?.Taluka || "",
                    });
                  }}
                  disabled={!formData.districtId}
                  style={{ width: "180px" }}
                  className="form-control form-control-sm"
                >
                  <option value="">Select Taluka</option>
                  {talukas.map((t) => (
                    <option key={t.Taluka_id} value={t.Taluka_id}>
                      {t.Taluka}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* City / City Regional */}
            <div className="row g-3 mb-3">
              <div className="col ">
                <label className="fw-small">City</label>
                <span style={{ color: "red", marginLeft: "2px" }}>*</span>
                <input
                  type="text"
                  name="cityNameEn"
                  value={formData.cityNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, cityNameEn: e.target.value })
                  }
                  className="form-control form-control-sm"
                  disabled={!formData.talukaId}
                  style={{ width: "180px" }}
                />
              </div>
              <div className="col">
                <label className="fw-small">City (Regional):</label>
                <input
                  type="text"
                  name="cityNameMr"
                  value={formData.cityNameMr}
                  onChange={(e) =>
                    setFormData({ ...formData, cityNameMr: e.target.value })
                  }
                  className="form-control form-control-sm"
                  disabled={!formData.cityNameEn}
                  style={{ width: "180px", marginRight: " 250px" }}
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
        ) :
          <div style={{ paddingTop: "5px" }}>
            <CommonTable
              columns={columns}
              data={filteredCities}
              onEdit={(index) => handleEdit(filteredCities[index])}
              onDelete={(index) => handleDelete(filteredCities[index])}
              searchValue={searchText}
              onSearchChange={setSearchText}
              onClose={() => {
                setShowTable(false);
                handleClear();
              }}
            />
          </div>
        }
      </div>
    </div>
  );
}

export default City;

