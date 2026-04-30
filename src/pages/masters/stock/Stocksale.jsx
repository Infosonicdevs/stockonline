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
  updateStockSale,
} from "../../../services/masters/stock/stocksale";

// --- Utility: Convert Number to Indian Rupee Words ---
const numberToWords = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Elin login even ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if ((num = num.toString()).length > 9) return "Overflow";
  let n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
      : "";
  return str ? str + "Rupees Only" : "Zero Rupees";
};

const Stocksale = () => {
  // --- Unified State for Form Data (Master + Current Item Entry + Payments) ---
  const [formData, setFormData] = useState({
    // Master Info
    isIGST: false,
    customerName: "",

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
    const stock = stockList.find((s) => s.Stock_id === id);
    return stock ? stock.Stock_name : `ID: ${id}`;
  };

  const getStockValueFromStore = (stockId) => {
    const stockItem = stockList.find(
      (s) => Number(s.Stock_id) === Number(stockId)
    );
    if (!stockItem) return 0;
    const val =
      stockItem.Current_Stock !== undefined
        ? stockItem.Current_Stock
        : stockItem.current_stock;
    return parseFloat(val) || 0;
  };

  const getEffectiveStock = (stockId, baseStock) => {
    // Aggressively find the stock value
    let base = 0;
    if (typeof baseStock === "number") base = baseStock;
    else if (baseStock) base = parseFloat(baseStock) || 0;

    let effective = base;

    // If in edit mode, add back the quantity already in this specific sale
    if (formData.saleId && itemsList.length > 0) {
      const existingItem = itemsList.find(
        (item) => Number(item.stockId) === Number(stockId)
      );
      if (existingItem) {
        const qtyToAdd = parseFloat(existingItem.originalQty) || 0;
        effective += qtyToAdd;
      }
    }
    console.log(
      `getEffectiveStock: id=${stockId}, base=${base}, effective=${effective}`
    );
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
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;
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

    setFormData((prev) => ({
      ...prev,
      pavatiNo: sale.Pavati_no || "",
      customerName: sale.Card_no === "Check 3" ? "" : sale.Card_no || "",
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
          const mappedItems = items.map((item) => {
            const stockInfo =
              stockList.find((s) => s.Stock_id === item.Stock_id) || {};

            const qty = Math.max(0, parseFloat(item.Quantity) || 0);
            const mrp = parseFloat(item.MRP) || stockInfo.MRP || 0;
            const rate =
              parseFloat(item.Rate) || parseFloat(item.Amount) / qty || 0;
            const amount = parseFloat(item.Amount) || rate * qty;

            // If properties are missing in Details API, use Stock master values as defaults
            const cgstPer = item.CGST_per ?? stockInfo.CGST_per ?? 0;
            const sgstPer = item.SGST_per ?? stockInfo.SGST_per ?? 0;
            const disc = item.Disc ?? mrp - rate;

            const taxableAmount = item.Taxable_amt ?? amount;
            const cgstAmount = item.CGST_amt ?? (taxableAmount * cgstPer) / 100;
            const sgstAmount = item.SGST_amt ?? (taxableAmount * sgstPer) / 100;

            return {
              id: Date.now() + Math.random(),
              stockId: item.Stock_id,
              itemNo: stockInfo.Stock_no || "",
              barcode: stockInfo.Barcode || "",
              itemName:
                item.Stock_name ||
                stockInfo.Stock_name ||
                `ID: ${item.Stock_id}`,
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
              rowTotalAmount: taxableAmount + cgstAmount + sgstAmount,
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
    const master = isPastSale
      ? saleData[0]
      : {
          branch: localStorage.getItem("branch"),
          customerName: formData.customerName,
          Sale_date:
            localStorage.getItem("loginDate") || new Date().toISOString(),
          Final_amt: parseFloat(totals.grandTotal),
          Total_Quantity: itemsList.reduce((sum, i) => sum + i.quantity, 0),
          Sale_id: formData.saleId || "NEW",
          Narr: "Sale Transaction",
        };

    const items = isPastSale
      ? saleData
      : itemsList.map((item) => ({
          Stock_name: item.itemName,
          Quantity: item.quantity,
          MRP: item.mrp,
          Rate: item.mrp - item.discount,
          Amount: item.saleAmount,
        }));

    const printWindow = window.open("", "_blank", "width=800,height=600");
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
            <h1 class="shop-name">${
              master.branch || localStorage.getItem("branch")
            }</h1>
            <p class="sub-header">Quality Products & Excellent Service</p>
          </div>
          
          <div class="bill-info">
            <div>
              <p><span>Customer:</span> ${
                master.customerName || master.Card_no || "Walk-in Customer"
              }</p>
              <p><span>Bill No:</span> #${master.Sale_id}</p>
            </div>
            <div class="text-end">
              <p><span>Date:</span> ${new Date(
                master.Sale_date
              ).toLocaleDateString("en-GB")}</p>
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
              ${items
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.Stock_name || findStockName(item.Stock_id)}</td>
                  <td class="text-end">${item.Quantity}</td>
                  <td class="text-end">₹${parseFloat(
                    item.Rate || item.MRP - (item.Disc || 0)
                  ).toFixed(2)}</td>
                  <td class="text-end">₹${parseFloat(item.Amount).toFixed(
                    2
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Total Items:</span> <span>${
              items.length
            }</span></div>
            <div class="total-row"><span>Total Qty:</span> <span>${
              master.Total_Quantity ||
              master.Total_quantity ||
              items.reduce((s, i) => s + Number(i.Quantity), 0)
            }</span></div>
            <div class="grand-total total-row">
              <span>Grand Total:</span>
              <span>₹${parseFloat(master.Final_amt).toFixed(2)}</span>
            </div>
          </div>

          <div class="words">
            Amount in words: <strong>${numberToWords(
              Math.round(master.Final_amt)
            )}</strong>
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
        const found = stockList.find(
          (s) =>
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
          const stockVal =
            found.Current_Stock !== undefined
              ? found.Current_Stock
              : found.current_stock;
          updated.currentStock = getEffectiveStock(found.Stock_id, stockVal);
        }
      }

      // Validation for quantity
      if (id === "quantity") {
        const qty = parseFloat(val) || 0;
        if (qty < 0) {
          updated.quantity = "0";
        } else {
          const effectiveStock = Math.abs(parseFloat(updated.currentStock)) || 0;
          if (qty > effectiveStock) {
            toast.warning(
              `Quantity cannot exceed available stock (${effectiveStock})`
            );
            updated.quantity = effectiveStock.toString();
          }
        }
      }

      // Filter stock list when Item Name is typed
      if (id === "itemName") {
        if (val.length > 1) {
          const filtered = stockList.filter((s) =>
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
      if (
        [
          "quantity",
          "mrp",
          "discount",
          "cgst",
          "sgst",
          "isIGST",
          "barcode",
          "itemNo",
        ].includes(id)
      ) {
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

    const rawStock =
      item.Current_Stock !== undefined
        ? item.Current_Stock
        : item.current_stock;
    const effectiveStock = getEffectiveStock(item.Stock_id, rawStock);

    setFormData((prev) => ({
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
      const loginDate =
        localStorage.getItem("loginDate") ||
        new Date().toISOString().split("T")[0];

      // Aggregate totals from itemsList for the master section
      const totalQty = itemsList.reduce((sum, item) => sum + item.quantity, 0);
      const totalMrpAmt = itemsList.reduce(
        (sum, item) => sum + item.mrp * item.quantity,
        0
      );
      const totalDiscAmt = itemsList.reduce(
        (sum, item) => sum + item.discount * item.quantity,
        0
      );
      const totalCgstAmt = itemsList.reduce(
        (sum, item) => sum + item.cgstAmount,
        0
      );
      const totalSgstAmt = itemsList.reduce(
        (sum, item) => sum + item.sgstAmount,
        0
      );
      const totalIgstAmt = 0; // Assuming IGST is 0 for now
      const totalTaxableAmt = itemsList.reduce(
        (sum, item) => sum + item.taxableAmount,
        0
      );

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
        ...(formData.saleId && {
          update_Sale_id: formData.saleId,
          update_trans_id: formData.saleId,
          Modify_reason: "Sale Updated",
          txt: 2,
        }),
        CGST_id: 3,
        SGST_id: 3,
        IGST_id: 3,
        Roundoff_id: 4,
        Transfer_id: 5,
        Cash_return_id_cr: 6,
        Cash_return_id_dr: 7,
        Items: itemsList.map((item) => ({
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
          Mode: 1,
        })),
      };

      let response;
      if (formData.saleId) {
        response = await updateStockSale(saleData);
      } else {
        response = await insertStockSale(saleData);
      }

      if (
        response.status === 200 ||
        response.status === 201 ||
        (response.data && response.data.success)
      ) {
        toast.success(
          formData.saleId
            ? "Sale updated successfully!"
            : "Sale saved successfully!"
        );
        setItemsList([]);
        setFormData((prev) => ({
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
    const qty = parseFloat(formData.quantity) || 0;
    if (!formData.itemName || !formData.quantity || !formData.mrp) {
      toast.error("Please fill Item Name, Quantity and MRP");
      return;
    }

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
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
      setItemsList((prev) =>
        prev.map((item) => (item.id === formData.id ? newItem : item))
      );
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
    const totalDiscount = itemsList.reduce(
      (sum, item) => sum + item.discount,
      0
    );
    const totalAmountItems = itemsList.reduce(
      (sum, item) => sum + item.rowTotalAmount,
      0
    );

    const grandTotal = totalAmountItems + (parseFloat(formData.roundOff) || 0);
    const cashReceived = parseFloat(formData.cashReceived) || 0;
    const upiAmount = parseFloat(formData.paymentUPI) || 0;
    const totalPaid = cashReceived + upiAmount;

    // Only calculate return if there is a bill amount
    const cashReturn =
      grandTotal > 0 && totalPaid > grandTotal ? totalPaid - grandTotal : 0;
    const balanceDue =
      grandTotal > 0 && totalPaid < grandTotal ? grandTotal - totalPaid : 0;

    return {
      totalQty,
      totalDiscount: totalDiscount.toFixed(2),
      totalAmountItems: totalAmountItems.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      cashReturn: cashReturn.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
    };
  }, [
    itemsList,
    formData.roundOff,
    formData.cashReceived,
    formData.paymentUPI,
  ]);

  const columns = [
    { label: "Item No", accessor: "itemNo" },
    { label: "Barcode", accessor: "barcode" },
    { label: "Item Name", accessor: "itemName" },
    { label: "Qty", accessor: "quantity" },
    { label: "MRP", accessor: "mrp", render: (val) => `₹${val.toFixed(2)}` },
    {
      label: "Disc",
      accessor: "discount",
      render: (val) => `₹${val.toFixed(2)}`,
    },
    {
      label: "Taxable",
      accessor: "taxableAmount",
      render: (val) => `₹${val.toFixed(2)}`,
    },
    {
      label: "Total",
      accessor: "rowTotalAmount",
      render: (val) => `₹${val.toFixed(2)}`,
    },
  ];

  const transactionColumns = [
    { label: "Sale ID", accessor: "Sale_id" },
    {
      label: "Date",
      accessor: "Sale_date",
      render: (val) => new Date(val).toLocaleDateString("en-GB"),
    },
    { label: "Total Qty", accessor: "Total_Quantity" },
    {
      label: "Final Amount",
      accessor: "Final_amt",
      render: (val) => `₹${val.toFixed(2)}`,
    },
    { label: "Cash Trans", accessor: "CashTrans" },
    {
      label: "View",
      accessor: "Sale_id",
      render: (val, row, index) => (
        <button
          className="btn btn-sm btn-primary py-0"
          onClick={() => handleViewSale(index)}
        >
          <i className="bi bi-eye me-1"></i>View
        </button>
      ),
    },
  ];

  const SaleDetailsModal = () => {
    if (!selectedSaleDetails || selectedSaleDetails.length === 0) return null;

    // In the flat array structure, master info is repeated in every row
    const master = selectedSaleDetails[0];
    const details = selectedSaleDetails;

    return (
      <div
        className="modal d-block shadow-lg"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 overflow-hidden">
            <div
              className="modal-header text-white border-0"
              style={{ backgroundColor: "#1e293b" }}
            >
              <h5 className="modal-title fw-bold">
                Transaction Details # {master.Sale_id}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowDetailsModal(false)}
              ></button>
            </div>
            <div className="modal-body p-4 bg-light">
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">
                    Sale Date
                  </label>
                  <span className="fw-medium">
                    {new Date(master.Sale_date).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">
                    Narrative
                  </label>
                  <span className="fw-medium small">
                    {master.Narr || "N/A"}
                  </span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">
                    Item Count
                  </label>
                  <span className="fw-medium">{details.length} Items</span>
                </div>
                <div className="col-md-3">
                  <label className="x-small fw-bold text-muted d-block">
                    Grand Total
                  </label>
                  <span className="fw-bold text-primary h5">
                    ₹
                    {master.Final_amt?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="table-responsive rounded-3 shadow-sm border bg-white mb-3">
                <table
                  className="table table-sm table-hover mb-0 text-center"
                  style={{ fontSize: "13px" }}
                >
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
                        <td className="text-start ps-3">
                          {findStockName(item.Stock_id)}
                        </td>
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
                <div className="small fw-bold text-primary">
                  Bill Final Total: ₹
                  {master.Final_amt?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer border-top-0 bg-light">
              <button
                type="button"
                className="btn btn-secondary px-4 fw-bold"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 fw-bold"
                onClick={() => handlePrintReceipt(selectedSaleDetails)}
              >
                <i className="bi bi-printer me-2"></i>Print Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="vh-100 d-flex flex-column overflow-hidden bg-light pos-container">
      {/* --- Page Header --- */}
      <div className="pos-header d-flex justify-content-between align-items-center px-3 text-white shadow-sm" style={{ backgroundColor: "#1e293b", minHeight: "50px" }}>
        <h6 className="mb-0 fw-bold d-flex align-items-center">
          <i className="bi bi-receipt-cutoff me-2 fs-5"></i>
          STOCK SALE POS
        </h6>
        <div className="d-flex align-items-center gap-3">
           <div className="d-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded-pill small border border-white border-opacity-25">
             <i className="bi bi-calendar3 me-2"></i>
             <span>{localStorage.getItem("loginDate") ? new Date(localStorage.getItem("loginDate")).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")}</span>
           </div>
           <button
             className="btn btn-warning btn-sm fw-bold shadow-sm py-1 px-3"
             onClick={() => {
               if (!showSaleTable) fetchTransactions();
               setShowSaleTable(!showSaleTable);
             }}
           >
             <i className={`bi ${showSaleTable ? "bi-plus-circle" : "bi-list-ul"} me-2`}></i>
             {showSaleTable ? "New Sale Entry" : "Show Sale List"}
           </button>
        </div>
      </div>

      <div className="d-flex flex-grow-1 overflow-hidden">
        {showSaleTable ? (
          /* --- Transaction List View (Full Screen) --- */
          <div className="flex-grow-1 p-3 overflow-auto bg-white animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0">RECENT SALES TRANSACTIONS</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowSaleTable(false)}>
                <i className="bi bi-arrow-left me-2"></i>Back to Sale
              </button>
            </div>
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
          /* --- Main POS Entry Area (Horizontal Layout) --- */
          <div className="flex-grow-1 d-flex flex-column overflow-hidden">
            {/* Customer & Master Info Row */}
            <div className="bg-white border-bottom p-2 d-flex align-items-center gap-4">
               <div style={{ minWidth: "250px" }}>
                  <div className="input-group input-group-sm border rounded bg-light">
                    <span className="input-group-text bg-transparent border-0"><i className="bi bi-person text-muted"></i></span>
                    <input
                      type="text"
                      id="customerName"
                      className="form-control border-0 bg-transparent fw-medium"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Customer Name"
                    />
                  </div>
               </div>
               <div className="d-flex align-items-center gap-2">
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="isIGST" checked={formData.isIGST} onChange={handleInputChange} />
                    <label className="form-check-label x-small fw-bold text-muted" htmlFor="isIGST">IGST</label>
                  </div>
               </div>
               <div className="ms-auto d-flex gap-2 align-items-center">
                  <span className="x-small fw-bold text-muted">SALES ID:</span>
                  <span className="badge bg-dark text-white px-3">{formData.saleId || "NEW"}</span>
               </div>
            </div>

            {/* Item Entry Row - High Density Horizontal */}
            <div className="bg-white border-bottom p-2 shadow-sm z-1">
              <div className="row gx-1 gy-0 align-items-end">
                <div className="col-md-1">
                  <label className="x-small fw-bold text-muted mb-0">ITEM NO</label>
                  <input type="text" id="itemNo" className="form-control form-control-sm border-0 bg-light" value={formData.itemNo} onChange={handleInputChange} />
                </div>
                <div className="col-md-2">
                  <label className="x-small fw-bold text-muted mb-0">BARCODE</label>
                  <input type="text" id="barcode" className="form-control form-control-sm border-0 bg-light" value={formData.barcode} onChange={handleInputChange} placeholder="Scan barcode..." />
                </div>
                <div className="col-md-2 position-relative">
                  <label className="x-small fw-bold text-muted mb-0">ITEM NAME</label>
                  <input type="text" id="itemName" className="form-control form-control-sm border-0 bg-light" value={formData.itemName} onChange={handleInputChange} placeholder="Type product name..." autoComplete="off" />
                  {filteredStock.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow-lg z-3 border-0" style={{ maxHeight: "300px", overflowY: "auto", top: "100%" }}>
                      {filteredStock.map((item) => (
                        <li key={item.Stock_id} className="list-group-item list-group-item-action x-small py-2 d-flex justify-content-between cursor-pointer border-bottom" onClick={() => selectStockItem(item)}>
                          <span>{item.Stock_name}</span>
                          <span className="badge bg-primary-subtle text-primary rounded-pill">Qty: {item.Stock_unit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="col-md-1">
                  <div className="d-flex justify-content-between">
                    <label className="x-small fw-bold text-muted mb-0">QTY</label>
                    <span className="x-small text-primary fw-bold">{formData.stockId ? `S:${formData.currentStock}` : ""}</span>
                  </div>
                  <input type="number" id="quantity" min="1" className="form-control form-control-sm text-center fw-bold border-primary border-opacity-25" value={formData.quantity} onChange={handleInputChange} />
                </div>
                <div className="col-md-1">
                  <label className="x-small fw-bold text-muted mb-0">MRP</label>
                  <input type="number" id="mrp" className="form-control form-control-sm text-end border-0 bg-light" value={formData.mrp} onChange={handleInputChange} />
                </div>
                <div className="col-md-1">
                  <label className="x-small fw-bold text-muted mb-0">DISC</label>
                  <input type="number" id="discount" className="form-control form-control-sm text-center border-0 bg-light text-danger" value={formData.discount} onChange={handleInputChange} />
                </div>
                <div className="col-md-1">
                  <label className="x-small fw-bold text-muted mb-0">TOTAL</label>
                  <div className="form-control form-control-sm bg-light-subtle border-0 text-end fw-bold">₹{formData.rowTotalAmount}</div>
                </div>
                <div className="col-md-2">
                  <button type="button" className={`btn ${formData.id ? "btn-success" : "btn-primary"} btn-sm fw-bold w-100 shadow-sm py-1`} onClick={addItem}>
                    <i className={`bi ${formData.id ? "bi-check-circle" : "bi-cart-plus"} me-1`}></i>
                    {formData.id ? "UPDATE" : "ADD ITEM"}
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container - Flexible height with restricted max-height to fit ~5 items */}
            <div className="overflow-auto bg-white border-bottom custom-scrollbar" style={{ minHeight: "220px", maxHeight: "250px" }}>
              <table className="table table-sm table-hover mb-0 pos-table">
                <thead className="bg-light sticky-top shadow-xs">
                  <tr>
                    <th className="ps-3" style={{ width: "50px" }}>#</th>
                    <th style={{ width: "100px" }}>Item No</th>
                    <th>Item Description</th>
                    <th className="text-center" style={{ width: "80px" }}>Qty</th>
                    <th className="text-end" style={{ width: "100px" }}>MRP</th>
                    <th className="text-end" style={{ width: "100px" }}>Discount</th>
                    <th className="text-end" style={{ width: "100px" }}>Taxable</th>
                    <th className="text-end" style={{ width: "120px" }}>Amount</th>
                    <th className="text-center" style={{ width: "100px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsList.map((item, idx) => (
                    <tr key={item.id} className="align-middle">
                      <td className="ps-3 text-muted x-small">{idx + 1}</td>
                      <td className="x-small">{item.itemNo}</td>
                      <td className="small fw-medium">{item.itemName}</td>
                      <td className="text-center fw-bold">{item.quantity}</td>
                      <td className="text-end">₹{item.mrp.toFixed(2)}</td>
                      <td className="text-end text-danger">₹{item.discount.toFixed(2)}</td>
                      <td className="text-end">₹{item.taxableAmount.toFixed(2)}</td>
                      <td className="text-end fw-bold text-primary">₹{item.rowTotalAmount.toFixed(2)}</td>
                      <td className="text-center">
                        <div className="btn-group btn-group-xs">
                          <button className="btn btn-light btn-xs p-1" onClick={() => {
                            const rawStock = getStockValueFromStore(item.stockId);
                            setFormData(prev => ({
                              ...prev,
                              ...item,
                              currentStock: getEffectiveStock(item.stockId, rawStock),
                            }));
                          }}><i className="bi bi-pencil text-primary"></i></button>
                          <button className="btn btn-light btn-xs p-1" onClick={() => removeItem(idx)}><i className="bi bi-trash text-danger"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {itemsList.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted small">
                         <i className="bi bi-cart-x d-block fs-2 opacity-25 mb-2"></i>
                         Your cart is empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Action Bar: Totals & Payments */}
            <div className="bg-white p-3 border-top shadow-lg-reverse z-1 flex-grow-1">
              <div className="row g-3 h-100">
                 {/* Summary Totals */}
                 <div className="col-md-3">
                    <div className="bg-light p-3 rounded border h-100 d-flex flex-column justify-content-between shadow-sm">
                      <div className="d-flex justify-content-between x-small mb-2">
                        <span className="text-muted fw-bold">Items Count:</span>
                        <span className="fw-bold">{itemsList.length}</span>
                      </div>
                      <div className="d-flex justify-content-between x-small mb-2">
                        <span className="text-muted fw-bold">Total Qty:</span>
                        <span className="fw-bold">{totals.totalQty}</span>
                      </div>
                      <div className="d-flex justify-content-between x-small mb-2 text-danger">
                        <span className="fw-bold">Total Discount:</span>
                        <span className="fw-bold">- ₹{totals.totalDiscount}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                        <span className="x-small fw-bold">Round Off:</span>
                        <input type="number" id="roundOff" className="form-control form-control-xs text-end fw-bold" style={{ width: "80px" }} value={formData.roundOff} onChange={handleInputChange} />
                      </div>
                    </div>
                 </div>

                 {/* Payment Inputs */}
                 <div className="col-md-5">
                   <div className="bg-light p-3 rounded border h-100 shadow-sm">
                      <div className="row g-3">
                         <div className="col-6">
                            <label className="x-small fw-bold text-success mb-2 text-uppercase">Cash Received</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-success bg-opacity-10 text-success border-success">₹</span>
                              <input type="number" id="cashReceived" className="form-control fw-bold text-success border-success" value={formData.cashReceived} onChange={handleInputChange} />
                            </div>
                         </div>
                         <div className="col-6">
                            <label className="x-small fw-bold text-primary mb-2 text-uppercase">UPI / Online</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-primary bg-opacity-10 text-primary border-primary"><i className="bi bi-qr-code"></i></span>
                              <input type="number" id="paymentUPI" className="form-control fw-bold text-primary border-primary" value={formData.paymentUPI} onChange={handleInputChange} />
                            </div>
                         </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                         {parseFloat(totals.cashReturn) > 0 ? (
                           <div className="badge bg-warning text-dark border border-warning px-3 py-2 shadow-sm">
                              RETURN: ₹{totals.cashReturn}
                           </div>
                         ) : parseFloat(totals.balanceDue) > 0 ? (
                           <div className="badge bg-danger-subtle text-danger border border-danger px-3 py-2 shadow-sm">
                              DUE: ₹{totals.balanceDue}
                           </div>
                         ) : totals.grandTotal > 0 ? (
                           <div className="badge bg-success text-white px-3 py-2 shadow-sm">PAID FULL</div>
                         ) : <div></div>}
                         
                         <div className="text-muted x-small italic text-end" style={{ maxWidth: "200px" }}>{numberToWords(Math.round(totals.grandTotal))}</div>
                      </div>
                   </div>
                 </div>

                 {/* Grand Total & Final Actions */}
                 <div className="col-md-4">
                    <div className="bg-primary text-white p-3 rounded shadow d-flex align-items-center justify-content-between h-100">
                      <div className="text-start">
                        <div className="x-small opacity-75 fw-bold text-uppercase mb-1">Grand Total</div>
                        <h2 className="mb-0 fw-bold">₹{totals.grandTotal}</h2>
                      </div>
                      <div className="d-flex flex-column gap-2" style={{ width: "160px" }}>
                        <button className="btn btn-light fw-bold py-2 shadow-sm" onClick={handleSaveSale} disabled={itemsList.length === 0 || isLoading}>
                          <i className="bi bi-check2-circle me-1"></i> {isLoading ? "SAVING..." : (formData.saleId ? "UPDATE" : "SAVE")}
                        </button>
                        <button className="btn btn-outline-light btn-sm fw-bold py-1" onClick={() => handlePrintReceipt()} disabled={itemsList.length === 0}>
                          <i className="bi bi-printer me-1"></i> PRINT
                        </button>
                        <button className="btn btn-link btn-sm text-white py-0 x-small text-decoration-none opacity-75" onClick={() => {
                           if (window.confirm("Cancel this transaction?")) {
                              setItemsList([]);
                              setFormData(prev => ({ ...prev, saleId: null }));
                           }
                        }}>CANCEL SALE</button>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && <SaleDetailsModal />}

      <style>{`
        .pos-container { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9 !important; }
        .x-small { font-size: 0.75rem; }
        .btn-xs { padding: 0.1rem 0.3rem; font-size: 0.75rem; }
        .form-control-xs { height: 28px; padding: 0.125rem 0.25rem; font-size: 0.75rem; }
        .bg-light-subtle { background-color: #f8fafc !important; }
        .pos-table th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.6rem 0.4rem; color: #64748b; background-color: #f8fafc; }
        .pos-table td { padding: 0.35rem 0.4rem; font-size: 0.8rem; border-color: #f1f5f9; }
        .sticky-top { top: 0; z-index: 10; }
        .shadow-xs { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .shadow-lg-reverse { box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .cursor-pointer { cursor: pointer; }
        .pos-header { z-index: 1020; }
        .list-group-item-action:hover { background-color: #f8fafc; }
        .animate__slideInLeft { --animate-duration: 0.3s; }
      `}</style>
    </div>
  );
};

export default Stocksale;
