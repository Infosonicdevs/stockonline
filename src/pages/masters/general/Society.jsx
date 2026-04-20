import apiClient, { BASE_URL } from "../../../api/client";
import React, { useEffect, useRef, useState } from "react";
import {
  getCitiesByTalukaId,
  getDistrictsByStateId,
  getStates,
  getTalukasByDistrictId,
} from "../../../services/masters/region";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";
import {
  createSociety,
  getSociety,
  updateSociety,
} from "../../../services/masters/society";

const Society = () => {
  const [formData, setFormData] = useState({
    Sanstha_name: "",
    Reg_no: "",
    Reg_date: "",
    Address: "",
    State_id: "",
    Dist_id: "",
    Tal_id: "",
    City_id: "",
    Tag_line: "",
    Website: "",
    Is_logo: "",
    GST_no: "",
    Short_name: "",
    Logo: "",
  });
  const [preview, setPreview] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [cities, setCities] = useState([]);
  const [isSansthaExist, setIsSansthaExist] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statesRes, societyRes] = await Promise.all([
        getStates(),
        getSociety(),
      ]);

      if (statesRes.status === 200) setStates(statesRes.data);
      if (
        societyRes.status === 200 &&
        societyRes.data &&
        societyRes.data.length > 0
      ) {
        const s = societyRes.data[0];
        console.log(s);
        setFormData({
          Sanstha_name: s.Sanstha_name,
          Reg_no: s.Reg_no,
          Reg_date: s.Reg_date ? s.Reg_date.split("T")[0] : "",
          Address: s.Address,
          State_id: s.State_id,
          Dist_id: s.Dist_id,
          Tal_id: s.Tal_id,
          City_id: s.City_id,
          Tag_line: s.Tag_line,
          Website: s.Website,
          Is_logo: s.Is_logo === "1",
          GST_no: s.GST_no,
          Short_name: s.Short_name,
          Logo: s.Logo,
        });

        if (s.Logo) {
          setPreview(showLogoImage(s.Logo));
        }
        // 2. Populate dependent dropdowns
        if (s.State_id) {
          const districtsRes = await getDistrictsByStateId(s.State_id);
          if (districtsRes.status === 200) setDistricts(districtsRes.data);
        }

        if (s.Dist_id) {
          const talukasRes = await getTalukasByDistrictId(s.Dist_id);
          if (talukasRes.status === 200) setTalukas(talukasRes.data);
        }

        if (s.Tal_id) {
          const citiesRes = await getCitiesByTalukaId(s.Tal_id);
          if (citiesRes.status === 200) setCities(citiesRes.data);
        }
        setIsSansthaExist(true);
      }
    } catch (error) {
      toast.error("Failed to load states and society data");
    }
  };

  const showLogoImage = (image) => {
    const baseUrl = `${BASE_URL}/Content/Upload/Logo/`;

    if (image) {
      // Add a cache-buster query parameter
      return `${baseUrl}${image}?t=${new Date().getTime()}`;
    }

    return "";
  };

  const handleChange = async (e) => {
    const { name, type, checked, value } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // use checked for checkbox
    });

    if (name === "State_id") {
      // Reset child dropdowns
      setDistricts([]);
      setTalukas([]);
      setCities([]);
      setFormData({
        ...formData,
        State_id: value,
        Dist_id: "",
        Tal_id: "",
        City_id: "",
      });

      if (value) {
        const res = await getDistrictsByStateId(value); // fetch districts for this state
        if (res.status === 200) setDistricts(res.data);
      }
    }

    if (name === "Dist_id") {
      setTalukas([]);
      setCities([]);
      setFormData({ ...formData, Dist_id: value, Tal_id: "", City_id: "" });

      if (value) {
        const res = await getTalukasByDistrictId(value); // fetch talukas for this district
        if (res.status === 200) setTalukas(res.data);
      }
    }

    if (name === "Tal_id") {
      setCities([]);
      setFormData({ ...formData, Tal_id: value, City_id: "" });

      if (value) {
        const res = await getCitiesByTalukaId(value); // fetch cities for this taluka
        if (res.status === 200) setCities(res.data);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData({
        ...formData,
        Logo: file,
      });
      const previewUrl = URL.createObjectURL(file);
      setPreview((prev) => {
        // Revoke previous object URL if it exists
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, missingFields } = validateRequiredFields(formData, [
      "Sanstha_name",
      "Reg_no",
      "Reg_date",
      "Address",
      "State_id",
      "Dist_id",
      "Tal_id",
      "City_id",
    ]);

    if (!isValid) {
      return toast.warning("Please fill all required fields!");
    }
    // Create FormData
    const formDataToSend = new FormData();
    formDataToSend.append("Sanstha_name", formData.Sanstha_name);
    formDataToSend.append("Reg_no", formData.Reg_no);
    formDataToSend.append("Reg_date", formData.Reg_date);
    formDataToSend.append("Address", formData.Address);
    formDataToSend.append("State_id", formData.State_id);
    formDataToSend.append("Dist_id", formData.Dist_id);
    formDataToSend.append("Tal_id", formData.Tal_id);
    formDataToSend.append("City_id", formData.City_id);
    formDataToSend.append("Tag_line", formData.Tag_line);
    formDataToSend.append("Website", formData.Website);
    formDataToSend.append("Is_logo", formData.Is_logo ? "1" : "0");
    formDataToSend.append("GST_no", formData.GST_no);
    formDataToSend.append("Short_name", formData.Short_name);

    // If Logo is a File object (from handleImageChange)
    if (formData.Logo instanceof File) {
      formDataToSend.append("Photo", formData.Logo);
    } else {
      // If it exists but it's just a filename string, append it as well
      formDataToSend.append("Logo", formData.Logo);
    }
    if (isSansthaExist) {
      const result = await updateSociety(formDataToSend);
      if (result.status === 200) {
        console.log(result.data);
        toast.success("Society updated successfully");
        await fetchData();
      }
    } else {
      const result = await createSociety(formDataToSend);
      if (result.status === 200) {
        console.log(result.data);
        toast.success("Society created successfully");
        await fetchData();
      }
    }
  };

  const handleLoadSociety = async () => {
    await fetchData();
    toast.success("society load successfully");
  };

  return (
    <>
      <div className="bg-white">
        <div
          className="bg-white p-2 rounded mx-auto shadow"
          style={{ maxWidth: "1000px", width: "100%" }}
        >
          {/* Header */}
          <div
            className="text-white rounded mb-0 p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Society</h5>
          </div>

          <form>
            <div>
              {/* FORM + IMAGE ROW */}
              <div className="row">
                {/* LEFT SIDE FORM */}
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-10 mb-1 mt-2 ms-4">
                      <label
                        className="form-label form-label-sm"
                        style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                      >
                        Society Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="Sanstha_name"
                        value={formData.Sanstha_name}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-1 ms-4">
                      <label
                        className="form-label form-label-sm"
                        style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                      >
                        Register No. <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="Reg_no"
                        value={formData.Reg_no}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="col-md-3 mb-1 ms-4">
                      <label
                        className="form-label form-label-sm"
                        style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                      >
                        Registration Date{" "}
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="date"
                        name="Reg_date"
                        value={formData.Reg_date}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-1 ms-4">
                      <label
                        className="form-label form-label-sm"
                        style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                      >
                        GST No.
                      </label>
                      <input
                        type="text"
                        name="GST_no"
                        value={formData.GST_no}
                        onChange={handleChange}
                        className="form-control form-control-sm mt-0"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-10 mb-1 ms-4">
                      <label
                        className="form-label form-label-sm"
                        style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                      >
                        Address <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="Address"
                        value={formData.Address}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                </div>
                {/* RIGHT SIDE IMAGE */}
                <div className="col-md-3 d-flex flex-column align-items-center mt-2 border border-2 rounded p-3">
                  {preview && (
                    <img
                      src={preview}
                      alt="Logo"
                      className="img-fluid img-thumbnail mb-2"
                      style={{ maxHeight: "150px", objectFit: "contain" }}
                      onError={() => setPreview(null)}
                    />
                  )}

                  <div className="w-100">
                    <label
                      className="form-label fs-6"
                      style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                    >
                      Society Logo
                    </label>
                    <input
                      type="file"
                      name="Logo"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="form-check form-check-inline mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="Is_logo"
                      checked={formData.Is_logo}
                      onChange={handleChange}
                      id="isLogoCheckbox"
                    />
                    <label
                      className="form-check-label"
                      htmlFor="isLogoCheckbox"
                      style={{ fontSize: "13px" }}
                    >
                      Display logo on login/Home page
                    </label>
                  </div>
                </div>
              </div>

              {/* OTHER FIELDS */}
              <div className="row">
                <div className="col-md-2 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    State <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="State_id"
                    value={formData.State_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                  >
                    <option value="">--Select State--</option>
                    {states.map((state) => (
                      <option key={state.State_id} value={state.State_id}>
                        {state.State}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    District <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="Dist_id"
                    value={formData.Dist_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                  >
                    <option value="">--Select District--</option>
                    {districts.map((district) => (
                      <option key={district.Dist_id} value={district.Dist_id}>
                        {district.Dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Taluka <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="Tal_id"
                    value={formData.Tal_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                  >
                    <option value="">--Select Taluka--</option>
                    {talukas.map((taluka) => (
                      <option key={taluka.Taluka_id} value={taluka.Taluka_id}>
                        {taluka.Taluka}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    City <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    name="City_id"
                    value={formData.City_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                  >
                    <option value="">--Select City--</option>
                    {cities.map((city) => (
                      <option key={city.City_id} value={city.City_id}>
                        {city.City}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-3 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Short Name
                  </label>
                  <input
                    type="text"
                    name="Short_name"
                    value={formData.Short_name}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-md-3 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Tagling
                  </label>
                  <input
                    type="text"
                    name="Tag_line"
                    value={formData.Tag_line}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-md-3 mb-1 ms-4">
                  <label
                    className="form-label form-label-sm"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Website
                  </label>
                  <input
                    type="text"
                    name="Website"
                    value={formData.Website}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="mt-2 d-flex justify-content-center gap-2">
                <button
                  type="submit"
                  className="button-save"
                  onClick={handleSubmit}
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  {isSansthaExist ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="button-clear"
                  onClick={handleLoadSociety}
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Society;
