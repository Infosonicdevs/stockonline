import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getBankAccounts,
  saveBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../../../services/masters/bankAccount";
import { getLedgers } from "../../../services/masters/ledgerSetting";

function BankAccountForm() {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNo: "",
    accountType: "",
    branch: "",
    ifsc: "",
    customerNo: "",
    ledger: "",
    openingAmount: "",
  });

  const [dataList, setDataList] = useState([]);
  const [ledgerList, setLedgerList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [searchName, setSearchName] = useState("");

  const columns = [
    {
      label: "Sr.No",
      render: (val, row, index) => index + 1,
    },
    {
      label: "Bank Name",
      accessor: "bankName",
    },
    {
      label: "Account No",
      accessor: "accountNo",
    },
    {
      label: "Account Type",
      accessor: "accountType",
    },
    {
      label: "Branch",
      accessor: "branch",
    },
    {
      label: "IFSC",
      accessor: "ifsc",
    },
    {
      label: "Customer No",
      accessor: "customerNo",
    },
    {
      label: "Opening Amt",
      accessor: "openingAmount",
    },
    {
      label: "Ledger",
      accessor: "ledgerName",
    },
  ];

  useEffect(() => {
    fetchBankAccounts();
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const response = await getLedgers();
      const data = response.data?.$values || response.data;
      setLedgerList(data);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      toast.error("Failed to load ledgers");
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await getBankAccounts();
      if (response.data) {
        const transformedData = response.data.map((item) => ({
          bankName: item.Bank_name,
          accountNo: item.Bank_acc_no,
          accountType: item.Bank_type_name,
          branch: item.Branch,
          ifsc: item.IFSC_code,
          customerNo: item.Customer_no,
          ledger: item.L_id, // Store ID for select
          ledgerName: item.Ledger_name || "", // Store Name for table
          openingAmount: item.Opn_Amt || "",
          Bank_id: item.Bank_id,
        }));
        setDataList(transformedData);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to load bank accounts");
    }
  };

  const filteredList = dataList.filter((item) =>
    item.bankName.toLowerCase().includes(searchName.toLowerCase()),
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClear = () => {
    setFormData({
      bankName: "",
      accountNo: "",
      accountType: "",
      branch: "",
      ifsc: "",
      customerNo: "",
      ledger: "",
      openingAmount: "",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // REQUIRED VALIDATION
    if (!formData.bankName) return toast.error("Enter Bank Name");
    if (!formData.accountNo) return toast.error("Enter Account No");
    if (!formData.accountType) return toast.error("Enter Account Type");
    if (!formData.branch) return toast.error("Enter Branch");
    if (!formData.ifsc) return toast.error("Enter IFSC Code");
    if (!formData.ledger) return toast.error("Select Ledger");

    try {
      const bodyData = {
        Bank_name: formData.bankName,
        Bank_acc_no: formData.accountNo,
        Branch: formData.branch,
        IFSC_code: formData.ifsc,
        L_id: parseInt(formData.ledger),
        Bank_type: formData.accountType === "Current" ? 0 : 1, // Based on sample 0=Current
        Customer_no: formData.customerNo ? parseInt(formData.customerNo) : 0,
        Opn_Amt: parseFloat(formData.openingAmount) || 0,
        User: localStorage.getItem("username") || "TRT",
      };

      let response;
      if (editIndex !== null) {
        bodyData.Bank_id = dataList[editIndex].Bank_id;
        response = await updateBankAccount(bodyData);
      } else {
        response = await saveBankAccount(bodyData);
      }

      if (response.status === 200 || response.status === 201) {
        toast.success(
          editIndex !== null ? "Updated successfully" : "Saved successfully",
        );
        handleClear();
        fetchBankAccounts(); // Refresh list
        setShowTable(true);
      }
    } catch (error) {
      console.error("Error saving/updating bank account:", error);
      toast.error(error.response?.data || "Failed to process bank account");
    }
  };

  const handleEdit = (index) => {
    setFormData(dataList[index]);
    setEditIndex(index);
    setShowTable(false);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this bank account?"))
      return;

    try {
      const bodyData = {
        Bank_id: dataList[index].Bank_id,
        User: localStorage.getItem("username") || "TRT",
      };
      const response = await deleteBankAccount(bodyData);
      if (response.status === 200 || response.status === 201) {
        toast.success("Deleted successfully");
        fetchBankAccounts(); // Refresh list
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast.error(error.response?.data || "Failed to delete bank account");
    }
  };

  return (
    <div className="container my-2" style={{ fontSize: "14px" }}>
      <div
        className="bg-white p-4 rounded shadow mx-auto"
        style={{
          maxWidth: showTable ? "100%" : "600px",
    
        }}
      >
        {/* HEADER */}
        <div
          className="text-white rounded mb-3 p-2 text-center"
          style={{ backgroundColor: "#365b80" }}
        >
          <h5 className="mb-0 fw-semibold">Bank Account</h5>
        </div>

        {!showTable && (
          <form onSubmit={handleSubmit}>
            {/* Row 1 → ONLY Bank Name */}
            <div className="row g-3 mb-2">
              <div className="col-md-12">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Bank Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  className="form-control form-control-sm"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 2 → Account No + Account Type */}
            <div className="row g-3 mb-2">
              <div className="col-md-7">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Account No <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="accountNo"
                  className="form-control form-control-sm"
                  value={formData.accountNo}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Account Type <span style={{ color: "red" }}>*</span>
                </label>

                <select
                  name="accountType"
                  className="form-control form-control-sm"
                  value={formData.accountType}
                  onChange={handleChange}
                >
                  <option value=""> Select Account Type </option>
                  <option value="Saving">Saving</option>
                  <option value="Current">Current</option>
                </select>
              </div>
            </div>

            {/* Row 3 → Branch + IFSC */}
            <div className="row g-3 mb-2">
              <div className="col-md-7">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Branch <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="branch"
                  className="form-control form-control-sm"
                  value={formData.branch}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  IFSC Code <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="ifsc"
                  className="form-control form-control-sm"
                  value={formData.ifsc}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 4 → Customer No + Ledger + Ledger Type (same line) */}
            <div className="row g-3 mb-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Customer No
                </label>
                <input
                  type="text"
                  name="customerNo"
                  className="form-control form-control-sm"
                  value={formData.customerNo}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Opening Amount
                </label>
                <input
                  type="number"
                  name="openingAmount"
                  className="form-control form-control-sm"
                  value={formData.openingAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" style={{ marginBottom: "2px" }}>
                  Ledger <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="ledger"
                  className="form-select form-select-sm"
                  value={formData.ledger}
                  onChange={handleChange}
                >
                  <option value="">Select Ledger</option>
                  {ledgerList.map((l) => (
                    <option key={l.Ledger_id} value={l.Ledger_id}>
                      {l.Ledger_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* BUTTONS (same) */}
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

        {/* TABLE  */}
        {showTable && (
            <CommonTable
              columns={columns}
              data={filteredList}
              onEdit={(index) => handleEdit(index)}
              onDelete={(index) => handleDelete(index)}
              searchValue={searchName}
              onSearchChange={setSearchName}
              onClose={() => {
                setShowTable(false);
                handleClear();
                setSearchName("");
              }}
            />
        )}
      </div>
    </div>
  );
}

export default BankAccountForm;
