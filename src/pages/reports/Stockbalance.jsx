import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommonTable from "../../components/navigation/CommonTable";
import {
    getStockDetails,
    getStockBalance,
    addStockBalance,
    updateStockBalance,
    deleteStockBalance,
} from "../../services/reports/stockBalance";

function StockEntry() {
    const username = localStorage.getItem("username") || "UnknownUser";

    const [formData, setFormData] = useState({
        stockNo: "",
        stockName: "",
        quantity: "",
    });

    const [stockList, setStockList] = useState([]);
    const [data, setData] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [searchName, setSearchName] = useState("");

    const columns = [
        {
            label: "Stock No",
            render: (val, row) => row.Stock_id,
        },
        {
            label: "Stock Name",
            render: (val, row) => {
                const stock = stockList.find((s) => s.Stock_id === row.Stock_id);
                return stock?.Stock_name || "-";
            },
        },
        {
            label: "Quantity",
            render: (val, row) => row.Quantity,
        },
    ];

    const fetchStock = async () => {
        try {
            const stockRes = await getStockDetails();
            setStockList(
                stockRes.data.map((s) => ({ Stock_id: s.Stock_id, Stock_name: s.Stock_name }))
            );

            const balanceRes = await getStockBalance();
            setData(balanceRes.data);


        } catch (err) {
            toast.error("API not connected");
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "stockNo") {
            const stock = stockList.find((s) => s.Stock_id == value);
            setFormData({
                ...formData,
                stockNo: Number(value),
                stockName: stock ? stock.Stock_name : "",
            });
        } else if (name === "stockName") {
            const stock = stockList.find((s) => s.Stock_name === value);
            setFormData({
                ...formData,
                stockNo: stock ? Number(stock.Stock_id) : 0,
                stockName: value,
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleClear = () => {
        setFormData({ stockNo: "", stockName: "", quantity: "" });
        setEditIndex(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.stockNo) return toast.error("Please enter Stock No");
        if (!formData.quantity) return toast.error("Please enter Quantity");

        const payload = {
            Bal_id: editIndex !== null ? data[editIndex].Bal_id : 0,
            Stock_id: Number(formData.stockNo),
            Quantity: Number(formData.quantity),
            Amount: Number(formData.quantity),
            Created_By: username,
            Modified_By: username,
        };

        try {
            if (editIndex !== null) {
                await updateStockBalance(payload);
                toast.success("Record updated successfully");
            } else {
                await addStockBalance(payload);
                toast.success("Record saved successfully");
            }

            handleClear();
            fetchStock();
        } catch (err) {
            toast.error(err.response?.data || "API error");
            console.error(err);
        }
    };

    const handleEdit = (index) => {
        const item = data[index];
        const stock = stockList.find((s) => s.Stock_id == item.Stock_id);

        setFormData({
            stockNo: item.Stock_id,
            stockName: stock ? stock.Stock_name : "",
            quantity: item.Quantity,
        });

        setEditIndex(index);
        setShowTable(false);

        toast.info("Record ready for edit");
    };

    const handleDelete = async (index) => {
        try {
            const payload = { Bal_id: data[index].Bal_id, Modified_By: username };
            await deleteStockBalance(payload);
            toast.success("Record deleted successfully");
            fetchStock();
        } catch (err) {
            toast.error(err.response?.data || "API error");
            console.error(err);
        }
    };

    const filteredData = data.filter((d) => {
        const stockName = stockList.find((s) => s.Stock_id == d.Stock_id)?.Stock_name || "";
        return stockName.toLowerCase().includes(searchName.toLowerCase());
    });

    return (
        <div className="container my-1" style={{ fontSize: "14px" }}>
            <div
                className="bg-white p-4 rounded shadow mx-auto"
                style={{ maxWidth: "700px" }}
            >
                <div
                    className="text-white rounded mb-0 p-2 text-center"
                    style={{ backgroundColor: "#365b80" }}
                >
                    <h5 className="mb-0 fw-semibold">Stock Balance</h5>
                </div>

                {!showTable ? (
                    <form onSubmit={handleSubmit}>
                        <div className="row g-2 mt-3 align-items-end">

                            {/* Stock */}
                            <div className="col-md-2">
                                <label className="form-label" style={{ marginBottom: "2px" }}>Stock No</label>
                                <input
                                    type="number"
                                    name="stockNo"
                                    className="form-control form-control-sm"
                                    style={{ width: "120px" }}
                                    value={formData.stockNo}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Stock Name Select */}
                            <div className="col-md-3" style={{ width: "280px", marginLeft: "20PX" }}>
                                <label className="form-label" style={{ marginBottom: "2px" }}>Stock Name</label>
                                <select
                                    name="stockName"
                                    className="form-select form-select-sm"
                                    value={formData.stockName}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Stock</option>

                                    {stockList.map((s) => (
                                        <option key={s.Stock_id} value={s.Stock_name}>
                                            {s.Stock_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div className="col-md-2" style={{ marginLeft: "25px" }}>
                                <label className="form-label" style={{ marginBottom: "2px" }}>Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    className="form-control form-control-sm"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                        {/* Buttons */}
                        <div className="text-center mt-4 d-flex justify-content-center gap-2">
                            <button type="submit" className="button-save" style={{ fontSize: "14px" }}>
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
                                onClick={() => {
                                    fetchStock();
                                    setShowTable(true);
                                }}
                            >
                                Show List
                            </button>
                        </div>
                    </form>
                ) : <div style={{ paddingTop: "5px" }}>
                    <CommonTable
                        columns={columns}
                        data={filteredData}
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
                </div>}
            </div>
        </div>
    );
}

export default StockEntry;
