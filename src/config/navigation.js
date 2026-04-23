export const navigationConfig = [
  {
    title: "Dashboard",
    icon: "bi bi-speedometer2",
    path: "/dashboard",
  },
  {
    title: "Master",
    icon: "bi bi-database",
    submenu: [
      { title: "Customer Info", path: "/customer-info" },
      { title: "Employee Info", path: "/user-info" },
      { title: "Supplier Info", path: "/supplierinfo" },
      {
        title: "Address",
        icon: "bi bi-geo-alt",
        submenu: [
          { title: "State", path: "/state" },
          { title: "District", path: "/district" },
          { title: "Taluka", path: "/taluka" },
          { title: "City", path: "/city" },
        ],
      },
      {
        title: "Balance",
        icon: "bi bi-cash-stack",
        submenu: [
          { title: "Ledger Balance", path: "/balance", icon: "bi bi-cash" },
          { title: "Supplier Balance", path: "/supplierbalance", icon: "bi bi-cash-coin" },
          { title: "Stock Balance", path: "/stockbalance", icon: "bi bi-wallet" },
        ],
      },
    ],
  },
  {
    title: "Transaction",
    icon: "bi bi-receipt",
    submenu: [
      { title: "Voucher", path: "/voucher" },
      { title: "Stock Purchase", path: "/stockpurchase" },
      { title: "Stock Distribution", path: "/stockdistribution" },
      { title: "Stock Sales", path: "/stocksales" },
      { title: "Purchase Return", path: "/purchasereturn" },
      { title: "Sales Return", path: "/salesreturn" },
    ],
  },
  {
    title: "Setting",
    icon: "bi bi-gear-fill",
    submenu: [
      { title: "Society", path: "/society" },
      { title: "Outlet", path: "/outlet" },
      { title: "User Setting", path: "/user-setting" },
      { title: "Year Setting", path: "/year-setting" },
      { title: "Bank Account", path: "/bankaccountinfo" },
      { title: "Counter", path: "/counter" },
      { title: "Assign Counter", path: "/assign-counter" },
      { title: "Rate Change", path: "/ratechange" },
      {
        title: "Ledger",
        icon: "bi bi-journal-text",
        submenu: [
          { title: "Ledger", path: "/ledger", icon: "bi bi-journal-text" },
          { title: "Ledger Group", path: "/ledger-group", icon: "bi bi-collection" },
          { title: "Ledger SubGroup", path: "/ledger-subgroup", icon: "bi bi-diagram-3" },
          { title: "Ledger Setting", path: "/ledger-setting", icon: "bi bi-gear" },
        ],
      },
      {
        title: "Stock Setting",
        icon: "bi bi-archive",
        submenu: [
          { title: "Stock Group", path: "/stockgroup", icon: "bi bi-archive" },
          { title: "Stock Subgroup", path: "/stocksubgroup", icon: "bi bi-layers" },
          { title: "GST Slab", path: "/gstslab", icon: "bi bi-percent" },
          { title: "Stock Details", path: "/stockdetails", icon: "bi bi-box" },
        ],
      },
    ],
  },
  {
    title: "Utility",
    icon: "bi bi-tools",
    submenu: [
      { title: "Role", path: "/role-master" },
      { title: "Prefix", path: "/prefix" },
      { title: "Unit", path: "/unit" },
    ],
  },
  {
    title: "Barcode",
    icon: "bi bi-upc-scan",
    path: "/barcode",
  },
  {
    title: "Counter Close",
    icon: "bi bi-box-arrow-right",
    path: "/counterclose",
  },
  {
    title: "Day Close",
    icon: "bi bi-calendar-check",
    path: "/dayclose",
  },
];
