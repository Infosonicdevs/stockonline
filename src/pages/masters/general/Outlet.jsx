import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getOutlets,
  saveOutlet,
  updateOutlet,
  deleteOutlet,
} from "../../../services/masters/outlet";
import { getCities } from "../../../services/masters/region";

function OutletCenterForm() {
  const [formData, setFormData] = useState({
    outletId: 0,
    centerCode: "",
    centerName: "",
    address: "",
    stateId: 0, // IDs from API
    stateName: "", // Names from API
    districtId: 0,
    districtName: "",
    talukaId: 0,
    talukaName: "",
    cityId: 0,
    cityName: "",
    mobileNo: "",
    contactName: "",
    isMainBranch: 0,
  });

  const username = localStorage.getItem("username");
  const [searchName, setSearchName] = useState("");
  const [centers, setCenters] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [cities, setCities] = useState([]);
  const [allCities, setAllCities] = useState([]);

  const columns = [
  {
    label: "Sr. No",
    render: (val, row, index) => index + 1,
  },
  {
    label: "Center Code",
    render: (val, row) => row.centerCode,
  },
  {
    label: "Center Name",
    render: (val, row) => row.centerName,
  },
  {
    label: "Address",
    render: (val, row) => row.address,
  },
  {
    label: "State",
    render: (val, row) => row.stateName,
  },
  {
    label: "District",
    render: (val, row) => row.districtName,
  },
  {
    label: "Taluka",
    render: (val, row) => row.talukaName,
  },
  {
    label: "City",
    render: (val, row) => row.cityName,
  },
  {
    label: "Mobile",
    render: (val, row) => row.mobileNo,
  },
  {
    label: "Contact",
    render: (val, row) => row.contactName,
  },
  {
    label: "Main Branch",
    render: (val, row) =>
      row.isMainBranch === 1 ? "Main Branch" : "No",
  },
];

  // When state changes → update districts
  const handleStateChange = (e) => {
    const stateId = Number(e.target.value);

    // Districts filter from master list
    const filteredDistricts = Array.from(
      new Map(
        allCities
          .filter((c) => Number(c.State_id) === stateId && c.Dist_id)
          .map((c) => [c.Dist_id, c]),
      ).values(),
    ).map((d) => ({
      Dist_id: d.Dist_id,
      Dist: d.Dist,
    }));

    setDistricts(filteredDistricts);
    setTalukas([]); // reset talukas
    setFormData({
      ...formData,
      stateId,
      stateName: states.find((s) => s.State_id === stateId)?.State || "",
      districtId: 0,
      districtName: "",
      talukaId: 0,
      talukaName: "",
      cityId: 0,
      cityName: "",
    });
  };

  // When district changes → update talukas
  const handleDistrictChange = (e) => {
    const districtId = parseInt(e.target.value);

    const filteredTalukas = Array.from(
      new Map(
        allCities
          .filter((c) => Number(c.Dist_id) === districtId && c.Taluka_id)
          .map((c) => [c.Taluka_id, c]),
      ).values(),
    ).map((t) => ({
      Taluka_id: t.Taluka_id,
      Taluka: t.Taluka,
    }));

    setTalukas(filteredTalukas);
    setFormData({
      ...formData,
      districtId,
      districtName: districts.find((d) => d.Dist_id === districtId)?.Dist || "",
      talukaId: 0,
      talukaName: "",
      cityId: 0,
      cityName: "",
    });
  };

  // When taluka changes → update cities
  const handleTalukaChange = (e) => {
    const talukaId = parseInt(e.target.value);

    const filteredCities = allCities.filter((c) => c.Taluka_id === talukaId);

    setCities(filteredCities);
    setFormData({
      ...formData,
      talukaId,
      talukaName: talukas.find((t) => t.Taluka_id === talukaId)?.Taluka || "",
      cityId: 0,
      cityName: "",
    });
  };

  // When city changes
  const handleCityChange = (e) => {
    const cityId = parseInt(e.target.value);
    setFormData({
      ...formData,
      cityId,
      cityName: cities.find((c) => c.City_id === cityId)?.City || "",
    });
  };

  const fetchLocations = async () => {
    try {
      const res = await getCities();
      const data = res.data;

      // Unique States
      const uniqueStates = Array.from(new Set(data.map((d) => d.State_id))).map(
        (id) => {
          const s = data.find((d) => d.State_id === id);
          return { State_id: s.State_id, State: s.State };
        },
      );

      setStates(uniqueStates);
      setCities(data); // initial filtered list (all cities)
      setAllCities(data); // master list for filtering
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredCenters = centers.filter((c) =>
    c.centerName.toLowerCase().includes(searchName.toLowerCase()),
  );

  const fetchCenters = async () => {
    try {
      const res = await getOutlets();

      const mapped = res.data.map((c) => ({
        outletId: c.Outlet_id,
        centerCode: c.Outlet_code,
        centerName: c.Outlet_name,
        address: c.Outlet_add,

        stateId: c.State_id,
        stateName: c.State,

        districtId: c.Dist_id,
        districtName: c.Dist,

        talukaId: c.Taluka_id,
        talukaName: c.Taluka,

        cityId: c.City_id,
        cityName: c.City,

        mobileNo: c.Contact_no,
        contactName: c.Short_name,
        isMainBranch: c.Is_main_branch,
      }));

      setCenters(mapped);
    } catch (err) {
      toast.error(err.message);
    }
  };
  useEffect(() => {
    fetchCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  const handleClear = () => {
    setFormData({
      outletId: 0,
      centerCode: "",
      centerName: "",
      address: "",
      stateId: 0,
      stateName: "",
      districtId: 0,
      districtName: "",
      talukaId: 0,
      talukaName: "",
      cityId: 0,
      cityName: "",
      mobileNo: "",
      contactName: "",
      isMainBranch: 0,
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.centerCode.trim()) return toast.error("Enter Center Code");
    if (!formData.centerName.trim()) return toast.error("Enter Center Name");
    if (!formData.address.trim()) return toast.error("Enter Address");
    if (
      !formData.stateId ||
      !formData.districtId ||
      !formData.talukaId ||
      !formData.cityId
    )
      return toast.error("Select State, District, Taluka, and City");
    if (!formData.mobileNo) return toast.error("Enter Mobile No");
    if (formData.mobileNo.length !== 10)
      return toast.error("Mobile No must be 10 digits");
    if (!formData.contactName.trim()) return toast.error("Enter Contact Name");

    const payload = {
      Outlet_id: formData.outletId,
      Outlet_code: formData.centerCode,
      Outlet_name: formData.centerName,
      Outlet_add: formData.address,
      State_id: formData.stateId,
      District_id: formData.districtId,
      Taluka_id: formData.talukaId,
      City_id: formData.cityId,
      Contact_no: formData.mobileNo,
      Short_name: formData.contactName,
      Is_main_branch: formData.isMainBranch,
      ...(editIndex !== null
        ? { Modified_by: username }
        : { Created_by: username }),
    };

    try {
      if (editIndex !== null) {
        await updateOutlet(payload);
        toast.success("Updated successfully");
      } else {
        await saveOutlet(payload);
        toast.success("Saved successfully");
      }

      fetchCenters();
      handleClear();
      setShowTable(true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Something went wrong";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (data) => {
    setFormData({
      outletId: data.outletId,
      centerCode: data.centerCode,
      centerName: data.centerName,
      address: data.address,

      stateId: Number(data.stateId),
      districtId: Number(data.districtId),
      talukaId: Number(data.talukaId),
      cityId: Number(data.cityId),

      mobileNo: data.mobileNo,
      contactName: data.contactName,
      isMainBranch: data.isMainBranch,
    });

    setEditIndex(data.outletId);
    setShowTable(false);
  };

  useEffect(() => {
    if (!allCities.length || !formData.stateId) return;

    const filteredDistricts = Array.from(
      new Map(
        allCities
          .filter((c) => Number(c.State_id) === Number(formData.stateId))
          .map((c) => [c.Dist_id, c]),
      ).values(),
    ).map((d) => ({
      Dist_id: d.Dist_id,
      Dist: d.Dist,
    }));

    setDistricts(filteredDistricts);
  }, [formData.stateId, allCities]);

  useEffect(() => {
    if (!allCities.length || !formData.districtId) return;

    const filteredTalukas = allCities.filter(
      (c) => Number(c.Dist_id) === Number(formData.districtId),
    );

    setTalukas(
      Array.from(
        new Map(filteredTalukas.map((c) => [c.Taluka_id, c])).values(),
      ).map((t) => ({ Taluka_id: t.Taluka_id, Taluka: t.Taluka })),
    );
  }, [formData.districtId, allCities]);

  useEffect(() => {
    if (!allCities.length || !formData.talukaId) return;

    const filteredCities = allCities.filter(
      (c) => Number(c.Taluka_id) === Number(formData.talukaId),
    );

    setCities(filteredCities);
  }, [formData.talukaId, allCities]);

  const handleDelete = async (outletId) => {
    try {
      await deleteOutlet({
        Outlet_id: outletId,
        Modified_by: username,
      });

      toast.success("Deleted successfully");
      fetchCenters();
    } catch (err) {
      toast.error("Delete failed");
    }
  };
  return (
    <div className="container my-2">
      <div
        className="bg-white p-4 rounded shadow mx-auto"
           style={{
          maxWidth: showTable ? "100%" : "650px",
     }}
      >
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Outlet Center </h5>
        </div>

        {!showTable && (
          <form onSubmit={handleSubmit}>
            {/* Center Code & Center Name */}
            <div
              className="row g-3 mb-2 align-items-end"
              style={{ fontSize: "14px" }}
            >
              <div className="col-md-3">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Center Code
                </label>
                <input
                  type="text"
                  name="centerCode"
                  className="form-control form-control-sm"
                  value={formData.centerCode}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6" style={{ marginLeft: "50px" }}>
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Center Name
                </label>
                <input
                  type="text"
                  name="centerName"
                  className="form-control form-control-sm"
                  value={formData.centerName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address */}
            <div className="row g-3 mb-2" style={{ fontSize: "14px" }}>
              <div className="col-md-8">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-control form-control-sm"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* State / District / Taluka / City */}
            <div
              className="row g-2 mb-2"
              style={{ width: "850px", fontSize: "14px" }}
            >
              {/* State Dropdown */}
              <div className="col-md-2">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  State
                </label>
                <select
                  className="form-select form-select-sm"
                  value={Number(formData.stateId)}
                  onChange={handleStateChange}
                >
                  <option value={0}>Select State</option>
                  {states.map((s) => (
                    <option key={s.State_id} value={s.State_id}>
                      {s.State}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div className="col-md-2">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  District
                </label>
                <select
                  className="form-select form-select-sm"
                  value={formData.districtId || ""}
                  onChange={handleDistrictChange}
                >
                  <option value={0}>Select District</option>
                  {districts.map((d) => (
                    <option key={d.Dist_id} value={d.Dist_id}>
                      {d.Dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taluka Dropdown */}
              <div className="col-md-2">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Taluka
                </label>
                <select
                  className="form-select form-select-sm"
                  value={formData.talukaId || ""}
                  onChange={handleTalukaChange}
                >
                  <option value={0}>Select Taluka</option>
                  {talukas.map((t) => (
                    <option key={t.Taluka_id} value={t.Taluka_id}>
                      {t.Taluka}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div className="col-md-2">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  City
                </label>
                <select
                  className="form-select form-select-sm"
                  value={formData.cityId || ""}
                  onChange={handleCityChange}
                >
                  <option value={0}>Select City</option>
                  {cities.map((c) => (
                    <option key={c.City_id} value={c.City_id}>
                      {c.City}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile No & Contact Name */}
            <div className="row g-3 mb-3" style={{ fontSize: "14px" }}>
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Mobile No
                </label>
                <input
                  type="text"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");

                    if (value.length <= 10) {
                      setFormData({ ...formData, mobileNo: value });
                    }
                  }}
                  className="form-control form-control-sm"
                  maxLength={10}
                />
              </div>

              <div className="col-md-6" style={{ marginLeft: "50px" }}>
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Person Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  className="form-control form-control-sm"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-check mt-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isMainBranch"
                  name="isMainBranch"
                  checked={formData.isMainBranch === 1}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="isMainBranch">
                  Main Branch
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="text-center mt-3 d-flex justify-content-center gap-2">
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
                style={{ fontSize: "14px" }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                style={{ fontSize: "14px" }}
                onClick={() => setShowTable(true)}
              >
                Show List
              </button>
            </div>
          </form>
        )}

        {/* Table View */}
 {showTable && (
  <div style={{ paddingTop: "5px" }}>
    <CommonTable
      columns={columns}
      data={filteredCenters}
      onEdit={handleEdit}
      onDelete={(row) =>
        handleDelete(row.outletId)
      }
      searchValue={searchName}
      onSearchChange={setSearchName}
      onClose={() => {
        setShowTable(false);
        handleClear();
        setSearchName("");
      }}
    />
  </div>
)}
      </div>
    </div>
  );
}

export default OutletCenterForm;
