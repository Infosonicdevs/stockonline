import React, { useState, useEffect } from "react";
import apiClient from "../../../api/client";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getPatrakTypes,
  getCrDR,
  getLedgerGroups,
  getLedgerSubGroups,
  getLedgerTypes,
  getCustomerTypes,
  getMaxLedgerNo,
  getLedgerSubGroupsByLedgerGroupId,
  getLedgerGroupsByPatrakAndCrDr,
} from "../../../services/masters/ledger";
import { toast } from "react-toastify";
import { validateRequiredFields } from "../../../utils/validator";

function LedgerForm() {
  const [formData, setFormData] = useState({
    Ledger_id: 0,
    Ledger_no: 0,
    Ledger_name: "",
    Ledger_name_RL: "",
    Ledger_group_id: 0,
    Ledger_subgroup_id: 0,
    Ledger_type: 0,
    Is_personal: 0,
    Cust_type_id: 0,
    documentType: 0,
    crDr: 0,
    Accountable: 0,
  });

  const [searchTerm, setSearchTerm] = useState(""); // single search box
  const [ledgers, setLedgers] = useState([]);
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const [ledgerSubGroups, setLedgerSubGroups] = useState([]);
  const [patrakTypes, setPatrakTypes] = useState([]);
  const [crDrs, setCrDrs] = useState([]);
  const [ledgerTypes, setLedgerTypes] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [editData, setEditData] = useState(null);
  const username = localStorage.getItem("username");

  const columns = [
    {
      label: "Sr.No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Ledger No",
      accessor: "Ledger_no",
    },
    {
      label: "Ledger Name",
      accessor: "Ledger_name",
    },
    {
      label: "Ledger Name RL",
      accessor: "Ledger_name_RL",
    },
    {
      label: "Ledger Group",
      accessor: "L_group_name",
    },
    {
      label: "Ledger Subgroup",
      accessor: "Ledger_subgroup_name",
    },
    {
      label: "Ledger Type",
      accessor: "Ledger_type_name",
    },
    {
      label: "Personal",
      render: (val, row) => (row.Is_personal === 1 ? "Yes" : "No"),
    },
    {
      label: "Customer Type",
      accessor: "Cust_type_name",
    },
    {
      label: "Accountable",
      render: (val, row) => (row.Accountable === 1 ? "Yes" : "No"),
    },
  ];

  const filteredLedgers = ledgers.filter((l) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    return (
      l.Ledger_no.toString().includes(term) ||
      l.Ledger_name.toLowerCase().includes(term) ||
      (l.Ledger_name_RL?.toLowerCase() || "").includes(term) ||
      (l.L_group_name?.toLowerCase() || "").includes(term) ||
      (l.Ledger_subgroup_name?.toLowerCase() || "").includes(term) ||
      (l.Ledger_type_name?.toLowerCase() || "").includes(term) ||
      (l.Cust_type_name?.toLowerCase() || "").includes(term) ||
      (l.Is_personal === 1 ? "yes" : "no").includes(term) ||
      (l.Accountable === 1 ? "yes" : "no").includes(term)
    );
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          patrakResult,
          crDrResult,
          ledgerGroupResult,
          ledgerSubGroupResult,
          ledgerTypesResult,
          customerTypesResult,
          maxLedgerNoResult,
        ] = await Promise.all([
          getPatrakTypes(),
          getCrDR(),
          getLedgerGroups(),
          getLedgerSubGroups(),
          getLedgerTypes(),
          getCustomerTypes(),
          getMaxLedgerNo(),
        ]);

        if (patrakResult.status === 200) setPatrakTypes(patrakResult.data);

        if (crDrResult.status === 200) setCrDrs(crDrResult.data);

        if (ledgerGroupResult.status === 200)
          setLedgerGroups(ledgerGroupResult.data);

        if (ledgerSubGroupResult.status === 200)
          setLedgerSubGroups(ledgerSubGroupResult.data);

        if (ledgerTypesResult.status === 200)
          setLedgerTypes(ledgerTypesResult.data);

        if (customerTypesResult.status === 200)
          setCustomerTypes(customerTypesResult.data);

        if (maxLedgerNoResult.status === 200) {
          const maxLedgerNo = maxLedgerNoResult.data;
          setFormData((prev) => ({
            ...prev,
            Ledger_no: Number(maxLedgerNo) + 1,
          }));
        }
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
    if (formData.Ledger_group_id > 0) {
      fetchLedgerSubGroups(formData.Ledger_group_id);
    }
  }, [formData.Ledger_group_id]);

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
        Ledger_id: editData.Ledger_id,
        Ledger_no: editData.Ledger_no,
        Ledger_name: editData.Ledger_name,
        Ledger_name_RL: editData.Ledger_name_RL,
        Ledger_group_id: editData.Ledger_group_id,
        Ledger_subgroup_id: editData.Ledger_subgroup_id,
        Ledger_type: editData.Ledger_type,
        Is_personal: editData.Is_personal,
        Cust_type_id: editData.Cust_type_id,
        documentType: editData.documentType,
        crDr: editData.crDr,
        Accountable: editData.Accountable,
      });

      setEditIndex(editData.Ledger_id);
      setEditData(null); // clear temp
    }
  }, [ledgerGroups, editData]);

  /* ================= LOAD TABLE DATA ================= */
  const loadLedgers = async () => {
    try {
      debugger;
      const res = await apiClient.get(`/api/Ledger`);

      // Handle .NET $values structure safely
      const data = res.data?.$values || res.data;
      console.log(data);

      setLedgers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load ledger sub group data");
    }
  };

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,

      // Reset customer type if unchecked
      ...(name === "Is_personal" && !checked ? { Cust_type_id: "" } : {}),
    }));
  };

  const fetchLedgerGroups = async (patrakId, crDrId) => {
    try {
      const response = await getLedgerGroupsByPatrakAndCrDr(patrakId, crDrId);
      if (response.status === 200) {
        setLedgerGroups(response.data);
      }
    } catch (error) {
      console.error("Error fetching ledger groups:", error);
    }
  };

  const fetchLedgerSubGroups = async (L_group_id) => {
    try {
      const ledgerGroupId = Number.parseInt(L_group_id);
      const response = await getLedgerSubGroupsByLedgerGroupId(ledgerGroupId);

      if (response.status === 200) {
        setLedgerSubGroups(response.data); // Update ledger sub group dropdown
        setFormData((prev) => ({
          ...prev,
        }));
      }
    } catch (error) {
      console.error("Error fetching ledger sub groups:", error);
    }
  };

  const fetchNextLedgerNo = async () => {
    try {
      const result = await getMaxLedgerNo();

      if (result.status === 200) {
        const maxLedgerNo = result.data;

        return Number(maxLedgerNo) + 1;
      }
    } catch (error) {
      toast.error("Error fetching Ledger No");
    }

    return 1; // fallback
  };

  /* ================= CLEAR FORM ================= */
  const handleClear = async () => {
    const nextLedgerNo = await fetchNextLedgerNo();
    setFormData({
      Ledger_id: 0,
      Ledger_no: nextLedgerNo,
      Ledger_name: "",
      Ledger_name_RL: "",
      Ledger_group_id: 0,
      Ledger_subgroup_id: 0,
      Ledger_type: 0,
      Is_personal: 0,
      Cust_type_id: 0,
      documentType: 0,
      crDr: 0,
      Accountable: 0,
    });
    setEditIndex(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();

    // Basic required fields
    const requiredFields = [
      "Ledger_name",
      "Ledger_group_id",
      "Ledger_subgroup_id",
      "Ledger_type",
    ];

    // Add Cust_type_id if Is_personal is true
    if (formData.Is_personal) {
      requiredFields.push("Cust_type_id");
    }

    const { isValid, missingFields } = validateRequiredFields(
      formData,
      requiredFields,
    );

    if (!isValid) {
      return toast.warning("Please fill all required fields!");
    }

    try {
      debugger;
      const bodyData = {
        Ledger_id: formData.Ledger_id,
        Ledger_no: formData.Ledger_no,
        Ledger_name: formData.Ledger_name,
        Ledger_name_RL: formData.Ledger_name_RL,
        Ledger_group_id: Number(formData.Ledger_group_id),
        Ledger_subgroup_id: Number(formData.Ledger_subgroup_id),
        Ledger_type: Number(formData.Ledger_type),
        Is_personal: formData.Is_personal,
        Cust_type_id: Number(formData.Cust_type_id),
        Accountable: formData.Accountable,
        User_name: username,
      };

      const url = `/api/Ledger`;

      if (editIndex !== null) {
        const request = {
          Ledger_id: bodyData.Ledger_id,
          Ledger_no: bodyData.Ledger_no,
          Ledger_name: bodyData.Ledger_name,
          Ledger_name_RL: bodyData.Ledger_name_RL,
          Ledger_group_id: bodyData.Ledger_group_id,
          Ledger_subgroup_id: bodyData.Ledger_subgroup_id,
          Ledger_type: bodyData.Ledger_type,
          Is_personal: bodyData.Is_personal,
          Cust_type_id: bodyData.Cust_type_id,
          Accountable: bodyData.Accountable,
          Modified_by: bodyData.User_name,
          Status: 1,
        };
        await apiClient.put(url, request);
        toast.success("Ledger updated successfully");
      } else {
        const request = {
          Ledger_no: bodyData.Ledger_no,
          Ledger_name: bodyData.Ledger_name,
          Ledger_name_RL: bodyData.Ledger_name_RL,
          Ledger_group_id: bodyData.Ledger_group_id,
          Ledger_subgroup_id: bodyData.Ledger_subgroup_id,
          Ledger_type: bodyData.Ledger_type,
          Is_personal: bodyData.Is_personal,
          Cust_type_id: bodyData.Cust_type_id,
          Accountable: bodyData.Accountable,
          Created_by: bodyData.User_name,
          Status: 1,
        };
        await apiClient.post(url, request);
        toast.success("Ledger added successfully");
      }

      handleClear();
      loadLedgers();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data || "Error occurred while saving ledger data",
      );
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (data) => {
    debugger;
    setFormData({
      Ledger_id: data.Ledger_id,
      Ledger_no: data.Ledger_no,
      Ledger_name: data.Ledger_name,
      Ledger_name_RL: data.Ledger_name_RL,
      documentType: data.documentType,
      crDr: data.crDr,
      Ledger_group_id: data.Ledger_group_id,
      Ledger_subgroup_id: data.Ledger_subgroup_id,
      Ledger_type: data.Ledger_type,
      Is_personal: data.Is_personal,
      Cust_type_id: data.Cust_type_id,
      Accountable: data.Accountable,
    });
    setEditIndex(data.Ledger_id);
    setEditData(data);
    setShowTable(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (data) => {
    debugger;

    try {
      await apiClient.post(`/api/DelLedger`, {
        Ledger_id: data.Ledger_id,
        Ledger_no: data.Ledger_no,
        Ledger_name: data.Ledger_name,
        Ledger_name_RL: data.Ledger_name_RL,
        documentType: data.documentType,
        crDr: data.crDr,
        Ledger_group_id: data.Ledger_group_id,
        Ledger_subgroup_id: data.Ledger_subgroup_id,
        Ledger_type: data.Ledger_type,
        Is_personal: data.Is_personal,
        Cust_type_id: data.Cust_type_id,
        Accountable: data.Accountable,
        Modified_by: username,
        Status: 1,
      });

      // remove from UI
      setLedgers((prev) =>
        prev.filter((item) => item.Ledger_id !== data.Ledger_id),
      );

      toast.success("Ledger deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error occurred while deleting ledger");
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
            <h5 className="mb-0 fw-semibold">Ledger</h5>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Row 1: Ledger No */}
            <div className="row ms-2 me-2 mt-2">
              <div className="col-md-2">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger No <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="Ledger_no"
                  className="form-control form-control-sm"
                  value={formData.Ledger_no}
                  onChange={handleChange}
                  readOnly
                />
              </div>
              <div className="col-md-5">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="Ledger_name"
                  className="form-control form-control-sm"
                  value={formData.Ledger_name}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-5">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Name RL
                </label>
                <input
                  type="text"
                  name="Ledger_name_RL"
                  className="form-control form-control-sm"
                  value={formData.Ledger_name_RL}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 2: Patrak + CR/DR + Ledger Type */}
            <div className="row g-3 mt-1 ms-2">
              <div className="col-md-4">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Patrak
                </label>
                <select
                  name="documentType"
                  className="form-select form-select-sm"
                  value={formData.documentType}
                  onChange={handleChange}
                >
                  {patrakTypes.map((p) => (
                    <option key={p.Patrak_id} value={p.Patrak_id}>
                      {p.Patrak}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  CR/DR
                </label>
                <select
                  name="crDr"
                  className="form-select form-select-sm"
                  value={formData.crDr}
                  onChange={handleChange}
                >
                  {crDrs.map((c) => (
                    <option key={c.CrDr_id} value={c.CrDr_id}>
                      {c.CrDr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Type <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="Ledger_type"
                  className="form-select form-select-sm"
                  value={formData.Ledger_type}
                  onChange={handleChange}
                >
                  <option value="">Select Ledger Type</option>
                  {ledgerTypes.map((t) => (
                    <option key={t.Ledger_type_id} value={t.Ledger_type_id}>
                      {t.Ledger_type_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Ledger Group + Ledger Subgroup */}
            <div className="row g-3 mt-1 ms-2 me-2">
              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Group <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="Ledger_group_id"
                  className="form-select form-select-sm"
                  value={formData.Ledger_group_id}
                  onChange={handleChange}
                >
                  <option value="">Select Ledger Group</option>
                  {ledgerGroups.map((l) => (
                    <option key={l.L_group_id} value={l.L_group_id}>
                      {l.L_group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                >
                  Ledger Subgroup <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="Ledger_subgroup_id"
                  className="form-select form-select-sm"
                  value={formData.Ledger_subgroup_id}
                  onChange={handleChange}
                >
                  <option value="">Select Ledger Subgroup</option>
                  {ledgerSubGroups.map((l) => (
                    <option
                      key={l.Ledger_subgroup_id}
                      value={l.Ledger_subgroup_id}
                    >
                      {l.Ledger_subgroup_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Personal + Accountable + Customer Type */}
            <div className="row g-3 mt-1 ms-2">
              <div className="col-md-5 d-flex">
                <input
                  type="checkbox"
                  name="Is_personal"
                  className="form-check-input me-2"
                  checked={formData.Is_personal === 1}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label"
                  style={{ fontSize: "15px", marginBottom: "0.25rem" }}
                >
                  Personal
                </label>
              </div>
              <div className="col-md-5 d-flex">
                <input
                  type="checkbox"
                  name="Accountable"
                  className="form-check-input me-2"
                  checked={formData.Accountable === 1}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label"
                  style={{ fontSize: "15px", marginBottom: "0.25rem" }}
                >
                  Accountable
                </label>
              </div>
            </div>
            <div className="row g-3 mt-1 ms-2">
              {formData.Is_personal === 1 && (
                <div className="col-md-5">
                  <label
                    className="form-label"
                    style={{ fontSize: "14px", marginBottom: "0.25rem" }}
                  >
                    Customer Type
                  </label>
                  <select
                    name="Cust_type_id"
                    className="form-select form-select-sm"
                    value={formData.Cust_type_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Customer Type</option>
                    {customerTypes.map((c) => (
                      <option key={c.cust_type_id} value={c.cust_type_id}>
                        {c.Cust_type_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-3 d-flex justify-content-center gap-2 ms-2">
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
                  loadLedgers();
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

        showTable && (
       <div
  className="bg-white rounded shadow mx-auto"
  style={{ maxWidth: "1000px", padding: "10px" }}
>
  <div
    className="text-white rounded p-2 text-center"
    style={{ backgroundColor: "#365b80" }}
  >
    <h5 className="mb-0 fw-semibold text-center">Ledger List</h5>
  </div>

  <div className="mt-2">
    <CommonTable
      columns={columns}
      data={filteredLedgers}
      onEdit={(index) => handleEdit(filteredLedgers[index])}
      onDelete={(index) => handleDelete(filteredLedgers[index])}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onClose={() => {
        setShowTable(false);
        handleClear();
        setSearchTerm("");
      }}
    />
  </div>
</div>
        )
      )}
    </div>
  );
}

export default LedgerForm;

