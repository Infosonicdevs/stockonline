import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../../components/navigation/CommonTable";
import {
  getOutletCurrentStock,
  insertStockSale,
  getSaleTransactions,
  getSaleTransactionDetails,
  deleteSaleTransaction,
  updateStockSale
} from "../../../services/masters/stock/stocksale";

// --- Utility: Convert Number to Indian Rupee Words ---
const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'Overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str ? str + 'Rupees Only' : 'Zero Rupees';
};

const Stocksale = () => {
  // --- Unified State for Form Data (Master + Current Item Entry + Payments) ---
  const [formData, setFormData] = useState({
    // Master Info
    isIGST: false,
    customerName: "",
    counterNo: "C001", // Mocked
    employeeName: "John Doe", // Mocked
    loginTime: new Date().toLocaleTimeString(), // Mocked

    // Item Entry
    id: null,
    itemNo: "",
    barcode: "",
    itemName: "",
    stockId: null,
    quantity: "0",
    mrp: "",
    discount: "0",
    saleAmount: "0.00",
    taxableAmount: "0.00",
    cgst: "0",
    sgst: "0",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    rowTotalAmount: "0.00",
    currentStock: 0,

    // Payments & Adjustments
    roundOff: "0",
    cashReceived: "0",
    paymentUPI: "0",
  });

  // --- State for Items Table ---
  const [itemsList, setItemsList] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- State for Transaction List View ---
  const [showSaleTable, setShowSaleTable] = useState(false);
  const [saleTransactions, setSaleTransactions] = useState([]);
  const [searchTransaction, setSearchTransaction] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);

  // --- Fetch Stock function ---
  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const outletId = localStorage.getItem("Outlet_id");
      if (!outletId) {
        console.warn("No Outlet_id found. Please login.");
        return;
      }
      const response = await getOutletCurrentStock(outletId);
      if (response.data && response.data.success) {
        setStockList(response.data.data);
      } else {
        toast.error("Failed to load stock data");
      }
    } catch (error) {
      console.error("Error fetching stock:", error);
      toast.error("Error connecting to stock API");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fetch Stock on Mount ---
  useEffect(() => {
    fetchStock();
  }, []);

  const findStockName = (id) => {
    const stock = stockList.find(s => s.Stock_id === id);
    return stock ? stock.Stock_name : `ID: ${id}`;
  };

  const getStockValueFromStore = (stockId) => {
    const stockItem = stockList.find(s => Number(s.Stock_id) === Number(stockId));
    if (!stockItem) return 0;
    const val = stockItem.Current_Stock !== undefined ? stockItem.Current_Stock : stockItem.current_stock;
    return parseFloat(val) || 0;
  };

  const getEffectiveStock = (stockId, baseStock) => {
    // Aggressively find the stock value
    let base = 0;
    if (typeof baseStock === 'number') base = baseStock;
    else if (baseStock) base = parseFloat(baseStock) || 0;

    let effective = base;

    // If in edit mode, add back the quantity already in this specific sale
    if (formData.saleId && itemsList.length > 0) {
      const existingItem = itemsList.find(item => Number(item.stockId) === Number(stockId));
      if (existingItem) {
        const qtyToAdd = parseFloat(existingItem.originalQty) || 0;
        effective += qtyToAdd;
      }
    }
    console.log(`getEffectiveStock: id=${stockId}, base=${base}, effective=${effective}`);
    return effective;
  };

  // --- Fetch Transactions ---
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await getSaleTransactions();
      const data = response.data?.$values || response.data;
      setSaleTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transaction list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSale = async (rowIndex) => {
    const sale = saleTransactions[rowIndex];
    try {
      setIsLoading(true);
      const response = await getSaleTransactionDetails(sale.Sale_id);
      const data = response.data?.$values || response.data;
      setSelectedSaleDetails(Array.isArray(data) ? data : []);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      toast.error("Failed to load sale details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSale = async (rowIndex) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    const sale = saleTransactions[rowIndex];
    try {
      setIsLoading(true);
      const userName = localStorage.getItem("username") || "TRT";
      const response = await deleteSaleTransaction(sale.Sale_id, userName);
      if (response.status === 200 || response.data.success) {
        toast.success("Transaction deleted successfully");
        fetchTransactions();
      } else {
        toast.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error deleting transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSale = (rowIndex) => {
    const sale = saleTransactions[rowIndex];
    if (!sale) return;

    setFormData(prev => ({
      ...prev,
      pavatiNo: sale.Pavati_no || "",
      customerName: sale.Card_no === "Check 3" ? "" : (sale.Card_no || ""),
      saleId: sale.Sale_id,
      roundOff: (sale.Round_off ?? 0).toString(),
      cashReceived: (sale.Receive_cash ?? 0).toString(),
      paymentUPI: (sale.UPI_AMT ?? 0).toString(),
    }));

    const fetchToEdit = async () => {
      try {
        setIsLoading(true);
        const response = await getSaleTransactionDetails(sale.Sale_id);
        const data = response.data?.$values || response.data;
        const items = Array.isArray(data) ? data : [];

        if (items.length > 0) {
          const mappedItems = items.map(item => {
            const stockInfo = stockList.find(s => s.Stock_id === item.Stock_id) || {};

            const qty = parseFloat(item.Quantity) || 0;
            const mrp = parseFloat(item.MRP) || stockInfo.MRP || 0;
            const rate = parseFloat(item.Rate) || (parseFloat(item.Amount) / qty) || 0;
            const amount = parseFloat(item.Amount) || (rate * qty);

            // If properties are missing in Details API, use Stock master values as defaults
            const cgstPer = item.CGST_per ?? stockInfo.CGST_per ?? 0;
            const sgstPer = item.SGST_per ?? stockInfo.SGST_per ?? 0;
            const disc = item.Disc ?? (mrp - rate);

            const taxableAmount = item.Taxable_amt ?? amount;
            const cgstAmount = item.CGST_amt ?? (taxableAmount * cgstPer / 100);
            const sgstAmount = item.SGST_amt ?? (taxableAmount * sgstPer / 100);

            return {
              id: Date.now() + Math.random(),
              stockId: item.Stock_id,
              itemNo: stockInfo.Stock_no || "",
              barcode: stockInfo.Barcode || "",
              itemName: item.Stock_name || stockInfo.Stock_name || `ID: ${item.Stock_id}`,
              quantity: qty,
              originalQty: qty, // Store original qty for stock calculation
              mrp: mrp,
              discount: disc,
              saleAmount: amount,
              taxableAmount: taxableAmount,
              cgst: cgstPer,
              sgst: sgstPer,
              cgstAmount: cgstAmount,
              sgstAmount: sgstAmount,
              rowTotalAmount: taxableAmount + cgstAmount + sgstAmount
            };
          });
          setItemsList(mappedItems);
          setShowSaleTable(false);
        } else {
          toast.warn("No items found for this transaction");
        }
      } catch (error) {
        console.error("Edit fetch error:", error);
        toast.error("Failed to fetch details for editing");
      } finally {
        setIsLoading(false);
      }
    };
    fetchToEdit();
  };

  const handlePrintReceipt = (saleData = null) => {
    // If saleData is null, use current form data and itemsList
    const isPastSale = !!saleData;
    const master = isPastSale ? saleData[0] : {
      branch: localStorage.getItem("branch"),
      customerName: formData.customerName,
      Sale_date: localStorage.getItem("loginDate") || new Date().toISOString(),
      Final_amt: parseFloat(totals.grandTotal),
      Total_Quantity: itemsList.reduce((sum, i) => sum + i.quantity, 0),
      Sale_id: formData.saleId || "NEW",
      Narr: "Sale Transaction"
    };

    const items = isPastSale ? saleData : itemsList.map(item => ({
      Stock_name: item.itemName,
      Quantity: item.quantity,
      MRP: item.mrp,
      Rate: item.mrp - item.discount,
      Amount: item.saleAmount
    }));

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const html = `
      <html>
        <head>
          <title>Sales Receipt - ${master.Sale_id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .shop-name { font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .sub-header { font-size: 14px; color: #666; }
            .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 15px; }
            .bill-info div span { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #dee2e6; }
            .text-end { text-align: right; }
            .totals { float: right; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .words { clear: both; margin-top: 50px; font-style: italic; border-top: 1px solid #eee; padding-top: 10px; }
            .footer { margin-top: 100px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="shop-name">${master.branch || localStorage.getItem("branch")}</h1>
            <p class="sub-header">Quality Products & Excellent Service</p>
          </div>
          
          <div class="bill-info">
            <div>
              <p><span>Customer:</span> ${master.customerName || master.Card_no || 'Walk-in Customer'}</p>
              <p><span>Bill No:</span> #${master.Sale_id}</p>
            </div>
            <div class="text-end">
              <p><span>Date:</span> ${new Date(master.Sale_date).toLocaleDateString("en-GB")}</p>
              <p><span>Time:</span> ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Item Description</th>
                <th class="text-end">Qty</th>
                <th class="text-end">Rate</th>
                <th class="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.Stock_name || findStockName(item.Stock_id)}</td>
                  <td class="text-end">${item.Quantity}</td>
                  <td class="text-end">₹${parseFloat(item.Rate || (item.MRP - (item.Disc || 0))).toFixed(2)}</td>
                  <td class="text-end">₹${parseFloat(item.Amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Total Items:</span> <span>${items.length}</span></div>
            <div class="total-row"><span>Total Qty:</span> <span>${master.Total_Quantity || master.Total_quantity || items.reduce((s, i) => s + Number(i.Quantity), 0)}</span></div>
            <div class="grand-total total-row">
              <span>Grand Total:</span>
              <span>₹${parseFloat(master.Final_amt).toFixed(2)}</span>
            </div>
          </div>

          <div class="words">
            Amount in words: <strong>${numberToWords(Math.round(master.Final_amt))}</strong>
          </div>

          <div class="footer">
            <div class="signature">Customer Signature</div>
            <div class="signature">Authorized Signatory</div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [id]: val };

      // Auto-populate when Item No or Barcode is entered
      if (id === "barcode" || id === "itemNo") {
        const found = stockList.find(s =>
          (id === "barcode" && s.Barcode === val) ||
          (id === "itemNo" && s.Stock_no.toString() === val)
        );
        if (found) {
          updated.itemName = found.Stock_name;
          updated.stockId = found.Stock_id;
          updated.mrp = found.MRP || 0;
          updated.itemNo = found.Stock_no;
          updated.barcode = found.Barcode;
          updated.cgst = parseFloat(found.CGST_per) || 0;
          updated.sgst = parseFloat(found.SGST_per) || 0;
          updated.discount = parseFloat(found.Discount) || 0;
          const stockVal = found.Current_Stock !== undefined ? found.Current_Stock : found.current_stock;
          updated.currentStock = getEffectiveStock(found.Stock_id, stockVal);
        }
      }

      // Validation for quantity
      if (id === "quantity") {
        const qty = parseFloat(val) || 0;
        const effectiveStock = parseFloat(updated.currentStock) || 0;
        if (qty > effectiveStock) {
          toast.warning(`Quantity cannot exceed available stock (${effectiveStock})`);
          updated.quantity = effectiveStock.toString();
        }
      }

      // Filter stock list when Item Name is typed
      if (id === "itemName") {
        if (val.length > 1) {
          const filtered = stockList.filter(s =>
            s.Stock_name.toLowerCase().includes(val.toLowerCase())
          );
          setFilteredStock(filtered);
        } else {
          setFilteredStock([]);
        }
      } else if (id !== "itemName") {
        setFilteredStock([]);
      }

      // Auto-calculation for the item entry row
      if (["quantity", "mrp", "discount", "cgst", "sgst", "isIGST", "barcode", "itemNo"].includes(id)) {
        const qty = parseFloat(updated.quantity) || 0;
        const mrp = parseFloat(updated.mrp) || 0;
        const discAmt = parseFloat(updated.discount) || 0;
        const cgstPct = parseFloat(updated.cgst) || 0;
        const sgstPct = parseFloat(updated.sgst) || 0;

        const saleAmt = qty * mrp;
        let taxableAmt = 0;
        let cgstAmt = 0;
        let sgstAmt = 0;

        if (qty > 0) {
          const totalDiscAmt = discAmt * qty;
          taxableAmt = saleAmt - totalDiscAmt;
          cgstAmt = (taxableAmt * cgstPct) / 100;
          sgstAmt = (taxableAmt * sgstPct) / 100;
        }

        updated.saleAmount = saleAmt.toFixed(2);
        updated.taxableAmount = taxableAmt.toFixed(2);
        updated.cgstAmount = cgstAmt.toFixed(2);
        updated.sgstAmount = sgstAmt.toFixed(2);
        updated.rowTotalAmount = (taxableAmt + cgstAmt + sgstAmt).toFixed(2);
      }

      return updated;
    });
  };

  const selectStockItem = (item) => {
    console.log("Selected Item Object:", item);
    const qty = "0";
    const mrp = item.MRP || 0;

    const rawStock = item.Current_Stock !== undefined ? item.Current_Stock : item.current_stock;
    const effectiveStock = getEffectiveStock(item.Stock_id, rawStock);

    setFormData(prev => ({
      ...prev,
      itemNo: item.Stock_no,
      barcode: item.Barcode,
      itemName: item.Stock_name,
      stockId: item.Stock_id,
      quantity: qty,
      mrp: mrp,
      discount: parseFloat(item.Discount) || 0,
      cgst: parseFloat(item.CGST_per) || 0,
      sgst: parseFloat(item.SGST_per) || 0,
      currentStock: effectiveStock,
      saleAmount: "0.00",
      taxableAmount: "0.00",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      rowTotalAmount: "0.00",
    }));
    setFilteredStock([]);
  };

  const handleSaveSale = async () => {
    if (itemsList.length === 0) {
      toast.error("Please add items to the sale list");
      return;
    }

    try {
      setIsLoading(true);
      const storedOutlet = localStorage.getItem("Outlet_id");
      const storedEmp = localStorage.getItem("Emp_id");
      const storedYear = localStorage.getItem("Year_Id");

      if (!storedOutlet || !storedEmp) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const outletId = parseInt(storedOutlet);
      const empId = parseInt(storedEmp);
      const yearId = parseInt(storedYear) || 1; // Year can have a safe fallback if needed
      const userName = localStorage.getItem("username") || "TRT";
      const loginDate = localStorage.getItem("loginDate") || new Date().toISOString().split("T")[0];

      // Aggregate totals from itemsList for the master section
      const totalQty = itemsList.reduce((sum, item) => sum + item.quantity, 0);
      const totalMrpAmt = itemsList.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
      const totalDiscAmt = itemsList.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
      const totalCgstAmt = itemsList.reduce((sum, item) => sum + item.cgstAmount, 0);
      const totalSgstAmt = itemsList.reduce((sum, item) => sum + item.sgstAmount, 0);
      const totalIgstAmt = 0; // Assuming IGST is 0 for now
      const totalTaxableAmt = itemsList.reduce((sum, item) => sum + item.taxableAmount, 0);

      const saleData = {
        Outlet_id: outletId,
        Sale_date: loginDate,
        Counter_id: 3, // Fixed or retrieved from context
        Pavati_no: 3, // Bill number (Pavati) logic needed
        Emp_id: empId,
        State_id: 3, // Fixed as per sample
        Card_no: "Check 3", // Fixed or from form
        Total_quantity: totalQty,
        Total_Rate_amt: totalMrpAmt,
        Total_disc: totalDiscAmt,
        Total_SGST: totalSgstAmt,
        Total_CGST: totalCgstAmt,
        Total_IGST: totalIgstAmt,
        Round_off: parseFloat(formData.roundOff) || 0,
        Final_amt: parseFloat(totals.grandTotal),
        Receive_cash: parseFloat(formData.cashReceived),
        Return_cash: parseFloat(totals.cashReturn),
        UPI_AMT: parseFloat(formData.paymentUPI) || 0,
        Taxable_amt: totalTaxableAmt,
        CashTrans: "C",
        Sale_CashTrans: "CS",
        Narr: "Sale Entry check",
        User: userName,
        Status: "1",
        Year_id: yearId,
        Trans_type_id: formData.saleId ? 2 : 1,
        trans_code: "S",
        Cust_id: 1,
        Sale_id: formData.saleId || 0, // Use formData.saleId for updates, 0 for new transactions
        ...((formData.saleId) && {
          update_Sale_id: formData.saleId,
          update_trans_id: formData.saleId,
          Modify_reason: "Sale Updated",
          txt: 2
        }),
        CGST_id: 3,
        SGST_id: 3,
        IGST_id: 3,
        Roundoff_id: 4,
        Transfer_id: 5,
        Cash_return_id_cr: 6,
        Cash_return_id_dr: 7,
        Items: itemsList.map(item => ({
          Stock_id: item.stockId,
          Quantity: item.quantity,
          MRP: item.mrp,
          Disc: item.discount,
          Rate: item.mrp - item.discount, // Rate per item after discount
          Amount: (item.mrp - item.discount) * item.quantity,
          Taxable_amt: item.taxableAmount,
          CGST_per: item.cgst,
          SGST_per: item.sgst,
          IGST_per: 0,
          CGST_amt: item.cgstAmount,
          SGST_amt: item.sgstAmount,
          IGST_amt: 0,
          Mode: 1
        }))
      };

      let response;
      if (formData.saleId) {
        response = await updateStockSale(saleData);
      } else {
        response = await insertStockSale(saleData);
      }

      if (response.status === 200 || response.status === 201 || (response.data && response.data.success)) {
        toast.success(formData.saleId ? "Sale updated successfully!" : "Sale saved successfully!");
        setItemsList([]);
        setFormData(prev => ({
          ...prev,
          customerName: "",
          cashReceived: "0",
          paymentUPI: "0",
          roundOff: "0",
          id: null,
          saleId: null,
          originalQty: null,
          itemName: "",
          stockId: null,
          quantity: "0",
          mrp: "",
          discount: "0",
          saleAmount: "0.00",
          taxableAmount: "0.00",
          cgstAmount: "0.00",
          sgstAmount: "0.00",
          rowTotalAmount: "0.00",
          currentStock: 0,
        }));
        // Refresh stock after successful sale
        fetchStock();
      } else {
        toast.error("Failed to save sale");
      }
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error("Error saving sale");
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    if (!formData.itemName || !formData.quantity || !formData.mrp) {
      toast.error("Please fill Item Name, Quantity and MRP");
      return;
    }

    const newItem = {
      id: formData.id || Date.now(),
      stockId: formData.stockId,
      itemNo: formData.itemNo,
      barcode: formData.barcode,
      itemName: formData.itemName,
      quantity: parseFloat(formData.quantity) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      discount: parseFloat(formData.discount) || 0,
      saleAmount: parseFloat(formData.saleAmount) || 0,
      taxableAmount: parseFloat(formData.taxableAmount) || 0,
      cgst: parseFloat(formData.cgst) || 0,
      sgst: parseFloat(formData.sgst) || 0,
      rowTotalAmount: parseFloat(formData.rowTotalAmount) || 0,
      cgstAmount: parseFloat(formData.cgstAmount) || 0,
      sgstAmount: parseFloat(formData.sgstAmount) || 0,
      originalQty: formData.originalQty || 0, // Preserve originalQty if it exists
    };

    if (formData.id) {
      setItemsList((prev) => prev.map(item => item.id === formData.id ? newItem : item));
    } else {
      setItemsList((prev) => [...prev, newItem]);
    }

    // Reset item entry fields only
    setFormData((prev) => ({
      ...prev,
      id: null,
      originalQty: null,
      itemNo: "",
      barcode: "",
      itemName: "",
      stockId: null,
      quantity: "",
      mrp: "",
      discount: "0",
      saleAmount: "0.00",
      taxableAmount: "0.00",
      cgst: "0",
      sgst: "0",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      rowTotalAmount: "0.00",
      currentStock: 0,
    }));
  };

  const removeItem = (index) => {
    setItemsList((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Derived Calculations (Totals) ---
  const totals = useMemo(() => {
    const totalQty = itemsList.reduce((sum, item) => sum + item.quantity, 0);
    const totalDiscount = itemsList.reduce((sum, item) => sum + item.discount, 0);
    const totalAmountItems = itemsList.reduce((sum, item) => sum + item.rowTotalAmount, 0);

    const grandTotal = totalAmountItems + (parseFloat(formData.roundOff) || 0);
    const cashReceived = parseFloat(formData.cashReceived) || 0;
    const upiAmount = parseFloat(formData.paymentUPI) || 0;
    const totalPaid = cashReceived + upiAmount;

    // Only calculate return if there is a bill amount
    const cashReturn = (grandTotal > 0 && totalPaid > grandTotal) ? totalPaid - grandTotal : 0;
    const balanceDue = (grandTotal > 0 && totalPaid < grandTotal) ? grandTotal - totalPaid : 0;

    return {
      totalQty,
      totalDiscount: totalDiscount.toFixed(2),
      totalAmountItems: totalAmountItems.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      cashReturn: cashReturn.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
    };
  }, [itemsList, formData.roundOff, formData.cashReceived, formData.paymentUPI]);

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Qty", accessor: "quantity" },
    { label: "MRP", accessor: "mrp", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Disc", accessor: "discount", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Taxable", accessor: "taxableAmount", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Total", accessor: "rowTotalAmount", render: (val) => `₹${val.toFixed(2)}` },
  ];

  const transactionColumns = [
    { label: "Sale ID", accessor: "Sale_id" },
    { label: "Date", accessor: "Sale_date", render: (val) => new Date(val).toLocaleDateString("en-GB") },
    { label: "Total Qty", accessor: "Total_Quantity" },
    { label: "Final Amount", accessor: "Final_amt", render: (val) => `₹${val.toFixed(2)}` },
    { label: "Cash Trans", accessor: "CashTrans" },
    {
      label: "View",
      accessor: "Sale_id",
      render: (val, row, index) => (
        <button className="btn btn-sm btn-primary py-0" onClick={() => handleViewSale(index)}>
          <i className="bi bi-eye me-1"></i>View
        </button>
      )
    },
  ];

  const SaleDetailsModal = () => {
    if (!selectedSaleDetails || selectedSaleDetails.length === 0) return null;

    // In the flat array structure, master info is repeated in every row
    const master = selectedSaleDetails[0];
    const details = selectedSaleDetails;

    return (
      <div className="modal d-block shadow-lg" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 overflow-hidden">
            <div className="modal-header text-white border-0" style={{ backgroundColor: "#1e293b" }}>
              <h5 className="modal-title fw-bold">Transaction Details # {master.Sale_id}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
            </div>
            <div className="modal-body p-4 bg-light">
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">Sale Date</label>
                  <span className="fw-medium">{new Date(master.Sale_date).toLocaleDateString("en-GB")}</span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">Narrative</label>
                  <span className="fw-medium small">{master.Narr || 'N/A'}</span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">Item Count</label>
                  <span className="fw-medium">{details.length} Items</span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">Grand Total</label>
                  <span className="fw-bold text-primary h5">₹{master.Final_amt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="table-responsive rounded-3 shadow-sm border bg-white mb-3">
                <table className="table table-sm table-hover mb-0 text-center" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>MRP</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((item, i) => (
                      <tr key={i}>
                        <td className="text-start ps-3">{findStockName(item.Stock_id)}</td>
                        <td>{item.Quantity}</td>
                        <td>₹{item.MRP?.toFixed(2)}</td>
                        <td>₹{item.Rate?.toFixed(2)}</td>
                        <td className="fw-bold">₹{item.Amount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end gap-5 p-2 bg-white rounded-3 border">
                <div className="small fw-bold text-primary">Bill Final Total: ₹{master.Final_amt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="modal-footer border-top-0 bg-light">
              <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setShowDetailsModal(false)}>Close</button>
              <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => handlePrintReceipt(selectedSaleDetails)}>
                <i className="bi bi-printer me-2"></i>Print Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-3" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>

      <div className="card shadow border-0 rounded-4 overflow-hidden mb-4">
        {/* --- Header: Mocked Labels --- */}
        <div className="card-header border-0 text-white p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b" }}>
          <div className="d-flex gap-4 small fw-bold">
            <span><i className="bi bi-shop me-2"></i>Counter: <span className="text-warning">{formData.counterNo}</span></span>
            <span><i className="bi bi-person-badge me-2"></i>Employee: <span className="text-warning">{formData.employeeName}</span></span>
            <span><i className="bi bi-clock me-2"></i>Logged In: <span className="text-warning">{formData.loginTime}</span></span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={() => {
              if (!showSaleTable) fetchTransactions();
              setShowSaleTable(!showSaleTable);
            }}>
              <i className={`bi ${showSaleTable ? 'bi-plus-circle' : 'bi-list-ul'} me-2`}></i>
              {showSaleTable ? "New Sale Entry" : "Show Sale List"}
            </button>
            <h5 className="mb-0 fw-bold">Stock Sale</h5>
          </div>
        </div>

        <div className="card-body p-4">
          {showSaleTable ? (
            <div className="animate__animated animate__fadeIn">
              <CommonTable
                columns={transactionColumns}
                data={saleTransactions}
                showActions={true}
                onEdit={(_, rowIndex) => handleEditSale(rowIndex)}
                onDelete={(_, rowIndex) => handleDeleteSale(rowIndex)}
                onSearchChange={setSearchTransaction}
                searchValue={searchTransaction}
                onClose={() => setShowSaleTable(false)}
              />
            </div>
          ) : (
            <>
              {/* --- Master Row: Customer & IGST --- */}
              <div className="row g-3 mb-4 pb-3 border-bottom align-items-center">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted">Customer Name</label>
                  <div className="input-group input-group-sm shadow-sm">
                    <span className="input-group-text bg-white"><i className="bi bi-person"></i></span>
                    <input type="text" id="customerName" className="form-control" value={formData.customerName} onChange={handleInputChange} placeholder="Walk-in Customer" />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-check form-switch mt-4">
                    <input className="form-check-input" type="checkbox" id="isIGST" checked={formData.isIGST} onChange={handleInputChange} />
                    <label className="form-check-label small fw-bold text-muted" htmlFor="isIGST">IGST Enabled</label>
                  </div>
                </div>
              </div>

              {/* --- Item Entry Section --- */}
              <div className="bg-white p-3 rounded-4 shadow-sm border mb-4" style={{ borderLeft: "4px solid #3b82f6" }}>
                <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-plus-circle-fill me-2"></i>Add Item</h6>
                {/* Entry Row 1 */}
                <div className="row g-2 mb-3">
                  <div className="col-md-2">
                    <label className="form-label x-small fw-bold">Item No</label>
                    <input type="text" id="itemNo" className="form-control form-control-sm" value={formData.itemNo} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label x-small fw-bold">Barcode</label>
                    <input type="text" id="barcode" className="form-control form-control-sm" value={formData.barcode} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-8 position-relative">
                    <label className="form-label x-small fw-bold">Item Name</label>
                    <div className="input-group input-group-sm">
                      <input type="text" id="itemName" className="form-control" value={formData.itemName} onChange={handleInputChange} placeholder="Search item..." autoComplete="off" />
                      <button className="btn btn-outline-secondary" type="button"><i className="bi bi-search"></i></button>
                    </div>
                    {filteredStock.length > 0 && (
                      <ul className="list-group position-absolute w-100 shadow-lg z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredStock.map((item) => (
                          <li
                            key={item.Stock_id}
                            className="list-group-item list-group-item-action small py-2 d-flex justify-content-between cursor-pointer"
                            onClick={() => selectStockItem(item)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span>{item.Stock_name}</span>
                            <span className="badge bg-primary rounded-pill">Stock: {item.Stock_unit}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {/* Entry Row 2 */}
                <div className="row g-2 align-items-end">
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label x-small fw-bold mb-0">Qty</label>
                      <span className="x-small fw-bold text-white bg-primary px-2 rounded-pill shadow-sm">
                        Stock: {formData.stockId ? formData.currentStock : '-'}
                      </span>
                    </div>
                    <input type="number" id="quantity" className="form-control form-control-sm text-center fw-bold text-primary" value={formData.quantity} onChange={handleInputChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold">MRP</label>
                    <input type="number" id="mrp" className="form-control form-control-sm text-end" value={formData.mrp} onChange={handleInputChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold">Disc (Amt)</label>
                    <input type="number" id="discount" className="form-control form-control-sm text-center text-danger" value={formData.discount} onChange={handleInputChange} />
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold text-success">Taxable</label>
                    <div className="form-control form-control-sm fw-bold bg-light text-end">₹{formData.taxableAmount}</div>
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold text-muted">CGST ({formData.cgst}%)</label>
                    <div className="form-control form-control-sm bg-light text-end">₹{formData.cgstAmount}</div>
                  </div>
                  <div className="col">
                    <label className="form-label x-small fw-bold text-muted">SGST ({formData.sgst}%)</label>
                    <div className="form-control form-control-sm bg-light text-end">₹{formData.sgstAmount}</div>
                  </div>
                  <div className="col-md-2">
                    <div className="small fw-bold text-primary mb-1 text-end" style={{ fontSize: '10px' }}>Row Total: ₹{formData.rowTotalAmount}</div>
                    <button type="button" className={`btn ${formData.id ? 'btn-success' : 'btn-primary'} btn-sm fw-bold w-100 shadow-sm`} onClick={addItem}>
                      <i className={`bi ${formData.id ? 'bi-check-circle' : 'bi-cart-plus'} me-2`}></i>{formData.id ? 'Update Item' : 'Add to List'}
                    </button>
                  </div>
                </div>
              </div>

              {/* --- Items List Table --- */}
              <div className="mb-4 shadow-sm rounded-4 overflow-hidden border">
                <CommonTable
                  columns={columns}
                  data={itemsList}
                  showActions={true}
                  onDelete={(_, idx) => removeItem(idx)}
                  onEdit={(item) => {
                    const rawStock = getStockValueFromStore(item.stockId);
                    setFormData(prev => ({
                      ...prev,
                      ...item,
                      currentStock: getEffectiveStock(item.stockId, rawStock)
                    }));
                  }}
                  showSearch={false}
                />
              </div>

              {/* --- Bottom Summary & Payments --- */}
              <div className="row g-4 pt-3">
                {/* Left: Summary Totals */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                    <div className="card-body">
                      <h6 className="fw-bold mb-3 border-bottom pb-2 text-secondary"><i className="bi bi-graph-up me-2"></i>Sale Summary</h6>
                      <div className="d-flex justify-content-between mb-2 small text-muted">
                        <span>Total Quantity:</span>
                        <span className="fw-bold text-dark">{totals.totalQty}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2 small text-muted">
                        <span>Total Discount:</span>
                        <span className="fw-bold text-danger">- ₹{totals.totalDiscount}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3 text-muted">
                        <span className="fw-bold">Total Amount:</span>
                        <span className="fw-bold text-dark h6">₹{totals.totalAmountItems}</span>
                      </div>
                      <div className="row g-2 align-items-center mt-2">
                        <div className="col-6 small fw-bold text-muted">Round Off:</div>
                        <div className="col-6">
                          <input type="number" id="roundOff" className="form-control form-control-sm text-end fw-bold" value={formData.roundOff} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Payments */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-3 border-bottom pb-2 text-success"><i className="bi bi-cash-stack me-2"></i>Payment Details</h6>
                      
                      {/* Cash Section */}
                      <div className="mb-3 p-3 border rounded bg-white shadow-sm">
                        <label className="form-label x-small fw-bold text-success text-uppercase mb-2">Cash Section</label>
                        <div className="mb-2">
                          <label className="form-label x-small fw-bold text-muted mb-1">Receive Cash</label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-success bg-opacity-10 border-success text-success">₹</span>
                            <input type="number" id="cashReceived" className="form-control fw-bold border-success text-success" value={formData.cashReceived} onChange={handleInputChange} />
                          </div>
                        </div>
                        {(parseFloat(totals.cashReturn) > 0 || parseFloat(formData.cashReceived) > (parseFloat(totals.grandTotal) - (parseFloat(formData.paymentUPI) || 0))) && (
                          <div className="mb-0 animate__animated animate__fadeIn">
                            <label className="form-label x-small fw-bold text-muted mb-1">Return Cash</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-warning bg-opacity-10 border-warning text-dark">₹</span>
                              <input type="text" className="form-control fw-bold bg-light border-warning" value={totals.cashReturn} readOnly />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* UPI Section */}
                      <div className="mb-3 p-3 border rounded bg-white shadow-sm">
                        <label className="form-label x-small fw-bold text-primary text-uppercase mb-2">UPI / Online Section</label>
                        <div className="mb-2">
                          <label className="form-label x-small fw-bold text-muted mb-1">UPI Amount</label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-primary bg-opacity-10 border-primary text-primary"><i className="bi bi-qr-code"></i></span>
                            <input type="number" id="paymentUPI" className="form-control fw-bold border-primary text-primary" value={formData.paymentUPI} onChange={handleInputChange} />
                          </div>
                        </div>
                      </div>

                      {/* Payment Status Badges */}
                      {parseFloat(totals.balanceDue) > 0 && (
                        <div className="bg-danger bg-opacity-10 p-2 rounded border border-danger d-flex justify-content-between align-items-center mb-2 animate__animated animate__headShake">
                          <span className="small fw-bold text-danger">Balance Due:</span>
                          <span className="h6 mb-0 fw-bold text-danger">₹{totals.balanceDue}</span>
                        </div>
                      )}

                      {parseFloat(totals.grandTotal) > 0 && parseFloat(totals.cashReturn) === 0 && parseFloat(totals.balanceDue) === 0 && (
                        <div className="bg-primary bg-opacity-10 p-2 rounded border border-primary d-flex justify-content-between align-items-center animate__animated animate__pulse">
                          <span className="small fw-bold text-primary">Payment Status:</span>
                          <span className="h6 mb-0 fw-bold text-primary">Full Paid</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Bill Action */}
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-lg text-white" style={{ backgroundColor: "#3b82f6" }}>
                    <div className="card-body text-center d-flex flex-column justify-content-center">
                      <span className="small fw-bold text-uppercase opacity-75">Total Bill Amount</span>
                      <h1 className="fw-bold mb-4">₹{totals.grandTotal}</h1>
                      <div className="d-grid gap-2">
                        <button className="btn btn-light fw-bold py-2" onClick={handleSaveSale} disabled={itemsList.length === 0 || isLoading}>
                          <i className="bi bi-check-circle-fill me-2"></i>
                          {isLoading ? 'Saving...' : formData.saleId ? 'Update Sale' : 'Save Sale'}
                        </button>
                        <button className="btn btn-outline-light fw-bold py-2" onClick={() => handlePrintReceipt()} disabled={itemsList.length === 0}>
                          <i className="bi bi-printer me-2"></i>Print Receipt
                        </button>
                        <button className="btn btn-link text-white text-decoration-none small mt-2 opacity-75" onClick={() => {
                          if (window.confirm("Are you sure you want to cancel? All items will be removed.")) {
                            setItemsList([]);
                            setFormData(prev => ({ ...prev, saleId: null }));
                          }
                        }}>Cancel Transaction</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showDetailsModal && <SaleDetailsModal />}

      <style>{`
        .x-small { font-size: 0.7rem; }
        .bg-light-subtle { background-color: #f1f5f9 !important; }
        .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.15rem rgba(59, 130, 246, 0.25);
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .form-check-input:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default Stocksale;