<!-- This document serves as a comprehensive reference for all backend API endpoints. It must be updated whenever a new API is added or an existing one is modified. -->

# API Documentation

This document provides a reference for the backend API endpoints used by the `sachiv-mitra-sale-client`.

## 📍 Base URL
The base URL is configured via the `VITE_APIURL` environment variable.

---

## 👥 Customer API
Endpoints for managing customer data.

- **`GET /api/Customer`**: Retrieve all customers.
- **`GET /api/CustomerByAccountNo?Cust_no={no}`**: Retrieve a customer by account number.
- **`POST /api/Customer`**: Add a new customer.
- **`PUT /api/Customer`**: Update an existing customer.
- **`DELETE /api/DelCustomer`**: Delete a customer (Payload required).

---

## 💰 Ledger API
Endpoints for financial ledger management.

- **`GET /api/Ledger`**: Retrieve all ledgers.
- **`GET /api/Ledger?L_no={no}`**: Retrieve a ledger by number.
- **`GET /api/LedgerBalance`**: Retrieve ledger balances.
- **`POST /api/LedgerBalance`**: Save a new ledger balance.
- **`PUT /api/LedgerBalance`**: Update a ledger balance.
- **`POST /api/DelLedgerBalance`**: Delete a ledger balance.

---

## 📦 Stock & Inventory API
Endpoints for stock and product management.

- **`GET /api/StockBalance`**: Retrieve all stock balances.
- **`GET /api/StockBalance?Bal_id={id}`**: Retrieve a specific stock balance.
- **`POST /api/StockBalance`**: Create a new stock balance.
- **`PUT /api/StockBalance`**: Update a stock balance.
- **`POST /api/DelStockBalance`**: Delete a stock balance.

---

## 🧾 Voucher API
Endpoints for transaction vouchers.

- **`GET /api/VoucherTrans?Trans_id={id}&Login_Date={date}`**: Retrieve transaction details by ID and date.
- **`GET /api/VoucherDetail?Trans_id={id}`**: Retrieve detailed voucher line items.
- **`POST /api/DelVoucher`**: Delete a voucher.

---

## 🔧 System & Configuration API
Endpoints for system settings, users, and location data.

- **`POST /api/loginUser`**: Authenticate a user.
- **`POST /api/getUserRole`**: Get the role for a user.
- **`GET /api/UserLogin`**: Retrieve all system users.
- **`POST /api/UserLogin`**: Save a new system user.
- **`PUT /api/UserLogin`**: Update a system user.
- **`POST /api/DelUserLogin`**: Delete a system user.

- **`GET /api/State`**: Retrieve list of states.
- **`GET /api/Dist`**: Retrieve list of districts.
- **`GET /api/Taluka`**: Retrieve list of talukas.
- **`GET /api/City`**: Retrieve list of cities.

- **`GET /api/Unit`**: Retrieve all units.
- **`POST /api/Unit`**: Add a new unit.
- **`PUT /api/Unit`**: Update a unit.
- **`POST /api/DelUnit`**: Delete a unit.
