import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import CustomerInfo from "./pages/masters/general/CustomerInfo";
import Layout from "./shared/Layout";
import { ToastContainer } from "react-toastify";
import Dashboard from "./pages/dashboard/Dashboard";
import Ledger from "./pages/masters/ledger/Ledger";
import LedgerGroup from "./pages/masters/ledger/Ledgergroup";
import SubLedgerGroup from "./pages/masters/ledger/SubLedgergroup";
import Userinformation from "./pages/masters/general/Userinformation";
import LedgerSetting from "./pages/masters/ledger/Ledgersetting";
import YearSetting from "./pages/masters/general/Yearsetting";
import State from "./pages/masters/address/State";
import District from "./pages/masters/address/District";
import Taluka from "./pages/masters/address/Taluka";
import City from "./pages/masters/address/City";
import Society from "./pages/masters/general/Society";
import Rolemaster from "./pages/masters/general/Rolemaster";
import Usersetting from "./pages/masters/general/Usersetting";
import LedgerBalance from "./pages/reports/Ledgerbalance";
import Prefix from "./pages/masters/general/Prefix";
import Unit from "./pages/masters/stock/Unit";
import StockEntry from "./pages/reports/Stockbalance";
import Supplierbalance from "./pages/reports/Supplierbalance";
import OutletCenterForm from "./pages/masters/general/Outlet";
import SupplierInfo from "./pages/masters/general/Supplierinfo";
import VoucherForm from "./pages/transactions/VoucherForm";
import StockGroup from "./pages/masters/stock/StockGroup";
import StockSubGroup from "./pages/masters/stock/StockSubGroup";
import StockDetails from "./pages/masters/stock/Stockdetails";
import GstSlab from "./pages/masters/stock/GstSlab";
import BankAccountForm from "./pages/masters/general/Bankaccountinfo";
import Counter from "./pages/masters/general/Counter";
import AssignCounter from "./pages/masters/general/AssignCounter";
import Stockdistribution from "./pages/masters/stock/Stockdistribution";
import Stockpurchase from "./pages/masters/stock/Stockpurchase";
import Stocksale from "./pages/masters/stock/Stocksale";
import Purchasereturn from "./pages/masters/stock/Purchasereturn";
import Salesreturn from "./pages/masters/stock/Salesreturn";
import BarcodeGenerator from "./pages/utility/Barcode";
import Ratechange from "./pages/masters/stock/Ratechange";
import CounterClose from "./pages/masters/general/CounterClose";

function App() {
  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customer-info" element={<CustomerInfo />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/balance" element={<LedgerBalance />} />
            <Route path="/ledger-group" element={<LedgerGroup />} />
            <Route path="/ledger-subgroup" element={<SubLedgerGroup />} />
            <Route path="/ledger-setting" element={<LedgerSetting />} />
            <Route path="/year-setting" element={<YearSetting />} />
            <Route path="/user-info" element={<Userinformation />} />
            <Route path="/state" element={<State />} />
            <Route path="/district" element={<District />} />
            <Route path="/taluka" element={<Taluka />} />
            <Route path="/city" element={<City />} />
            <Route path="/society" element={<Society />} />
            <Route path="/user-setting" element={<Usersetting />} />
            <Route path="/role-master" element={<Rolemaster />} />
            <Route path="/prefix" element={<Prefix />} />
            <Route path="/supplierbalance" element={<Supplierbalance />} />
            <Route path="/stockbalance" element={<StockEntry />} />
            <Route path="/outlet" element={<OutletCenterForm />} />
            <Route path="/supplierinfo" element={<SupplierInfo />} />
            <Route path="/voucher" element={<VoucherForm />} />
            <Route path="/unit" element={<Unit />} />
            <Route path="/voucher" element={<VoucherForm />} />
            <Route path="/stockgroup" element={<StockGroup />} />
            <Route path="/stocksubgroup" element={<StockSubGroup />} />
            <Route path="/stockdetails" element={<StockDetails />} />
            <Route path="/stockdistribution" element={<Stockdistribution />} />
            <Route path="/stockpurchase" element={<Stockpurchase />} />
            <Route path="/stocksales" element={<Stocksale />} />
            <Route path="/gstslab" element={<GstSlab />} />
            <Route path="/bankaccountinfo" element={<BankAccountForm />} />
            <Route path="/counter" element={<Counter />} />
            <Route path="/assign-counter" element={<AssignCounter />} />
            <Route path="/salesreturn" element={<Salesreturn />} />
            <Route path="/purchasereturn" element={<Purchasereturn />} />
            <Route path="/barcode" element={<BarcodeGenerator />} />
            <Route path="/ratechange" element={<Ratechange />} />
            <Route path="/counterclose" element={<CounterClose />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
