import React, { useState, useEffect } from "react";
import apiClient from "../../api/client";
import {
  deleteVoucher,
  getTransByTransId,
  TransDetailsByTransId,
} from "../../services/transactions/voucher";
import { toast } from "react-toastify";

function VoucherForm() {
  const [voucherType, setVoucherType] = useState("journal");
  const [ledger, setLedger] = useState("");
  const [dropdown1, setDropdown1] = useState("");
  const [dropdown2, setDropdown2] = useState("A");
  const [amount, setAmount] = useState("00.00");
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [ledgerList, setLedgerList] = useState([]);
  const [customerNo, setCustomerNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [isCustomerEnabled, setIsCustomerEnabled] = useState(false);
  const [transList, setTransList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  const loginDate = localStorage.getItem("loginDate");
  const year_id = localStorage.getItem("Year_Id");
  const outlet_id = localStorage.getItem("Outlet_id");
  const username = localStorage.getItem("username");
  const API_URL = import.meta.env.VITE_APIURL;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr.includes("-")) {
      return dateStr;
    }

    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }

    return dateStr;
  };

  const handleShowList = async () => {
    try {
      debugger;
      const rawDate = localStorage.getItem("loginDate");

      if (!rawDate) {
        alert("Login date not found");
        return;
      }

      const res = await apiClient.get(
        `${API_URL}/api/VoucherTrans?Login_Date=${rawDate}`,
      );

      const filteredData = res.data.filter(
        (item) =>
          item.Trans_type_id === 5 ||
          item.Trans_type_id === 6 ||
          item.Trans_type_id === 7,
      );

      console.log("Filtered Data:", filteredData);

      setTransList(filteredData);
      setShowTable(true);
    } catch (err) {
      console.log(err);
    }
  };

  // total jama/naave
  const totalJama = tableData.reduce(
    (sum, row) => sum + (Number(row.jama) || 0),
    0,
  );
  const totalNaave = tableData.reduce(
    (sum, row) => sum + (Number(row.naave) || 0),
    0,
  );

  const finalJama = voucherType === "payment" ? 0 : totalJama;
  const finalNaave = voucherType === "journal" ? 0 : totalNaave;

  const handleAmountFocus = () => {
    if (amount === "00.00") {
      setAmount("");
    }
  };

  const handleAmountBlur = () => {
    if (!amount) {
      setAmount("00.00");
    }
  };

  useEffect(() => {
    apiClient
      .get(`/api/Customer`)
      .then((res) => {
        console.log(res.data); // check exact field names
        setCustomerList(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    apiClient
      .get(`/api/Ledger`)
      .then((res) => {
        setLedgerList(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  const handleCustomerNoChange = (e) => {
    setCustomerNo(e.target.value);
    const selectedCustomer = customerList.find(
      (c) => c.Cust_no.toString() === e.target.value.toString(),
    );
    if (selectedCustomer) {
      setCustomer(selectedCustomer.Cust_id);
      setCustomerName(selectedCustomer.Cust_name);
    } else {
      setCustomer("");
      setCustomerName("");
    }
  };

  const handleCustomerChange = (e) => {
    setCustomer(e.target.value);
    const selectedCustomer = customerList.find(
      (c) => c.Cust_id.toString() === e.target.value.toString(),
    );
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.Cust_name);
      setCustomerNo(selectedCustomer.Cust_no);
    } else {
      setCustomerName("");
      setCustomerNo("");
    }
  };

  const handleLedgerNoChange = async (value) => {
    setDropdown1(value);

    const selectedLedger = ledgerList.find(
      (l) => l.Ledger_no.toString() === value.toString(),
    );

    if (selectedLedger) {
      setLedger(selectedLedger.Ledger_id);

      // Check if ledger is personal via API
      try {
        const res = await apiClient.get(
          `${API_URL}/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
        );
        if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
          setIsCustomerEnabled(true); // enable customer selection
        } else {
          setIsCustomerEnabled(false); // disable customer selection
          setCustomerNo("");
          setCustomer("");
          setCustomerName("");
        }
      } catch (err) {
        console.log(err);
        setIsCustomerEnabled(false);
      }
    } else {
      setLedger("");
      setIsCustomerEnabled(false);
      setCustomerNo("");
      setCustomer("");
      setCustomerName("");
    }
  };

  const handleLedgerNameChange = async (value) => {
    const ledger_id = Number.parseInt(value);
    setLedger(ledger_id);

    const selectedLedger = ledgerList.find((l) => l.Ledger_id === ledger_id);

    if (selectedLedger) {
      setDropdown1(selectedLedger.Ledger_no);

      // Check personal ledger via API
      try {
        const res = await apiClient.get(
          `${API_URL}/api/CheckPersonalLedger?L_id=${selectedLedger.Ledger_id}`,
        );
        if (res.data && res.data.length > 0 && res.data[0].Is_personal === 1) {
          setIsCustomerEnabled(true);
        } else {
          setIsCustomerEnabled(false);
          setCustomerNo("");
          setCustomer("");
          setCustomerName("");
        }
      } catch (err) {
        console.log(err);
        setIsCustomerEnabled(false);
      }
    } else {
      setDropdown1("");
      setIsCustomerEnabled(false);
      setCustomerNo("");
      setCustomer("");
      setCustomerName("");
    }
  };

  const handleAdd = () => {
    debugger;
    console.log(ledger);
    if (!ledger || !amount) return;

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    let jamaValue = 0;
    let naaveValue = 0;

    if (voucherType === "journal") jamaValue = amountNum;
    else if (voucherType === "payment") naaveValue = amountNum;
    else if (voucherType === "contra") {
      if (dropdown2 === "A") jamaValue = amountNum;
      else if (dropdown2 === "B") naaveValue = amountNum;
    }

    const newRow = {
      voucherType: voucherType,
      ledgerNo:
        dropdown1 ||
        ledgerList.find((l) => l.Ledger_id === ledger)?.Ledger_no ||
        "", // fallback
      ledger_id: ledger,
      ledgerName:
        ledgerList.find((l) => l.Ledger_id === ledger)?.Ledger_name || "",
      customer_id: customer,
      customerName: customerName,
      jama: jamaValue,
      naave: naaveValue,
      crdr: dropdown2,
    };

    setTableData((prev) => [...prev, newRow]);

    // Clear inputs
    setLedger("");
    setDropdown1("");
    setDropdown2("A");
    setCustomerNo("");
    setCustomer("");
    setCustomerName("");
    setAmount("00.00");
  };
  const handleClear = () => {
    setTableData([]);
    setLedger("");
    setDropdown1("");
    setDropdown2("A");
    setCustomerNo("");
    setCustomer("");
    setCustomerName("");
    setAmount("00.00");
    setEditIndex(null);
    setVoucherType("journal");
  };

  const handleSave = async () => {
    try {
      debugger;
      // login details from localStorage
      let transTypeId = 0;

      if (voucherType === "journal") transTypeId = 5;
      else if (voucherType === "contra") transTypeId = 6;
      else if (voucherType === "payment") transTypeId = 7;

      if (tableData.length == 0) {
        toast.error("Trans details are required");
        return;
      }

      if (editIndex != null) {
        // Trans object
        const transPayload = {
          Trans: {
            Trans_id: editIndex,
            Outlet_id: outlet_id, // outlet id
            Trans_date: loginDate,
            Year_id: year_id ? parseInt(year_id) : 0,
            Trans_amt: tableData.reduce(
              (sum, row) => sum + Number(row.jama || row.naave),
              0,
            ),
            Trans_type_id: transTypeId, // voucher type mapping
            Trans_code: "0",
            Modified_by: username,
          },
          Trans_Details: tableData.map((row) => {
            const isJama = row.jama && Number(row.jama) > 0;
            const amount = isJama ? row.jama : row.naave;

            return {
              CashTrans: voucherType === "contra" ? "T" : "C",

              L_id: row.ledger_id,
              Amount: Number(amount),
              CrDr_id: isJama ? 1 : 2,
              Cust_id: Number(row.customer_id),
              Narr: "",
              Cust_name: row.customerName || "",
            };
          }),
        };
        // PUT to backend
        await apiClient.put(`${API_URL}/api/Voucher`, transPayload);
        toast.success("Voucher updated successfully");
        handleClear();
        handleShowList();
        setShowTable(true);
        setEditIndex(null);
      } else {
        // Trans object
        const transPayload = {
          Trans: {
            Outlet_id: outlet_id, // outlet id
            Trans_date: loginDate,
            Year_id: year_id ? parseInt(year_id) : 0,
            Trans_amt: tableData.reduce(
              (sum, row) => sum + Number(row.jama || row.naave),
              0,
            ),
            Trans_type_id: transTypeId, // voucher type mapping
            Trans_code: "0",
            Created_by: username,
          },
          Trans_Details: tableData.map((row) => {
            const isJama = row.jama && Number(row.jama) > 0;
            const amount = isJama ? row.jama : row.naave;

            return {
              CashTrans: voucherType === "contra" ? "T" : "C",

              L_id: row.ledger_id,
              Amount: Number(amount),
              CrDr_id: isJama ? 1 : 2,
              Cust_id: Number(row.customer_id),
              Narr: "",
              Cust_name: row.customerName || "",
            };
          }),
        };

        // POST to backend
        await apiClient.post(`${API_URL}/api/Voucher`, transPayload);
        toast.success("Voucher created successfully");
        handleClear();
        handleShowList();
        setShowTable(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occured while saving voucher");
    }
  };

  const handleEdit = async (Trans_id) => {
    try {
      debugger;
      setEditIndex(Trans_id);
      const result = await TransDetailsByTransId(Trans_id);

      if (result.status === 200) {
        const trans_details = result.data;

        const updatedRows = trans_details.map((element) => ({
          voucherType: element.TYPE_NAME,
          ledgerNo: element.Ledger_no,
          ledger_id: element.L_id,
          ledgerName: element.Ledger_name,
          customer_id: element.Cust_id,
          customerName: element.Cust_name,
          jama: element.CrDr_id === 1 ? element.Amount : "",
          naave: element.CrDr_id === 2 ? element.Amount : "",
          crdr: element.CrDr_id,
        }));

        // Replace existing data instead of appending
        setTableData(updatedRows);
        setShowTable(false);
        // ✅ Safe access
        if (trans_details[0]?.Trans_type_id === 5) {
          setVoucherType("journal");
        } else if (trans_details[0]?.Trans_type_id === 6) {
          setVoucherType("contra");
        } else if (trans_details[0]?.Trans_type_id === 7) {
          setVoucherType("payment");
        } else {
          setVoucherType("journal");
        }
      }
    } catch (error) {
      toast.error("Error occured while getting trans details");
    }
  };

  const handleDelete = async (trans) => {
    debugger;
    try {
      const delete_payload = {
        Trans_id: trans.Trans_id,
        Outlet_id: trans.Outlet_id,
        Trans_date: trans.Trans_date,
        Year_id: trans.Year_id,
        Trans_amt: trans.Trans_amt,
        Trans_type_id: trans.Trans_type_id,
        Modified_by: username,
      };
      const result = await deleteVoucher(delete_payload);
      if (result.status === 200) {
        toast.success("Voucher deleted successfully");
        handleShowList();
      }
    } catch (error) {
      toast.error("Error occured while deleting voucher");
    }
  };

  const handleRemoveRow = (index) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  const filteredTransList = transList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.Trans_no?.toString().toLowerCase().includes(term) ||
      item.Trans_amt?.toString().toLowerCase().includes(term) ||
      item.Type_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mt-0">
      {!showTable ? (
        <div
          className="bg-white p-4 rounded shadow mx-auto"
          style={{ maxWidth: "800px" }}
        >
          {/* Header */}
          <div
            className="text-white rounded p-2 text-center"
            style={{ backgroundColor: "#365b80" }}
          >
            <h5 className="mb-0">Voucher</h5>
          </div>

          {/* Radio Buttons */}
          <div className="mt-2 d-flex gap-3 justify-content-center">
            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="journal"
                checked={voucherType === "journal"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Journal Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>जमा चलन</div>
            </label>

            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="contra"
                checked={voucherType === "contra"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Contra Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>
                ट्रान्सफर चलन
              </div>
            </label>

            <label className="text-center">
              <input
                type="radio"
                name="voucherType"
                value="payment"
                checked={voucherType === "payment"}
                onChange={(e) => setVoucherType(e.target.value)}
                disabled={tableData.length > 0}
                style={{
                  cursor: tableData.length > 0 ? "not-allowed" : "pointer",
                }}
              />
              Pay Voucher
              <div style={{ fontSize: "13px", color: "#555" }}>नावे चलन</div>
            </label>
          </div>

          {/* Ledger + Dropdowns */}
          <div className="row mt-2 align-items-end">
            <div className="col-md-2">
              <label
                className="form-label"
                style={{ fontSize: "14px", marginBottom: "2PX" }}
              >
                Ledger No
              </label>
              <input
                type="number"
                className="form-control "
                value={dropdown1}
                style={{ height: "29px", fontSize: "14px" }}
                onChange={(e) => handleLedgerNoChange(e.target.value)}
              />
            </div>

            <div className="col-md-5">
              <select
                className="form-select form-select-sm"
                value={ledger}
                style={{ height: "29px", fontSize: "13px" }}
                onChange={(e) => handleLedgerNameChange(e.target.value)}
              >
                <option value="">Select Ledger Name</option>
                {ledgerList.map((item) => (
                  <option key={item.Ledger_id} value={item.Ledger_id}>
                    {item.Ledger_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                style={{ height: "29px", fontSize: "13px" }}
                value={dropdown2}
                onChange={(e) => setDropdown2(e.target.value)}
                disabled={voucherType !== "contra"}
              >
                <option value="">Select </option>
                <option value="A">Credit</option>
                <option value="B">Debit</option>
              </select>
            </div>
          </div>

          {/* Customer textbox */}
          <div className="row mt-2">
            <div className="col-md-2">
              <label
                className="form-label"
                style={{ fontSize: "14px", marginBottom: "2PX" }}
              >
                Customer No
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ height: "29px", fontSize: "13px" }}
                value={customerNo}
                onChange={handleCustomerNoChange}
                disabled={!isCustomerEnabled}
              />
            </div>

            <div className="col-md-5">
              <label
                className="form-label"
                style={{ fontSize: "14px" }}
              ></label>
              <select
                className="form-select form-select-sm"
                style={{ height: "29px", fontSize: "13px" }}
                value={customer}
                onChange={handleCustomerChange}
                disabled={!isCustomerEnabled}
              >
                <option value="">Select Customer</option>
                {customerList.map((c) => (
                  <option key={c.Cust_id} value={c.Cust_id}>
                    {c.Cust_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount + Add */}
          <div className="row mt-2 align-items-end">
            <div className="col-md-4">
              <label
                className="form-label"
                style={{ fontSize: "14px", marginBottom: "2PX" }}
              >
                Amount
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ height: "29px", fontSize: "13px" }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
              />
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-success mt-2"
                style={{ height: "29px", fontSize: "13px" }}
                onClick={handleAdd}
              >
                +
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive mt-2">
            <table
              className="table table-bordered text-center"
              style={{ fontSize: "14px" }}
            >
              <thead className="table-light">
                <tr>
                  <th>Delete</th>
                  <th>Voucher Type</th>
                  <th>Ledger No</th>
                  <th>Ledger Name</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  {/* <th>Customer no</th> */}
                  <th>Customer name</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="8">No records added</td>
                  </tr>
                ) : (
                  tableData.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveRow(index)}
                        >
                          Delete
                        </button>
                      </td>
                      <td>{row.voucherType}</td>
                      <td>{row.ledgerNo}</td>
                      <td>{row.ledgerName}</td>
                      <td>
                        {row.jama ? Number(row.jama).toFixed(2) : "00.00"}
                      </td>
                      <td>
                        {row.naave ? Number(row.naave).toFixed(2) : "00.00"}
                      </td>
                      {/* <td>{row.customerNo}</td> */}
                      <td>{row.customerName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Totals outside table */}
          <div className="row mt-2">
            <div
              className="col-md-4 d-flex align-items-center gap-2"
              style={{ fontSize: "14px", whiteSpace: "nowrap" }}
            >
              <label style={{ fontWeight: "normal" }}>Total Credit:</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                value={finalJama === 0 ? "00.00" : finalJama.toFixed(2)}
                readOnly
              />
            </div>
            <div
              className="col-md-4 d-flex align-items-center gap-2"
              style={{ fontSize: "14px", whiteSpace: "nowrap" }}
            >
              <label style={{ fontWeight: "normal" }}>Total Debit:</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                value={finalNaave === 0 ? "00.00" : finalNaave.toFixed(2)}
                readOnly
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="text-center mt-4 d-flex justify-content-center gap-2">
            <button
              type="button"
              className="button-save"
              style={{ fontSize: "14px" }}
              onClick={handleSave}
            >
              {editIndex != null ? "Update" : "Save"}
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
              onClick={handleShowList}
              style={{ fontSize: "14px" }}
            >
              Show List
            </button>
          </div>
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
            <h5 className="mb-0 fw-semibold">Voucher</h5>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-2 gap-2 mt-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowTable(false);
                handleClear();
                setSearchTerm("");
              }}
            >
              Close
            </button>
            {/* Ledger Name Search */}
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-search"></i>
              <label className="fw-semibold text-secondary small mb-0">
                Search
              </label>
              <input
                type="text"
                className="form-control "
                style={{
                  width: "420px",
                  marginRight: "400px",
                  height: "25px",
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search all columns..."
              />
            </div>
          </div>

          <div
            className="table-responsive"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
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
                style={{ fontSize: "13px", fontWeight: "semibold" }}
              >
                <tr>
                  <th className="table-column-bg-heading">Actions</th>
                  <th className="table-column-bg-heading">Sr. No.</th>
                  <th className="table-column-bg-heading">Trans No</th>
                  <th className="table-column-bg-heading">Trans Amount</th>
                  <th className="table-column-bg-heading">Trans Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransList.length === 0 ? (
                  <tr>
                    <td colSpan="5">No records found</td>
                  </tr>
                ) : (
                  filteredTransList.map((item, index) => (
                    <tr key={item.Trans_id}>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-1"
                          onClick={() => handleEdit(item.Trans_id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </td>
                      <td>{index + 1}</td>
                      <td>{item.Trans_no}</td>
                      <td>
                        {item.Trans_amt
                          ? Number(item.Trans_amt).toFixed(2)
                          : "00.00"}
                      </td>
                      <td>{item.Type_name}</td>
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

export default VoucherForm;
