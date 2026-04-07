import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import {
  getPatrakTypes,
  getCrDR,
  getLedgerGroups,
  getLedgerGroupsByPatrakAndCrDr,
} from "../../../services/masters/ledgerSubGroup";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";

function SubLedgerGroup() {
  const [formData, setFormData] = useState({
    Ledger_subgroup_id: 0,
    SubLedgerGroupNameEn: "",
    SubLedgerGroupNameMr: "",
    documentType: 0,
    ledgerGroup: 0,
    crDr: 0,
    srNo: 0,
    code: "",
  });

  const [searchName, setSearchName] = useState("");
  const [ledgerSubGroups, setLedgerSubGroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [patrakTypes, setPatrakTypes] = useState([]);
  const [crDrs, setCrDrs] = useState([]);
  const [editData, setEditData] = useState(null);
  const username = localStorage.getItem("username");
  

  // Filtered list for search

  const filteredLedgerSubGroups = ledgerSubGroups.filter((l) => {
    const term = searchName.trim().toLowerCase();
    if (!term) return true;

    return (
      l.Ledger_subgroup_name.toLowerCase().includes(term) || // Name
      (l.Ledger_subgroup_name_RL?.toLowerCase() || "").includes(term) || // Name RL
      (l.L_group_name?.toLowerCase() || "").includes(term) || // Ledger Group
      l.Seqno.toString().includes(term) || // Seq (number)
      (l.Code?.toLowerCase() || "").includes(term) // Code
    );
  });
  /* ================= FETCH DROPDOWN DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patrakResult, crDrResult, ledgerGroupResult] = await Promise.all(
          [getPatrakTypes(), getCrDR(), getLedgerGroups()],
        );

        if (patrakResult.status === 200) setPatrakTypes(patrakResult.data);

        if (crDrResult.status === 200) setCrDrs(crDrResult.data);

        if (ledgerGroupResult.status === 200)
          setLedgers(ledgerGroupResult.data);
      } catch (error) {
        toast.error("Error occurred while fetching dropdown data");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.documentType > 0 && formData.crDr > 0) {
      fetchLedgerGroups(formData.documentType, formData.crDr);
    }
  }, [formData.documentType, formData.crDr]);

  useEffect(() => {
    if (patrakTypes.length > 0 && crDrs.length > 0) {
      setFormData((prev) => ({
        ...prev,
        documentType: patrakTypes[0].Patrak_id,
        crDr: crDrs[0].CrDr_id,
      }));
    }
  }, [patrakTypes, crDrs]);

  useEffect(() => {
    if (editData && ledgers.length) {
      setFormData({
        Ledger_subgroup_id: editData.Ledger_subgroup_id,
        SubLedgerGroupNameEn: editData.Ledger_subgroup_name,
        SubLedgerGroupNameMr: editData.Ledger_subgroup_name_RL,
        ledgerGroup: editData.Ledger_group_id, // string for select
        documentType: editData.Patrak_id,
        crDr: editData.crdr_id,
        srNo: editData.Seqno,
        code: editData.Code,
      });

      setEditIndex(editData.Ledger_subgroup_id);
      setEditData(null); // clear temp
    }
  }, [ledgers, editData]);

  /* ================= LOAD TABLE DATA ================= */
  const loadLedgerSubGroups = async () => {
    try {
      debugger;
      const res = await apiClient.get(`/api/LedgerSubGroup`);

      // Handle .NET $values structure safely
      const data = res.data?.$values || res.data;
      console.log(data);

      setLedgerSubGroups(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load ledger sub group data");
    }
  };

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const fetchLedgerGroups = async (patrakId, crDrId) => {
    try {
      const response = await getLedgerGroupsByPatrakAndCrDr(patrakId, crDrId);
      if (response.status === 200) {
        setLedgers(response.data);
      }
    } catch (error) {
      console.error("Error fetching ledger groups:", error);
    }
  };

  /* ================= CLEAR FORM ================= */
  const handleClear = () => {
    setFormData({
      Ledger_subgroup_id: 0,
      SubLedgerGroupNameEn: "",
      SubLedgerGroupNameMr: "",
      documentType: 0,
      ledgerGroup: 0,
      crDr: 0,
      srNo: 0,
      code: "",
    });
    setEditIndex(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();

    const { isValid, missingFields } = validateRequiredFields(formData, [
      "SubLedgerGroupNameEn",
      "ledgerGroup",
      "code",
    ]);

    if (!isValid) {
      return toast.warning("Please fill all fields!");
    }

    try {
      debugger;
      const bodyData = {
        Ledger_subgroup_id: formData.Ledger_subgroup_id,
        SubLedgerGroupNameEn: formData.SubLedgerGroupNameEn,
        SubLedgerGroupNameMr: formData.SubLedgerGroupNameMr,
        ledgerGroup: formData.ledgerGroup,
        Seqno: Number(formData.srNo),
        Code: formData.code,
        User_name: username,
      };

      const url = `/api/LedgerSubGroup`;

      if (editIndex !== null) {
        const request = {
          Ledger_subgroup_id: bodyData.Ledger_subgroup_id,
          Ledger_subgroup_name: bodyData.SubLedgerGroupNameEn,
          Ledger_subgroup_name_RL: bodyData.SubLedgerGroupNameMr,
          Ledger_group_id: bodyData.ledgerGroup,
          Seqno: bodyData.Seqno,
          Code: bodyData.Code,
          User_name: bodyData.User_name,
        };
        await apiClient.put(url, request);
        toast.success("Ledger sub group updated successfully");
      } else {
        const request = {
          Ledger_subgroup_name: bodyData.SubLedgerGroupNameEn,
          Ledger_subgroup_name_RL: bodyData.SubLedgerGroupNameMr,
          Ledger_group_id: bodyData.ledgerGroup,
          Seqno: bodyData.Seqno,
          Code: bodyData.Code,
          User_name: bodyData.User_name,
        };
        await apiClient.post(url, request);
        toast.success("Ledger sub group added successfully");
      }

      handleClear();
      loadLedgerSubGroups();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data ||
          "Error occurred while saving ledger sub group data",
      );
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (data) => {
    debugger;
    console.log(ledgers);
    setFormData({
      Ledger_subgroup_id: data.Ledger_subgroup_id,
      SubLedgerGroupNameEn: data.Ledger_subgroup_name,
      SubLedgerGroupNameMr: data.Ledger_subgroup_name_RL,
      ledgerGroup: data.Ledger_group_id,
      documentType: data.Patrak_id,
      crDr: data.crdr_id,
      srNo: data.Seqno,
      code: data.Code,
    });

    setEditIndex(data.Ledger_subgroup_id);
    setEditData(data);
    setShowTable(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (data) => {
    debugger;

    try {
      await apiClient.post(`/api/DelLedgerSubGroup`, {
        Ledger_subgroup_id: data.Ledger_subgroup_id,
        SubLedgerGroupNameEn: data.Ledger_subgroup_name,
        SubLedgerGroupNameMr: data.Ledger_subgroup_name_RL,
        ledgerGroup: data.Ledger_group_id,
        Patrak_id: data.Patrak_id,
        crdr_id: data.crdr_id,
        Seqno: Number(data.L_group_seqno),
        Code: data.Code,
        User_name: username,
      });

      // remove from UI
      setLedgerSubGroups((prev) =>
        prev.filter(
          (item) => item.Ledger_subgroup_id !== data.Ledger_subgroup_id,
        ),
      );

      toast.success("Ledger sub group deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error occurred while deleting ledger sub group");
    }
  };

  return (
    <div className="bg-white">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded mx-auto shadow"
          style={{ maxWidth: "700px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Ledger Sub Group</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 ms-2 me-2 mt-2">
              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Sub Group Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="SubLedgerGroupNameEn"
                  value={formData.SubLedgerGroupNameEn}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Sub Group Name RL
                </label>
                <input
                  type="text"
                  name="SubLedgerGroupNameMr"
                  value={formData.SubLedgerGroupNameMr}
                  onChange={handleChange}
                  className="form-control form-control-sm"
                />
              </div>
            </div>
            <div className="row g-3 ms-2 me-2 mt-2">
              <div className="col-md-2">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  CR/DR
                </label>
                <select
                  name="crDr"
                  value={formData.crDr}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  {crDrs.map((c) => (
                    <option key={c.CrDr_id} value={c.CrDr_id}>
                      {c.CrDr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-5">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Group <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="ledgerGroup"
                  value={formData.ledgerGroup}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  <option value="">Select Ledger Group</option>
                  {ledgers.map((l) => (
                    <option key={l.L_group_id} value={l.L_group_id}>
                      {l.L_group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-5">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Patrak Type
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="form-select form-select-sm"
                >
                  {patrakTypes.map((p) => (
                    <option key={p.Patrak_id} value={p.Patrak_id}>
                      {p.Patrak}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-2">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Index No
                  </label>
                  <input
                    type="number"
                    name="srNo"
                    value={formData.srNo}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-md-2">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Code <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>
            </div>

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
                onClick={handleClear}
                className="button-clear"
                style={{ fontSize: "14px" }}
              >
                Clear
              </button>
              <button
                type="button"
                className="button-list"
                onClick={() => {
                  loadLedgerSubGroups();
                  setShowTable(true);
                }}
                style={{ fontSize: "14px" }}
              >
                Show List
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div
          className="bg-white p-3 rounded mx-auto shadow"
          style={{ maxWidth: "1000px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0 fw-semibold">Ledger Sub Group</h5>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setShowTable(false);
                handleClear();
              }}
            >
              Close
            </button>

            {/* Search Box */}
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-search"></i>
              <label className="fw-semibold text-secondary small mb-0">
                Search
              </label>
              <input
                type="text"
                className="form-control "
                style={{ width: "300px", height: "25px", marginRight: "480px" }}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
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
                  <th className="table-column-bg-heading">Sr. No.</th>
                  <th className="table-column-bg-heading">Name</th>
                  <th className="table-column-bg-heading">Name RL</th>
                  <th className="table-column-bg-heading">Ledger Group</th>
                  <th className="table-column-bg-heading">Seq</th>
                  <th className="table-column-bg-heading">Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgerSubGroups.length === 0 ? (
                  <tr>
                    <td colSpan="7">No Records</td>
                  </tr>
                ) : (
                  filteredLedgerSubGroups.map((l, i) => (
                    <tr key={l.Ledger_subgroup_id}>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-1"
                          onClick={() => handleEdit(l)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(l)}
                        >
                          Delete
                        </button>
                      </td>
                      <td>{i + 1}</td>
                      <td className="text-start">{l.Ledger_subgroup_name}</td>
                      <td className="text-start">
                        {l.Ledger_subgroup_name_RL}
                      </td>
                      <td className="text-start">{l.L_group_name}</td>
                      <td>{l.Seqno}</td>
                      <td>{l.Code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default SubLedgerGroup;

