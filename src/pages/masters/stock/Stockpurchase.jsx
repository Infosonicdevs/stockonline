import React, { useState, useEffect, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import { getSuppliers } from "../../../services/masters/SupplierService";
import { getStockDetails, getMainBranchCurrentStock } from "../../../services/masters/stock/stockdistribution";
import { insertPurchaseTransaction, getPurchaseTransactions, getPurchaseTransactionById, updatePurchaseTransaction, deletePurchaseTransaction } from "../../../services/masters/stock/stockpurchase";

const numberToWords = (num) => {
  if (num === 0) return "Zero Only";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const format = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + format(n % 100) : "");
    return "";
  };

  const convert = (n) => {
    if (n === 0) return "";
    let str = "";
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      str += format(n);
    }
    return str.trim();
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  let res = convert(whole) + " Rupees";
  if (fraction > 0) {
    res += " and " + convert(fraction) + " Paise";
  }
  return res + " Only";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const Stockpurchase = () => {
  // --- State for Master Info (Header) ---
  const [masterData, setMasterData] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    supplierNo: "",
    supplierName: "",
    travelingPermitNo: "",
    vehicleNo: "",
    igstOption: false,
    supplierId: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  // --- State for Current Item Entry ---
  const [itemEntry, setItemEntry] = useState({
    itemNo: "",
    barcode: "",
    itemName: "",
    quantity: "",
    mrp: "",
    rate: "",
    discount: "0",
    cgst: "0",
    sgst: "0",
    igst: "0",
    cgstAmt: "0.00",
    sgstAmt: "0.00",
    igstAmt: "0.00",
    totalAmount: "0.00",
    hsn: "",
    Stock_id: null,
    Mode: "PCS"
  });

  // --- State for Items Table ---
  const [purchaseItems, setPurchaseItems] = useState([]);

  // --- State for Footer Charges & Adjustments ---
  const [footerData, setFooterData] = useState({
    hamali: "0",
    travellingRent: "0",
    difference: "0",
    ses: "0",
    tcs: "0",
    netDiscount: "0",
    creditNote: "0",
    roundOff: "0",
    pavatiNo: ""
  });

  // --- Search & UI States ---
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // --- History States ---
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewItems, setViewItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [suppRes, itemsRes] = await Promise.all([
        getSuppliers(),
        getStockDetails()
        //getMainBranchCurrentStock()
      ]);

      const suppData = suppRes.data.Data || suppRes.data;
      setSuppliers(suppData);

      if (itemsRes.status === 200) {
        setAllItems(itemsRes.data);
      }
    } catch (error) {
      toast.error("Failed to load initial data");
    }
  };

  console.log(allItems);


  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await getPurchaseTransactions();
      if (response.status === 200) {
        setPurchaseHistory(response.data.Data || response.data);
      } else {
        toast.error("Failed to fetch history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Error fetching purchase history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchTransactionDetails = async (id) => {
    setLoadingDetails(true);
    setViewItems([]);
    try {
      console.log("Fetching details for invoice ID:", id);
      const response = await getPurchaseTransactionById(id);
      console.log("Invoice API Response:", response.data);

      if (response.status === 200) {
        let rawData = response.data.Data || response.data;
        let items = [];
        let headerInfo = {};

        if (Array.isArray(rawData)) {
          items = rawData;
          headerInfo = rawData.length > 0 ? rawData[0] : {};
        } else {
          items = rawData.PURCHASE_DETAILS || rawData.items || [];
          headerInfo = rawData;
        }

        setViewItems(items);
        if (headerInfo && headerInfo.Invoice_id) {
          setViewData(prev => ({ ...prev, ...headerInfo }));
        }
        return { items, headerInfo };
      } else {
        toast.error("Failed to fetch transaction details");
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      toast.error("Error fetching invoice details");
    } finally {
      setLoadingDetails(false);
    }
    return null;
  };

  const handleHistoryEdit = async (row) => {
    const detailData = await fetchTransactionDetails(row.Invoice_id);
    if (!detailData) return;

    const { items, headerInfo } = detailData;
    // Use row as primary source for header info, falling back to headerInfo from details if available
    const data = { ...row, ...headerInfo };

    setIsEditMode(true);
    setEditInvoiceId(data.Invoice_id);

    // 1. Populate Master Data
    setMasterData({
      invoiceNo: data.Invoice_no,
      invoiceDate: data.Invoice_date?.split("T")[0] || "",
      supplierNo: suppliers.find(s => Number(s.Vend_id) === Number(data.Vend_id))?.Vend_code || "",
      supplierName: suppliers.find(s => Number(s.Vend_id) === Number(data.Vend_id))?.Vend_name || "",
      travelingPermitNo: data.Parvana_no || "",
      vehicleNo: data.Truck_no || "",
      igstOption: data.IGST_amt > 0,
      supplierId: data.Vend_id,
      transactionDate: data.Bill_date?.split("T")[0] || "",
    });

    // 2. Populate Footer Data
    setFooterData({
      hamali: data.Hamali?.toString() || "0",
      travellingRent: data.Transport_amt?.toString() || "0",
      difference: data.Diff_amt?.toString() || "0",
      ses: data.Ma_ses_amt?.toString() || "0",
      tcs: data.TCS_amt?.toString() || "0",
      netDiscount: data.Net_disc?.toString() || "0",
      creditNote: data.Credit_note?.toString() || "0",
      roundOff: data.RoundOFF?.toString() || "0",
      pavatiNo: data.Pavati_no || ""
    });

    // 3. Populate Purchase Items
    const mappedItems = items.map(item => {
      // Find matching master stock info to get the latest tax percentages if not in details
      const stockInfo = allItems.find(s => Number(s.Stock_id) === Number(item.Stock_id || item.stock_id));

      const isIgstRow = data.IGST_amt > 0;
      let cgstPer = 0;
      let sgstPer = 0;
      let igstPer = 0;

      if (isIgstRow) {
        igstPer = parseFloat(stockInfo?.Pur_IGST_per) || parseFloat(stockInfo?.Pur_Heading) || 0;
      } else {
        cgstPer = parseFloat(stockInfo?.Pur_CGST_per) || (parseFloat(stockInfo?.Pur_Heading) / 2) || 0;
        sgstPer = parseFloat(stockInfo?.Pur_SGST_per) || (parseFloat(stockInfo?.Pur_Heading) / 2) || 0;
      }

      return {
        id: Math.random(), // Unique ID for local state
        itemNo: stockInfo?.Stock_no || stockInfo?.stock_no || "",
        barcode: stockInfo?.Barcode || stockInfo?.barcode || "",
        itemName: stockInfo?.Stock_name || stockInfo?.stock_name || `ID: ${item.Stock_id || item.stock_id}`,
        quantity: (item.Quantity || item.quantity || "0").toString(),
        mrp: (item.MRP || item.mrp || stockInfo?.MRP || stockInfo?.mrp || "0").toString(),
        rate: (item.Price || item.price || item.Rate || item.rate || 0).toString(),
        discount: (item.Disc_amt ?? item.Disc_Amt ?? item.disc_amt ?? item.DiscAmt ?? item.Discount ?? item.discount ?? stockInfo?.Discount ?? "0").toString(),
        // Get percentages from master stock info with fallbacks for distribution
        cgst: cgstPer.toString(),
        sgst: sgstPer.toString(),
        igst: igstPer.toString(),
        cgstAmt: (item.CGST_amt || item.cgst_amt || 0).toFixed(2),
        sgstAmt: (item.SGST_amt || item.sgst_amt || 0).toFixed(2),
        igstAmt: (item.IGST_amt || item.igst_amt || 0).toFixed(2),
        totalAmount: parseFloat(item.Total || item.total || 0).toFixed(2),
        Stock_id: item.Stock_id || item.stock_id,
        Mode: item.Mode || item.mode || "PCS",
        hsn: item.HSN_no || item.hsn_no || stockInfo?.HSN_no || ""
      };
    });
    setPurchaseItems(mappedItems);

    console.log("Populated Form - MasterData:", {
      invoiceNo: data.Invoice_no,
      supplierId: data.Vend_id,
      itemsCount: mappedItems.length
    });

    setShowTable(false); // Switch to entry view
  };

  const handleHistoryDelete = async (row) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete Invoice No: ${row.Invoice_no}?`);

    if (isConfirmed) {
      try {
        const payload = {
          Invoice_id: row.Invoice_id,
          Modified_by: localStorage.getItem("username") || "TRT"
        };

        const response = await deletePurchaseTransaction(payload);
        if (response.status === 200) {
          toast.success("Transaction deleted successfully");
          fetchHistory(); // Refresh the list
        } else {
          toast.error("Failed to delete transaction");
        }
      } catch (error) {
        console.error("Error deleting transaction:", error);
        toast.error(error.response?.data?.message || "Error deleting transaction");
      }
    }
  };

  useEffect(() => {
    if (showTable) {
      fetchHistory();
    }
  }, [showTable]);

  const handleSupplierNoChange = (e) => {
    const code = e.target.value;
    setMasterData((prev) => ({ ...prev, supplierNo: code }));

    // Auto-select supplier if code matches
    const supplier = suppliers.find(
      (s) => s.Vend_code.toString().toLowerCase() === code.toString().toLowerCase()
    );
    if (supplier) {
      setMasterData((prev) => ({
        ...prev,
        supplierName: supplier.Vend_name,
        supplierId: supplier.Vend_id,
      }));
    } else {
      setMasterData((prev) => ({ ...prev, supplierName: "", supplierId: "" }));
    }
  };

  const handleSupplierNameInput = (e) => {
    const value = e.target.value;
    setMasterData((prev) => ({ ...prev, supplierName: value }));

    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const onSelectSupplier = (supplier) => {
    setMasterData((prev) => ({
      ...prev,
      supplierName: supplier.Vend_name,
      supplierNo: supplier.Vend_code,
      supplierId: supplier.Vend_id,
    }));
    setShowSuggestions(false);
  };

  const selectSupplierFromModal = (index) => {
    const supplier = filteredSuppliers[index];
    onSelectSupplier(supplier);
    setShowSupplierModal(false);
    setSupplierSearch("");
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const term = supplierSearch.toLowerCase();
    return (
      s.Vend_name?.toLowerCase().includes(term) ||
      s.Vend_code?.toLowerCase().includes(term)
    );
  });

  const suggestionList = suppliers.filter((s) => {
    if (!masterData.supplierName) return false;
    const term = masterData.supplierName.toLowerCase();
    return (
      s.Vend_name?.toLowerCase().includes(term) ||
      s.Vend_code?.toLowerCase().includes(term)
    );
  });

  const supplierColumns = [
    { label: "Code", accessor: "Vend_code" },
    { label: "Supplier Name", accessor: "Vend_name" },
    { label: "Contact No", accessor: "Contact_no" },
    { label: "City", accessor: "City" },
  ];

  // --- Handlers ---
  const handleMasterChange = (e) => {
    const { id, value } = e.target;
    setMasterData((prev) => ({ ...prev, [id]: value }));
  };

  const handleItemChange = (e) => {
    const { id, value } = e.target;
    setItemEntry((prev) => {
      const updated = { ...prev, [id]: value };

      const qty = parseFloat(updated.quantity) || 0;
      const rate = parseFloat(updated.rate) || 0;
      const discAmt = parseFloat(updated.discount) || 0;

      // Get percentages from updated state
      const cgstPercent = parseFloat(updated.cgst) || 0;
      const sgstPercent = parseFloat(updated.sgst) || 0;
      const igstPercent = parseFloat(updated.igst) || 0;

      const taxableValue = (rate - discAmt) * qty;

      // Calculate amounts
      const cgstAmt = (taxableValue * cgstPercent) / 100;
      const sgstAmt = (taxableValue * sgstPercent) / 100;
      const igstAmt = (taxableValue * igstPercent) / 100;

      updated.cgstAmt = cgstAmt.toFixed(2);
      updated.sgstAmt = sgstAmt.toFixed(2);
      updated.igstAmt = igstAmt.toFixed(2);

      updated.totalAmount = (taxableValue + cgstAmt + sgstAmt + igstAmt).toFixed(2);

      return updated;
    });

    // Handle Item Name Autocomplete
    if (id === "itemName") {
      if (value.length > 0) {
        const term = value.toLowerCase();
        const filtered = allItems.filter((i) =>
          i.Stock_name?.toLowerCase().includes(term) ||
          i.Barcode?.toString().toLowerCase().includes(term) ||
          i.Stock_no?.toString().toLowerCase().includes(term)
        );
        setFilteredItems(filtered);
        setShowItemSuggestions(true);
      } else {
        setShowItemSuggestions(false);
      }
    }
  };

  const handleItemSelect = (item) => {
    setItemEntry((prev) => {
      const isIgst = masterData.igstOption;
      let cgstPer = 0;
      let sgstPer = 0;
      let igstPer = 0;

      if (isIgst) {
        // If IGST is ON, use IGST field or total heading
        igstPer = parseFloat(item.Pur_IGST_per) || parseFloat(item.Pur_Heading) || parseFloat(item.Heading) || 0;
      } else {
        // If IGST is OFF, use CGST/SGST fields or split the total heading
        cgstPer = parseFloat(item.Pur_CGST_per) || (parseFloat(item.Pur_Heading || item.Heading) / 2) || 0;
        sgstPer = parseFloat(item.Pur_SGST_per) || (parseFloat(item.Pur_Heading || item.Heading) / 2) || 0;
      }

      const updated = {
        ...prev,
        itemNo: item.Stock_no,
        barcode: item.Barcode,
        itemName: item.Stock_name,
        mrp: item.MRP || "0",
        rate: item.Rate || "0",
        discount: (item.Discount ?? item.discount ?? item.Disc_amt ?? "0").toString(),
        cgst: cgstPer.toString(),
        sgst: sgstPer.toString(),
        igst: igstPer.toString(),
        hsn: item.HSN_no || "",
        Stock_id: item.Stock_id,
        Mode: item.Unit || "PCS"
      };

      // Recalculate totals
      const qty = parseFloat(updated.quantity) || 0;
      const rate = parseFloat(updated.rate) || 0;
      const discAmt = parseFloat(updated.discount) || 0;
      const taxableValue = (rate - discAmt) * qty;

      const cgstVal = (taxableValue * (parseFloat(updated.cgst) || 0)) / 100;
      const sgstVal = (taxableValue * (parseFloat(updated.sgst) || 0)) / 100;
      const igstVal = (taxableValue * (parseFloat(updated.igst) || 0)) / 100;

      updated.cgstAmt = cgstVal.toFixed(2);
      updated.sgstAmt = sgstVal.toFixed(2);
      updated.igstAmt = igstVal.toFixed(2);
      updated.totalAmount = (taxableValue + cgstVal + sgstVal + igstVal).toFixed(2);

      return updated;
    });
    setShowItemSuggestions(false);
  };

  const toggleFullItemList = () => {
    if (!showItemSuggestions) {
      setFilteredItems(allItems);
      setShowItemSuggestions(true);
    } else {
      setShowItemSuggestions(false);
    }
  };

  const handleItemLookup = (field, value) => {
    if (!value) return;
    const item = allItems.find((i) => {
      if (field === "itemNo") return i.Stock_no?.toString() === value.toString();
      if (field === "barcode") return i.Barcode?.toString() === value.toString();
      return false;
    });

    if (item) {
      handleItemSelect(item);
    } else {
      toast.warning(`${field === "itemNo" ? "Item No" : "Barcode"} not found`);
    }
  };

  const handleIgstToggle = (e) => {
    const isChecked = e.target.checked;
    setMasterData((prev) => ({ ...prev, igstOption: isChecked }));

    // 1. Update tax distribution for current item entry
    setItemEntry((prev) => {
      let cgst = 0, sgst = 0, igst = 0;

      if (isChecked) {
        // Switching to IGST: Sum current CGST + SGST
        igst = (parseFloat(prev.cgst) || 0) + (parseFloat(prev.sgst) || 0);
      } else {
        // Switching to CGST/SGST: Split current IGST
        const total = parseFloat(prev.igst) || 0;
        cgst = total / 2;
        sgst = total / 2;
      }

      const updated = {
        ...prev,
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        igst: igst.toString(),
      };

      const qty = parseFloat(updated.quantity) || 0;
      const rate = parseFloat(updated.rate) || 0;
      const discAmt = parseFloat(updated.discount) || 0;
      const taxableValue = (rate - discAmt) * qty;

      const cgstVal = (taxableValue * (parseFloat(updated.cgst) || 0)) / 100;
      const sgstVal = (taxableValue * (parseFloat(updated.sgst) || 0)) / 100;
      const igstVal = (taxableValue * (parseFloat(updated.igst) || 0)) / 100;

      updated.cgstAmt = cgstVal.toFixed(2);
      updated.sgstAmt = sgstVal.toFixed(2);
      updated.igstAmt = igstVal.toFixed(2);
      updated.totalAmount = (taxableValue + cgstVal + sgstVal + igstVal).toFixed(2);

      return updated;
    });

    // 2. Update tax distribution for all items in the purchase list
    setPurchaseItems((prevItems) => {
      return prevItems.map((item) => {
        let cgstPer = 0, sgstPer = 0, igstPer = 0;

        if (isChecked) {
          igstPer = (parseFloat(item.cgst) || 0) + (parseFloat(item.sgst) || 0);
        } else {
          const total = parseFloat(item.igst) || 0;
          cgstPer = total / 2;
          sgstPer = total / 2;
        }

        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const discAmt = parseFloat(item.discount) || 0;
        const taxableValue = (rate - discAmt) * qty;

        const cgstAmt = (taxableValue * cgstPer) / 100;
        const sgstAmt = (taxableValue * sgstPer) / 100;
        const igstAmt = (taxableValue * igstPer) / 100;

        return {
          ...item,
          cgst: cgstPer.toString(),
          sgst: sgstPer.toString(),
          igst: igstPer.toString(),
          cgstAmt: cgstAmt.toFixed(2),
          sgstAmt: sgstAmt.toFixed(2),
          igstAmt: igstAmt.toFixed(2),
          totalAmount: (taxableValue + cgstAmt + sgstAmt + igstAmt).toFixed(2)
        };
      });
    });
  };

  const handleSave = async () => {
    // 1. Validations
    if (!masterData.invoiceNo) {
      toast.error("Invoice No is compulsory");
      return;
    }
    if (!masterData.supplierId) {
      toast.error("Supplier selection is compulsory");
      return;
    }
    if (!masterData.invoiceDate) {
      toast.error("Invoice Date is compulsory");
      return;
    }
    if (purchaseItems.length === 0) {
      toast.error("At least one item must be added to the purchase list");
      return;
    }

    // 2. Construct Payload
    const payload = {
      Invoice_date: masterData.invoiceDate,
      Bill_date: masterData.transactionDate,
      Vend_id: parseInt(masterData.supplierId),
      RoundOFF: parseFloat(footerData.roundOff) || 0,
      Final_amt: parseFloat(totals.billAmount) || 0,
      Parvana_no: masterData.travelingPermitNo || "",
      Truck_no: masterData.vehicleNo || "",
      Diff_amt: parseFloat(footerData.difference) || 0,
      State_id: 27,
      Hamali: parseFloat(footerData.hamali) || 0,
      Transport_amt: parseFloat(footerData.travellingRent) || 0,
      Ma_ses_amt: parseFloat(footerData.ses) || 0,
      TCS_amt: parseFloat(footerData.tcs) || 0,
      Credit_note: parseFloat(footerData.creditNote) || 0,
      Pavati_no: footerData.pavatiNo || "",
      Invoice_no: masterData.invoiceNo,
      Net_disc: parseFloat(footerData.netDiscount) || 0,
      Year_id: parseInt(localStorage.getItem("Year_Id")) || 1,
      Trans_type_id: 1,
      trans_code: "PUR001",
      CashTrans: "C",
      Amount: parseFloat(totals.billAmount) || 0,
      CGST_amt: parseFloat(totals.totalCGST) || 0,
      SGST_amt: parseFloat(totals.totalSGST) || 0,
      IGST_amt: parseFloat(totals.totalIGST) || 0,
      Cust_id: 1,
      Card_no: "1234567890",
      Outlet_id: parseInt(localStorage.getItem("Outlet_id")) || 1,
      PURCHASE_DETAILS: purchaseItems.map((item) => ({
        Stock_id: item.Stock_id,
        Price: parseFloat(item.rate) || 0,
        Quantity: parseFloat(item.quantity) || 0,
        CGST_amt: parseFloat(item.cgstAmt) || 0,
        SGST_amt: parseFloat(item.sgstAmt) || 0,
        IGST_amt: parseFloat(item.igstAmt) || 0,
        Disc_amt: parseFloat(item.discount) || 0,
        MRP: parseFloat(item.mrp) || 0,
        Total: parseFloat(item.totalAmount) || 0,
        Mode: item.Mode || "PCS",
      })),
    };

    if (isEditMode) {
      payload.Invoice_id = editInvoiceId;
      payload.Modify_reason = "Update ";
      payload.Modified_by = localStorage.getItem("username") || "TRT";
    } else {
      payload.Created_by = localStorage.getItem("username") || "TRT";
    }

    try {
      const response = isEditMode
        ? await updatePurchaseTransaction(payload)
        : await insertPurchaseTransaction(payload);

      if (response.status === 200) {
        toast.success(`Purchase record ${isEditMode ? "updated" : "saved"} successfully!`);
        resetForm();
      } else {
        toast.error(`Failed to ${isEditMode ? "update" : "save"} purchase record`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${isEditMode ? "updating" : "saving"} purchase record`);
    }
  };

  const resetForm = () => {
    setMasterData({
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      supplierNo: "",
      supplierName: "",
      travelingPermitNo: "",
      vehicleNo: "",
      igstOption: false,
      supplierId: "",
      transactionDate: new Date().toISOString().split("T")[0],
    });
    setPurchaseItems([]);
    setFooterData({
      hamali: "0",
      travellingRent: "0",
      difference: "0",
      ses: "0",
      tcs: "0",
      netDiscount: "0",
      creditNote: "0",
      roundOff: "0",
      pavatiNo: ""
    });
    setItemEntry({
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "",
      rate: "",
      discount: "0",
      cgst: "0",
      sgst: "0",
      igst: "0",
      cgstAmt: "0.00",
      sgstAmt: "0.00",
      igstAmt: "0.00",
      totalAmount: "0.00",
      Stock_id: null,
      Mode: "PCS"
    });
    setIsEditMode(false);
    setEditInvoiceId(null);
  };

  const handleFooterChange = (e) => {
    const { id, value } = e.target;
    setFooterData((prev) => ({ ...prev, [id]: value }));
  };

  const addItem = () => {
    if (!itemEntry.itemName || !itemEntry.quantity || !itemEntry.rate) {
      toast.error("Please fill Item Name, Quantity and Rate");
      return;
    }

    setPurchaseItems((prev) => {
      // 1. If we are editing an existing row (it has an id)
      if (itemEntry.id) {
        return prev.map((item) => (item.id === itemEntry.id ? { ...itemEntry, totalAmount: parseFloat(itemEntry.totalAmount) } : item));
      }

      // 2. Check if this Stock_id already exists in the list (but we aren't editing it)
      const existingIdx = prev.findIndex(item => item.Stock_id === itemEntry.Stock_id);
      if (existingIdx !== -1) {
        // Merge with existing
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const newQty = (parseFloat(item.quantity) || 0) + (parseFloat(itemEntry.quantity) || 0);

            // Recalculate totals for merged row
            const rate = parseFloat(item.rate) || 0;
            const discAmt = parseFloat(item.discount) || 0;
            const taxableValue = (rate - discAmt) * newQty;
            const cgstAmt = (taxableValue * (parseFloat(item.cgst) || 0)) / 100;
            const sgstAmt = (taxableValue * (parseFloat(item.sgst) || 0)) / 100;
            const igstAmt = (taxableValue * (parseFloat(item.igst) || 0)) / 100;

            return {
              ...item,
              quantity: newQty.toString(),
              cgstAmt: cgstAmt.toFixed(2),
              sgstAmt: sgstAmt.toFixed(2),
              igstAmt: igstAmt.toFixed(2),
              totalAmount: (taxableValue + cgstAmt + sgstAmt + igstAmt).toFixed(2)
            };
          }
          return item;
        });
      }

      // 3. Add as new item
      const newItem = {
        ...itemEntry,
        id: Date.now(),
        totalAmount: parseFloat(itemEntry.totalAmount)
      };
      return [...prev, newItem];
    });

    // Reset item entry
    setItemEntry({
      itemNo: "",
      barcode: "",
      itemName: "",
      quantity: "",
      mrp: "",
      rate: "",
      discount: "0",
      cgst: "0",
      sgst: "0",
      igst: "0",
      cgstAmt: "0.00",
      sgstAmt: "0.00",
      igstAmt: "0.00",
      totalAmount: "0.00",
      hsn: "",
      Stock_id: null,
      Mode: "PCS"
    });
  };

  const removeItem = (index) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Derived Calculations (Totals) ---
  const totals = useMemo(() => {
    const totalQty = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

    // 1. Calculate base item totals
    let itemTaxableTotal = 0;
    let itemCGSTTotal = 0;
    let itemSGSTTotal = 0;
    let itemIGSTTotal = 0;
    let itemDiscountTotal = 0;

    purchaseItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const discAmt = parseFloat(item.discount) || 0;

      const taxable = (rate - discAmt) * qty;
      itemTaxableTotal += taxable;
      itemDiscountTotal += (discAmt * qty);

      itemCGSTTotal += (taxable * (parseFloat(item.cgst) || 0)) / 100;
      itemSGSTTotal += (taxable * (parseFloat(item.sgst) || 0)) / 100;
      itemIGSTTotal += (taxable * (parseFloat(item.igst) || 0)) / 100;
    });

    const totalGST = itemCGSTTotal + itemSGSTTotal + itemIGSTTotal;
    const totalPurchase = itemTaxableTotal + totalGST;

    // 2. Footer Adjustments
    const additionalCharges =
      (parseFloat(footerData.hamali) || 0) +
      (parseFloat(footerData.travellingRent) || 0) +
      (parseFloat(footerData.difference) || 0) +
      (parseFloat(footerData.ses) || 0) +
      (parseFloat(footerData.tcs) || 0);

    const footerDiscounts =
      (parseFloat(footerData.netDiscount) || 0) +
      (parseFloat(footerData.creditNote) || 0);

    const totalDiscount = itemDiscountTotal + (parseFloat(footerData.netDiscount) || 0) + (parseFloat(footerData.creditNote) || 0);

    const roundOff = parseFloat(footerData.roundOff) || 0;

    const billAmount = totalPurchase + additionalCharges - footerDiscounts + roundOff;

    return {
      totalQty,
      itemTaxableTotal: itemTaxableTotal.toFixed(2),
      itemDiscountTotal: itemDiscountTotal.toFixed(2),
      footerDiscounts: footerDiscounts.toFixed(2),
      totalDiscount: footerDiscounts.toFixed(2),
      totalCGST: itemCGSTTotal.toFixed(2),
      totalSGST: itemSGSTTotal.toFixed(2),
      totalIGST: itemIGSTTotal.toFixed(2),
      totalGST: totalGST.toFixed(2),
      additionalCharges: additionalCharges.toFixed(2),
      totalPurchase: totalPurchase.toFixed(2),
      billAmount: billAmount.toFixed(2),
      roundOff: roundOff.toFixed(2)
    };
  }, [purchaseItems, footerData]);

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Qty", accessor: "quantity" },
    { label: "MRP", accessor: "mrp" },
    { label: "Rate", accessor: "rate" },
    { label: "Disc Amt", accessor: "discount" },
    {
      label: "CGST",
      accessor: "cgst",
      render: (val, row) => `₹${row.cgstAmt || "0.00"} (${val}%)`
    },
    {
      label: "SGST",
      accessor: "sgst",
      render: (val, row) => `₹${row.sgstAmt || "0.00"} (${val}%)`
    },
    {
      label: "IGST",
      accessor: "igst",
      render: (val, row) => `₹${row.igstAmt || "0.00"} (${val}%)`
    },
    { label: "Total", accessor: "totalAmount", render: (val) => `₹${parseFloat(val).toFixed(2)}` },
  ];

  const historyColumns = useMemo(() => [
    {
      label: "Invoice no",
      accessor: "Invoice_no"
    },
    {
      label: "Date",
      accessor: "Invoice_date",
      render: (val) => formatDate(val)
    },
    {
      label: "Vendor Name",
      accessor: "Vend_id",
      render: (id) => {
        const supplier = suppliers.find(s => s.Vend_id === id);
        return supplier ? supplier.Vend_name : `Vendor ID: ${id}`;
      }
    },
    {
      label: "Total Amount",
      accessor: "Final_amt",
      render: (val) => `₹${parseFloat(val || 0).toFixed(2)}`
    },
    {
      label: "View",
      accessor: "Invoice_no",
      render: (_, row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={(e) => {
            e.stopPropagation();
            setViewData(row);
            setShowViewModal(true);
            fetchTransactionDetails(row.Invoice_id);
          }}
        >
          <i className="bi bi-eye"></i> View
        </button>
      )
    }
  ], [suppliers]);

  return (
    <div className="container-fluid p-3" style={{ backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <ToastContainer />

      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#2c3e50", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
          <h5 className="mb-0 fw-bold"><i className="bi bi-cart-check-fill me-2"></i>Stock Purchase</h5>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-light" onClick={() => setShowTable(!showTable)}>
              {showTable ? "Hide List" : "Show List"}
            </button>
          </div>
        </div>

        <div className="card-body p-4">
          {!showTable ? (
            <>
              {/* --- Section 1: Invoice & Supplier Header --- */}
              <div className="row g-3 mb-4 pb-3 border-bottom">
                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Invoice No *</label>
                  <input
                    type="text"
                    id="invoiceNo"
                    className={`form-control form-control-sm ${isEditMode ? 'bg-light' : 'border-primary'}`}
                    value={masterData.invoiceNo}
                    onChange={handleMasterChange}
                    placeholder="Enter Invoice No"
                    disabled={isEditMode}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Invoice Date</label>
                  <input type="date" id="invoiceDate" className="form-control form-control-sm" value={masterData.invoiceDate} onChange={handleMasterChange} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Supplier No</label>
                  <input type="text" id="supplierNo" className="form-control form-control-sm" value={masterData.supplierNo} onChange={handleSupplierNoChange} />
                </div>
                <div className="col-md-4 position-relative">
                  <label className="form-label small fw-bold text-muted">Supplier Name</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      id="supplierName"
                      className="form-control"
                      autoComplete="off"
                      value={masterData.supplierName}
                      onChange={handleSupplierNameInput}
                      placeholder="Type to search supplier..."
                    />
                    <button className="btn btn-primary" type="button" onClick={() => setShowSupplierModal(true)}><i className="bi bi-search"></i></button>
                  </div>
                  {showSuggestions && suggestionList.length > 0 && (
                    <div
                      className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                      style={{ maxHeight: "200px", zIndex: 1000, border: "1px solid #ddd" }}
                    >
                      {suggestionList.map((s) => (
                        <div
                          key={s.Vend_id}
                          className="p-2 cursor-pointer border-bottom small hover-bg-light"
                          onClick={() => onSelectSupplier(s)}
                        >
                          <div className="fw-bold">{s.Vend_name}</div>
                          <div className="text-muted x-small">Code: {s.Vend_code} | {s.City}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Trans. Date</label>
                  <input type="date" id="transactionDate" className="form-control form-control-sm" value={masterData.transactionDate} onChange={handleMasterChange} />
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Traveling Permit No</label>
                  <input type="text" id="travelingPermitNo" className="form-control form-control-sm" value={masterData.travelingPermitNo} onChange={handleMasterChange} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted">Vehicle No</label>
                  <input type="text" id="vehicleNo" className="form-control form-control-sm" value={masterData.vehicleNo} onChange={handleMasterChange} />
                </div>

                <div className="col-md-1 d-flex align-items-center mt-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="igstOption"
                      className="form-check-input"
                      checked={masterData.igstOption}
                      onChange={handleIgstToggle}
                    />
                    <label className="form-check-label small fw-bold text-muted" htmlFor="igstOption">
                      IGST
                    </label>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Item Entry --- */}
              <div className="bg-light p-3 rounded-3 mb-4 border">
                {/* Row 1: Item Identifiers */}
                <div className="row g-2 mb-3">
                  <div className="col-md-2">
                    <label className="form-label x-small fw-bold">Item No</label>
                    <input
                      type="text"
                      id="itemNo"
                      className="form-control form-control-sm"
                      value={itemEntry.itemNo}
                      onChange={handleItemChange}
                      onBlur={(e) => handleItemLookup("itemNo", e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label x-small fw-bold">Barcode</label>
                    <input
                      type="text"
                      id="barcode"
                      className="form-control form-control-sm"
                      value={itemEntry.barcode}
                      onChange={handleItemChange}
                      onBlur={(e) => handleItemLookup("barcode", e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 position-relative">
                    <label className="form-label x-small fw-bold">Item Name</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        id="itemName"
                        className="form-control"
                        autoComplete="off"
                        value={itemEntry.itemName}
                        onChange={handleItemChange}
                        placeholder="Type item name to search..."
                      />
                      <button className="btn btn-secondary" type="button" title="View Whole List" onClick={toggleFullItemList}>
                        <i className="bi bi-list-ul"></i>
                      </button>
                    </div>
                    {showItemSuggestions && filteredItems.length > 0 && (
                      <div
                        className="position-absolute bg-white shadow w-100 mt-1 rounded overflow-auto"
                        style={{ maxHeight: "250px", zIndex: 1000, border: "1px solid #ddd" }}
                      >
                        {filteredItems.map((item) => (
                          <div
                            key={item.Stock_id}
                            className="p-2 cursor-pointer border-bottom small hover-bg-light"
                            onClick={() => handleItemSelect(item)}
                          >
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold text-primary">{item.Stock_name}</span>
                              <span className="badge bg-light text-dark border">No: {item.Stock_no}</span>
                            </div>
                            <div className="text-muted x-small mt-1">
                              Barcode: {item.Barcode} | MRP: ₹{item.MRP} | Rate: ₹{item.Rate}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label x-small fw-bold">HSN No</label>
                    <input
                      type="text"
                      id="hsn"
                      className="form-control form-control-sm"
                      value={itemEntry.hsn}
                      onChange={handleItemChange}
                    />
                  </div>
                </div>

                {/* Row 2: Pricing & Quantities */}
                <div className="row g-2 mb-3 align-items-end">
                  <div className="col">
                    <label className="form-label x-small fw-bold">Qty</label>
                    <input type="number" id="quantity" className="form-control form-control-sm text-center fw-bold text-primary" value={itemEntry.quantity} onChange={handleItemChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold">MRP</label>
                    <input type="number" id="mrp" className="form-control form-control-sm text-end" value={itemEntry.mrp} onChange={handleItemChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold">Rate</label>
                    <input type="number" id="rate" className="form-control form-control-sm text-end" value={itemEntry.rate} onChange={handleItemChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold text-danger">Disc (Amt)</label>
                    <input type="number" id="discount" className="form-control form-control-sm text-center" value={itemEntry.discount} onChange={handleItemChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold text-success">Total (Excl. Tax)</label>
                    <div className="form-control form-control-sm fw-bold bg-white border-success text-success text-end">
                      ₹{((parseFloat(itemEntry.rate) || 0) - (parseFloat(itemEntry.discount) || 0)) * (parseFloat(itemEntry.quantity) || 0)}
                    </div>
                  </div>
                </div>

                {/* Row 3: Taxes & Action */}
                <div className="row g-2 align-items-end">
                  <div className="col-md-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label x-small fw-bold mb-0 text-muted">CGST (₹)</label>
                      {!masterData.igstOption && <span className="x-small text-primary fw-bold">{itemEntry.cgst}%</span>}
                    </div>
                    <input type="text" id="cgstAmt" className="form-control form-control-sm text-end fw-bold bg-light" value={itemEntry.cgstAmt} readOnly disabled={masterData.igstOption} />
                  </div>
                  <div className="col-md-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label x-small fw-bold mb-0 text-muted">SGST (₹)</label>
                      {!masterData.igstOption && <span className="x-small text-primary fw-bold">{itemEntry.sgst}%</span>}
                    </div>
                    <input type="text" id="sgstAmt" className="form-control form-control-sm text-end fw-bold bg-light" value={itemEntry.sgstAmt} readOnly disabled={masterData.igstOption} />
                  </div>
                  <div className="col-md-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label x-small fw-bold mb-0 text-muted">IGST (₹)</label>
                      {masterData.igstOption && <span className="x-small text-primary fw-bold">{itemEntry.igst}%</span>}
                    </div>
                    <input type="text" id="igstAmt" className="form-control form-control-sm text-end fw-bold bg-light" value={itemEntry.igstAmt} readOnly disabled={!masterData.igstOption} />
                  </div>
                  <div className="col-md-3">
                    <div className="p-1 px-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25 d-flex justify-content-between align-items-center" style={{ height: '31px' }}>
                      <span className="x-small fw-bold text-primary text-uppercase">Final Row Amount:</span>
                      <span className="fw-bold text-primary small">₹{itemEntry.totalAmount}</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <button type="button" className="btn btn-success btn-sm fw-bold shadow-sm w-100" onClick={addItem}>
                      <i className="bi bi-plus-circle me-2"></i>Add to Purchase List
                    </button>
                  </div>
                </div>
              </div>

              {/* --- Section 3: Items Table --- */}
              <div className="mb-4 shadow-sm rounded overflow-hidden" style={{ minHeight: "200px", border: "1px solid #dee2e6" }}>
                <CommonTable
                  columns={columns}
                  data={purchaseItems}
                  showActions={true}
                  onDelete={removeItem}
                  onEdit={(idx) => setItemEntry(purchaseItems[idx])}
                  showSearch={false}
                />
              </div>

              {/* --- Section 4: Footer Calculations & Summary --- */}
              <div className="row g-4">
                {/* Left: Additional Charges */}
                <div className="col-md-8">
                  <div className="card border-0 bg-light-subtle shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">Adjustments & Charges</h6>
                      <div className="row row-cols-2 row-cols-md-4 g-3">
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Hamali</label><input type="number" id="hamali" className="form-control form-control-sm" value={footerData.hamali} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Travelling Rent</label><input type="number" id="travellingRent" className="form-control form-control-sm" value={footerData.travellingRent} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Difference</label><input type="number" id="difference" className="form-control form-control-sm" value={footerData.difference} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Cess (Ses)</label><input type="number" id="ses" className="form-control form-control-sm" value={footerData.ses} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">TCS</label><input type="number" id="tcs" className="form-control form-control-sm" value={footerData.tcs} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Net Discount</label><input type="number" id="netDiscount" className="form-control form-control-sm" value={footerData.netDiscount} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Credit Note</label><input type="number" id="creditNote" className="form-control form-control-sm" value={footerData.creditNote} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Round Off</label><input type="number" id="roundOff" className="form-control form-control-sm" value={footerData.roundOff} onChange={handleFooterChange} /></div>
                        <div className="col"><label className="form-label x-small fw-bold text-muted">Pavati No</label><input type="text" id="pavatiNo" className="form-control form-control-sm" value={footerData.pavatiNo} onChange={handleFooterChange} /></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Totals */}
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm" style={{ backgroundColor: "#eef2f3" }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2 text-center">Financial Summary</h6>
                      <div className="d-flex justify-content-between mb-2 small px-2"><span>Taxable Value:</span><span className="fw-bold text-end">₹{totals.itemTaxableTotal}</span></div>
                      <div className="d-flex justify-content-between mb-2 small px-2"><span>Total GST:</span><span className="fw-bold text-end">₹{totals.totalGST}</span></div>
                      <div className="d-flex justify-content-between mb-2 small px-2"><span className="text-primary">Additional Charges (+):</span><span className="fw-bold text-primary text-end">₹{totals.additionalCharges}</span></div>
                      <div className="d-flex justify-content-between mb-2 small px-2"><span className="text-danger">Total Discount (-):</span><div className="text-end"><span className="fw-bold text-danger">₹{totals.totalDiscount}</span></div></div>
                      <div className="d-flex justify-content-between mb-3 small px-2"><span>Round Off (+/-):</span><span className="fw-bold text-end">₹{totals.roundOff}</span></div>

                      <div className="bg-white p-3 rounded-3 shadow-sm border border-2 border-primary mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1"><span className="small fw-bold text-muted text-uppercase">Net Bill Amount</span><span className="badge bg-primary rounded-pill small">{totals.totalQty} Items</span></div>
                        <h2 className="fw-bold text-primary mb-0 text-end">₹{totals.billAmount}</h2>
                      </div>
                      <div className="mt-3 p-2 rounded bg-white-50 border-top"><span className="x-small fw-bold text-muted text-uppercase d-block mb-1">Amount in Words</span><span className="small fw-bold text-secondary text-capitalize d-block">{numberToWords(parseFloat(totals.billAmount))}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Buttons Section --- */}
              <div className="mt-5 pt-3 border-top d-flex justify-content-center gap-3">
                <button type="button" className="btn btn-success px-5 fw-bold shadow-sm py-2" onClick={handleSave}>
                  <i className={`bi bi-${isEditMode ? "pencil-square" : "save"} me-2`}></i>
                  {isEditMode ? "Update" : "Save"}
                </button>
                <button type="button" className="btn btn-info px-5 fw-bold shadow-sm py-2 text-white" onClick={() => setShowTable(!showTable)}>
                  <i className="bi bi-list-check me-2"></i>List
                </button>
                <button type="button" className="btn btn-danger px-5 fw-bold shadow-sm py-2" onClick={resetForm}>
                  <i className="bi bi-x-circle me-2"></i>{isEditMode ? "Cancel Edit" : "Clear"}
                </button>
              </div>
            </>
          ) : (
            <div className="history-section">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-secondary mb-0"><i className="bi bi-clock-history me-2"></i>Purchase Transaction History</h6>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowTable(false)}>
                  <i className="bi bi-arrow-left me-1"></i> Back to Entry
                </button>
              </div>

              <div className="shadow-sm rounded overflow-hidden" style={{ minHeight: "300px", border: "1px solid #dee2e6" }}>
                {loadingHistory ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading history...</span>
                    </div>
                  </div>
                ) : (
                  <CommonTable
                    columns={historyColumns}
                    data={purchaseHistory}
                    showActions={true}
                    onEdit={(idx) => handleHistoryEdit(purchaseHistory[idx])}
                    onDelete={(idx) => handleHistoryDelete(purchaseHistory[idx])}
                    onSearchChange={(val) => {
                      // Implement local search if needed
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Lookup Modals --- */}
      {showSupplierModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Select Supplier</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSupplierModal(false)}></button>
              </div>
              <div className="modal-body">
                <CommonTable
                  columns={supplierColumns}
                  data={filteredSuppliers}
                  onEdit={selectSupplierFromModal}
                  showActions={true}
                  onSearchChange={setSupplierSearch}
                  searchValue={supplierSearch}
                  onClose={() => setShowSupplierModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- View Detail Modal --- */}
      {showViewModal && viewData && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title fw-bold">Invoice Details: {viewData.Invoice_no}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body bg-light">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Supplier</label>
                        <h6 className="fw-bold mb-3">{suppliers.find(s => s.Vend_id === viewData.Vend_id)?.Vend_name || `ID: ${viewData.Vend_id}`}</h6>

                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Invoice Info</label>
                        <p className="mb-1 small"><strong>Date:</strong> {formatDate(viewData.Invoice_date)}</p>
                        <p className="mb-0 small"><strong>Bill Date:</strong> {formatDate(viewData.Bill_date)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Financial Summary</label>
                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                          <span className="fw-bold text-primary">Final Amount:</span>
                          <span className="fw-bold text-primary h5 mb-0">₹{viewData.Final_amt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-list-stars me-2"></i>Itemized Details</h6>
                  <div className="table-responsive rounded shadow-sm border bg-white" style={{ maxHeight: '300px' }}>
                    {loadingDetails ? (
                      <div className="d-flex justify-content-center align-items-center p-5">
                        <div className="spinner-border text-info spinner-border-sm me-2" role="status"></div>
                        <span className="small text-muted">Fetching items...</span>
                      </div>
                    ) : viewItems.length > 0 ? (
                      <table className="table table-sm table-hover mb-0 text-center x-small">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th className="text-start">Item Name</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Tax</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewItems.map((item, idx) => {
                            const stockInfo = allItems.find(s => s.Stock_id === item.Stock_id);
                            const taxAmt = (item.CGST_amt || 0) + (item.SGST_amt || 0) + (item.IGST_amt || 0);
                            return (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td className="text-start fw-bold">{stockInfo?.Stock_name || `Item ID: ${item.Stock_id}`}</td>
                                <td>{item.Quantity}</td>
                                <td>{item.Mode || 'PCS'}</td>
                                <td>₹{parseFloat(item.Price || item.Rate || 0).toFixed(2)}</td>
                                <td>₹{taxAmt.toFixed(2)}</td>
                                <td className="text-end fw-bold">₹{parseFloat(item.Total || 0).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan="6" className="text-end fw-bold">Grand Total:</td>
                            <td className="text-end fw-bold text-primary">₹{viewItems.reduce((sum, i) => sum + (parseFloat(i.Total) || 0), 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-muted small">
                        <i className="bi bi-exclamation-triangle me-2"></i>No items found for this invoice.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-body .bi-search { display: none; } /* Hide duplicate search icon in CommonTable */
        .modal-body .btn-info { background-color: #27ae60; border-color: #27ae60; color: white; }
        .modal-body .btn-info:after { content: ' Select'; }
        .x-small { font-size: 0.75rem; }
        .bg-light-subtle { background-color: #f8f9fa !important; }
        .form-control:focus, .form-select:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
        }
        .btn-success { background-color: #27ae60; border: none; }
        .btn-success:hover { background-color: #219150; }
        .btn-primary { background-color: #3498db; border: none; }
        .btn-danger { background-color: #e74c3c; border: none; }
        .card { border-radius: 12px; overflow: hidden; }
        
        /* Hide number input spinners */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Stockpurchase;