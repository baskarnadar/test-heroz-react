 // src/vendordata/activityinfo/activity/ViewActivityScreen.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CButton,
  CBadge,
  CAlert,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
} from "@coreui/react";
import { AppColors } from "../../_shared/colors";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,
} from "../../utils/operation";
import "../../style/paymentv1.css";
import * as XLSX from "xlsx"; // ✅ Excel export

import { API_BASE_URL } from "../../config";

const ts = (fontSize, extra = {}) => ({ fontSize, ...extra }); // kept
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) =>
  Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v);

const escapeHtml = (v) =>
  toStr(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const fmtMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


const useDocDir = () => {
  const [dir, setDir] = React.useState(
    document?.documentElement?.dir || "ltr"
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setDir(document?.documentElement?.dir || "ltr");
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => obs.disconnect();
  }, []);
  return dir;
};

// API endpoint
const get_pay_summary = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

const statusColor = (status) => {
  // kept (even if unused)
  switch ((status || "").toUpperCase()) {
    case "TRIP-BOOKED":
      return "#067f3c";
    case "APPROVED":
      return "#2c4696";
    case "FAILED":
      return "#b91c1c";
    case "NEW":
      return "#6b7280";
    default:
      return "#374151";
  }
};

// class selector for badge colors (no inline styles)
const statusClassName = (status = "") => {
  const s = status.toUpperCase();
  if (s === "TRIP-BOOKED") return "status--trip-booked";
  if (s === "APPROVED") return "status--approved";
  if (s === "FAILED") return "status--failed";
  if (s === "NEW") return "status--new";
  return "status--default";
};

const SectionTitle = ({ children }) => (
  <div className="section-title">{children}</div>
);

const Tile = ({ label, value, mono, style }) => (
  <div className={`tile ${mono ? "mono" : ""}`} style={style}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

const Grid = ({ children }) => <div className="grid">{children}</div>;

// simple helper to force a specific number of columns in one row
const RowGrid = ({ columns, children }) => (
  <div
    className="grid-row"
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: "10px",
      marginBottom: "4px",
    }}
  >
    {children}
  </div>
);

// ---- Helpers for status ----
const isPresentStatus = (status) => {
  const s = (status || "").toString().toLowerCase();
  return s === "present" || s === "approved" || s === "trip-booked";
};

const isAbsentStatus = (status) => {
  const s = (status || "").toString().toLowerCase();
  return s === "absent";
};

// Server → UI
const normalizeItem = (x) => ({
  RequestID: toStr(x.RequestID),
  ActivityID: toStr(x.ActivityID),
  SchoolID: toStr(x.SchoolID),
  actRequestRefNo: toStr(x.actRequestRefNo),
  actName: toStr(x.actName),
  actRequestStatus: toStr(x.actRequestStatus),
  actRequestDate: toStr(x.actRequestDate),
  actRequestTime: toStr(x.actRequestTime),
  studentSummary: {
    totalStudentPaid: Number(x?.studentSummary?.totalStudentPaid ?? 0),
    totalStudentApproved: Number(
      x?.studentSummary?.totalStudentApproved ?? 0
    ),
    totalStudentFailed: Number(x?.studentSummary?.totalStudentFailed ?? 0),
    totalStudentNew: Number(x?.studentSummary?.totalStudentNew ?? 0),
    totalStudentAbsent: Number(
      x?.studentSummary?.totalStudentAbsent ?? 0
    ),
  },
  tripPayment: {
    totalTripVendorCost: Number(
      x?.tripPayment?.totalTripVendorCost ?? 0
    ),
  },
  foodExtrasSummary: {
    totalFoodVendorPrice: Number(
      x?.foodExtrasSummary?.totalFoodVendorPrice ?? 0
    ),
  },
  totalPaymentSummary: {
    totalVendorTripProfit: Number(
      x?.totalPaymentSummary?.totalVendorTripProfit ?? 0
    ),
  },
  // extra info for filters (kept safe if API doesn’t send them)
  vendorID: toStr(x.VendorID),
  vendorName: toStr(x.VendorName || x.vdrName),
  // RAW arrays kept to build kids grid
  payments: Array.isArray(x.payments) ? x.payments : [],
  kidsSummary: Array.isArray(x.KidsSumamry) ? x.KidsSumamry : [],
  parentsInfo: Array.isArray(x.parentsInfo) ? x.parentsInfo : [],
});

// Helper: compute total/present/absent from kids array
const computeKidsPresence = (kidsList = []) => {
  const totalKids = kidsList.length;
  let presentCount = 0;

  kidsList.forEach((kid) => {
    if (isPresentStatus(kid.tripKidsStatus)) {
      presentCount += 1;
    }
  });

  const absentCount = Math.max(0, totalKids - presentCount);
  return { totalKids, presentCount, absentCount };
};

// 🔽🔼 Sortable header
const SortHeader = ({ label, columnKey, sortConfig, onSort }) => {
  const active = sortConfig?.key === columnKey ? sortConfig.direction : null;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        font: "inherit",
        color: "#111827",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          lineHeight: 0.7,
          fontSize: "0.65em",
        }}
      >
        <span style={{ opacity: active === "asc" ? 1 : 0.3 }}>▲</span>
        <span style={{ opacity: active === "desc" ? 1 : 0.3 }}>▼</span>
      </span>
    </button>
  );
};

const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const dir = useDocDir();
  const vendorID = getCurrentLoggedUserID?.() || "";

  // ✅ run vendor login validation on mount
  useEffect(() => {
    IsVendorLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  // 🔍 filters & paging
  const [searchTerm, setSearchTerm] = React.useState("");
  const [vendorFilter, setVendorFilter] = React.useState(""); // kept but hidden from UI
  const [statusFilter, setStatusFilter] = React.useState("");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // sorting (main grid)
  const [sortConfig, setSortConfig] = React.useState({
    key: "",
    direction: "asc",
  });

  // kids rows for current selected record (built from API data)
  const [kids, setKids] = React.useState([]);

  // kids filter + sorting
  const [kidsFilter, setKidsFilter] = React.useState("ALL"); // ALL | PRESENT | ABSENT
  const [kidsSortConfig, setKidsSortConfig] = React.useState({
    key: "",
    direction: "asc",
  });

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        console.log("API:", get_pay_summary);

        const payload = { VendorID: vendorID };
        console.log("API Payload:", payload);

        const res = await fetch(get_pay_summary, {
          method: "POST",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        console.log("API Response:", json);

        if (!res.ok) {
          throw new Error(json?.message || `Request failed: ${res.status}`);
        }

        const arr = Array.isArray(json?.data)
          ? json.data
          : json?.data
          ? [json.data]
          : [];

        const normalized = arr.map(normalizeItem);
        if (!normalized.length) throw new Error("No data returned.");

        if (isMounted) {
          setItems(normalized);
          setSelected(normalized[0]);
        }
      } catch (e) {
        if (isMounted) setError(e.message || "Failed to load data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [vendorID]);

  const buildKidsRows = (row) => {
    if (!row) return [];
    const kidsArr = Array.isArray(row.kidsSummary) ? row.kidsSummary : [];
    const paysArr = Array.isArray(row.payments) ? row.payments : [];

    const map = new Map();

    // Start with kids summary
    kidsArr.forEach((k) => {
      const kidsId = k.KidsID;
      if (!kidsId) return;
      map.set(kidsId, {
        KidsID: kidsId,
        TripKidsSchoolNo: k.TripKidsSchoolNo || "",
        TripKidsName: k.TripKidsName || k.tripKidsName || "",
        tripKidsClassName: k.tripKidsClassName || "",
        tripKidsStatus: k.tripKidsStatus || k.TripKidsStatus || "",
        tripPaymentTypeID: "",
        TripVendorCost: 0,
      });
    });

    // Merge in payment info by KidsID
    paysArr.forEach((p) => {
      const kidsId = p.KidsID;
      if (!kidsId) return;
      const existing = map.get(kidsId) || {
        KidsID: kidsId,
        TripKidsSchoolNo: "",
        TripKidsName: "",
        tripKidsClassName: "",
        tripKidsStatus: "",
        tripPaymentTypeID: "",
        TripVendorCost: 0,
      };
      map.set(kidsId, {
        ...existing,
        tripPaymentTypeID:
          p.tripPaymentTypeID || p.PayTypeID || existing.tripPaymentTypeID,
        TripVendorCost: p.TripVendorCost ?? existing.TripVendorCost,
      });
    });

    return Array.from(map.values());
  };

  const openModalFor = (row) => {
    setSelected(row);
    setShowModal(true);
    setKids(buildKidsRows(row)); // build kids grid directly from current record

    // reset kids filters/sorting on each open
    setKidsFilter("ALL");
    setKidsSortConfig({ key: "", direction: "asc" });
  };

  // unique vendors for dropdown (kept, but UI hidden)
  const vendorOptions = React.useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const id = (it.vendorID || "").trim();
      const name = (it.vendorName || it.vendorID || "").trim();
      const key = id || name;
      if (!key) return;
      if (!map.has(key)) map.set(key, name || key);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  // unique statuses for dropdown
  const statusOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((it) => (it.actRequestStatus || "").trim())
            .filter(Boolean)
        )
      ),
    [items]
  );

  // apply filters
  const filteredItems = React.useMemo(() => {
    // ✅ FIRST: only keep TRIP-BOOKED statuses
    let data = items.filter(
      (it) => (it.actRequestStatus || "").toUpperCase() === "TRIP-BOOKED"
    );

    const t = searchTerm.trim().toLowerCase();
    if (t) {
      data = data.filter((it) => {
        return (
          (it.actRequestRefNo || "").toLowerCase().includes(t) ||
          (it.actName || "").toLowerCase().includes(t) ||
          (it.actRequestDate || "").toLowerCase().includes(t) ||
          (it.actRequestTime || "").toLowerCase().includes(t)
        );
      });
    }

    if (vendorFilter) {
      data = data.filter((it) => {
        const vid = (it.vendorID || it.vendorName || "").toString();
        return vid === vendorFilter;
      });
    }

    if (statusFilter) {
      data = data.filter((it) => (it.actRequestStatus || "") === statusFilter);
    }

    return data;
  }, [items, searchTerm, vendorFilter, statusFilter]);

  // 🔽🔼 apply sorting on filteredItems
  const sortedItems = React.useMemo(() => {
    if (!sortConfig?.key) return filteredItems;

    const arr = [...filteredItems];

    const getSortValue = (item) => {
      switch (sortConfig.key) {
        case "actRequestRefNo":
          return toStr(item.actRequestRefNo);
        case "actName":
          return toStr(item.actName);
        case "actRequestDate": {
          // sort by date; if invalid, use 0
          const d = new Date(item.actRequestDate);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        case "actRequestTime":
          return toStr(item.actRequestTime);
        case "actRequestStatus":
          return toStr(item.actRequestStatus);
        case "studentApproved":
          return Number(item.studentSummary?.totalStudentApproved ?? 0);
        case "studentAbsent":
          return Number(item.studentSummary?.totalStudentAbsent ?? 0);
        case "vendorCost":
          return Number(item.tripPayment?.totalTripVendorCost ?? 0);
        default:
          return 0;
      }
    };

    arr.sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredItems, sortConfig]);

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key: columnKey, direction: nextDir };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  // reset to first page when filters/page size / sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vendorFilter, statusFilter, pageSize, sortConfig]);

  const totalPages = React.useMemo(() => {
    if (!sortedItems.length) return 1;
    return Math.max(1, Math.ceil(sortedItems.length / pageSize));
  }, [sortedItems, pageSize]);

  const pageItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const showingFrom =
    sortedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, sortedItems.length);

  // total of all Vendor Trip Profit across items (kept same for header widget)
  const totalProfitAll = React.useMemo(() => {
    try {
      return items.reduce(
        (sum, it) =>
          sum +
          (Number(it?.totalPaymentSummary?.totalVendorTripProfit) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [items]);

  // total kids TripVendorCost (for current selected) – PRESENT ONLY
  const kidsVendorTotal = React.useMemo(() => {
    try {
      if (!kids || !kids.length) return 0;
      return kids.reduce((sum, kid) => {
        if (isPresentStatus(kid.tripKidsStatus)) {
          return sum + (Number(kid.TripVendorCost) || 0);
        }
        return sum;
      }, 0);
    } catch {
      return 0;
    }
  }, [kids]);

  // ----- Kids filter + sorting -----
  const filteredKids = React.useMemo(() => {
    if (!kids || !kids.length) return [];

    if (kidsFilter === "PRESENT") {
      return kids.filter((k) => isPresentStatus(k.tripKidsStatus));
    }
    if (kidsFilter === "ABSENT") {
      return kids.filter((k) => isAbsentStatus(k.tripKidsStatus));
    }
    return kids;
  }, [kids, kidsFilter]);

  const sortedKids = React.useMemo(() => {
    if (!kidsSortConfig?.key) return filteredKids;

    const arr = [...filteredKids];

    const getVal = (kid) => {
      switch (kidsSortConfig.key) {
        case "TripKidsSchoolNo":
          return toStr(kid.TripKidsSchoolNo);
        case "TripKidsName":
          return toStr(kid.TripKidsName);
        case "tripKidsClassName":
          return toStr(kid.tripKidsClassName);
        case "tripKidsStatus":
          return toStr(kid.tripKidsStatus);
        case "tripPaymentTypeID":
          return toStr(kid.tripPaymentTypeID);
        case "TripVendorCost":
          return Number(kid.TripVendorCost ?? 0);
        default:
          return 0;
      }
    };

    arr.sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (aVal < bVal) return kidsSortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return kidsSortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredKids, kidsSortConfig]);

  const handleKidsSort = (columnKey) => {
    setKidsSortConfig((prev) => {
      if (prev?.key === columnKey) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key: columnKey, direction: nextDir };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  // ✅ Export kids to real Excel (.xlsx)
  const handleExportKids = () => {
    if (!sortedKids || !sortedKids.length) return;

    const dataForExcel = sortedKids.map((kid, index) => ({
      "#": index + 1,
      "School No": kid.TripKidsSchoolNo || "",
      "Kid Name": kid.TripKidsName || "",
      "Class Name": kid.tripKidsClassName || "",
      Status: kid.tripKidsStatus || "",
      "Payment Type": kid.tripPaymentTypeID || "",
      "Trip Vendor Cost": Number(kid.TripVendorCost ?? 0),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kids");

    const ref = selected?.actRequestRefNo || "trip";
    const fileName = `kids_${ref}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const openPrintWindow = (title, bodyHtml, summaryHtml = "") => {
    const win = window.open("", "_blank", "width=1200,height=850");
    if (!win) {
      alert("Please allow popups to export PDF");
      return;
    }

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
            .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 3px solid #a20d86; }
            h1 { margin: 0 0 6px; color: #570457; font-size: 22px; font-weight: 900; }
            .pdf-meta { color: #6b7280; font-size: 12px; line-height: 1.5; }
            .pdf-summary { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
            .pdf-chip { border: 1px solid #f5b6d5; background: #fff0f7; color: #a20d86; border-radius: 12px; padding: 9px 12px; font-size: 12px; font-weight: 800; min-width: 115px; text-align: center; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
            th { background: #570457; color: #ffffff; padding: 8px 6px; border: 1px solid #570457; text-align: left; font-weight: 800; }
            td { padding: 7px 6px; border: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; }
            tr:nth-child(even) td { background: #fff7fb; }
            .status { display: inline-block; border-radius: 999px; padding: 3px 8px; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 9px; }
            .print-note { margin-top: 10px; color: #6b7280; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="pdf-header">
            <div>
              <h1>${escapeHtml(title)}</h1>
              <div class="pdf-meta">Export Date: ${escapeHtml(new Date().toLocaleString())}</div>
            </div>
            <div class="pdf-summary">${summaryHtml}</div>
          </div>
          ${bodyHtml}
          <div class="print-note">Choose Save as PDF from the print dialog.</div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleExportPdf = () => {
    const exportRows = sortedItems || [];
    if (!exportRows.length) {
      alert("No data to export");
      return;
    }

    const totalVendorCost = exportRows.reduce((sum, row) => sum + Number(row?.tripPayment?.totalTripVendorCost || 0), 0);
    const totalPresent = exportRows.reduce((sum, row) => sum + Number(row?.studentSummary?.totalStudentApproved || 0), 0);
    const totalAbsent = exportRows.reduce((sum, row) => sum + Number(row?.studentSummary?.totalStudentAbsent || 0), 0);

    const rowsHtml = exportRows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.actRequestRefNo || "-")}</td>
        <td>${escapeHtml(row.actName || "-")}</td>
        <td>${escapeHtml(row.actRequestDate || "-")}</td>
        <td>${escapeHtml(row.actRequestTime || "-")}</td>
        <td><span class="status">${escapeHtml(row.actRequestStatus || "-")}</span></td>
        <td>${escapeHtml(fmtNum(row.studentSummary?.totalStudentApproved || 0))}</td>
        <td>${escapeHtml(fmtNum(row.studentSummary?.totalStudentAbsent || 0))}</td>
        <td>${escapeHtml(fmtMoney(row.tripPayment?.totalTripVendorCost || 0))}</td>
      </tr>
    `).join("");

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th>Ref No.</th>
            <th>Act Name</th>
            <th>Trip Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Total Present</th>
            <th>Total Absense</th>
            <th>Vendor Cost</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    const summaryHtml = `
      <div class="pdf-chip">Records<br/>${exportRows.length}</div>
      <div class="pdf-chip">Present<br/>${escapeHtml(fmtNum(totalPresent))}</div>
      <div class="pdf-chip">Absent<br/>${escapeHtml(fmtNum(totalAbsent))}</div>
      <div class="pdf-chip">Vendor Cost<br/>${escapeHtml(fmtMoney(totalVendorCost))}</div>
    `;

    openPrintWindow("Trip-Booked Information", bodyHtml, summaryHtml);
  };

  const handleExportKidsPdf = () => {
    if (!sortedKids || !sortedKids.length) {
      alert("No kids information to export");
      return;
    }

    const { totalKids, presentCount, absentCount } = computeKidsPresence(kids);
    const totalCost = sortedKids.reduce((sum, kid) => sum + Number(kid.TripVendorCost || 0), 0);

    const rowsHtml = sortedKids.map((kid, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(kid.TripKidsSchoolNo || "")}</td>
        <td>${escapeHtml(kid.TripKidsName || "-")}</td>
        <td>${escapeHtml(kid.tripKidsClassName || "-")}</td>
        <td><span class="status">${escapeHtml(kid.tripKidsStatus || "-")}</span></td>
        <td>${escapeHtml(kid.tripPaymentTypeID || "-")}</td>
        <td>${escapeHtml(fmtMoney(kid.TripVendorCost || 0))}</td>
      </tr>
    `).join("");

    const bodyHtml = `
      <table>
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th>School No</th>
            <th>Kid Name</th>
            <th>Class Name</th>
            <th>Status</th>
            <th>Payment Type</th>
            <th>Trip Vendor Cost</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    const ref = selected?.actRequestRefNo || "Trip";
    const summaryHtml = `
      <div class="pdf-chip">Total Kids<br/>${escapeHtml(fmtNum(totalKids))}</div>
      <div class="pdf-chip">Present<br/>${escapeHtml(fmtNum(presentCount))}</div>
      <div class="pdf-chip">Absent<br/>${escapeHtml(fmtNum(absentCount))}</div>
      <div class="pdf-chip">Cost<br/>${escapeHtml(fmtMoney(totalCost))}</div>
    `;

    openPrintWindow(`Kids Information - ${ref}`, bodyHtml, summaryHtml);
  };

  const modernTripStyle = `
    .vas-container { padding: 4px; background: linear-gradient(180deg, #fff7fb 0%, #ffffff 45%); }
    .vas-card { border: 1px solid rgba(162, 13, 134, 0.18) !important; border-radius: 22px !important; box-shadow: 0 18px 45px rgba(87, 4, 87, 0.10) !important; overflow: hidden !important; background: rgba(255, 255, 255, 0.96) !important; }
    .vas-card-body { padding: 20px !important; }
    .vas-header { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; margin-bottom: 14px !important; padding: 16px 18px !important; border-radius: 18px !important; background: linear-gradient(135deg, #570457, #a20d86) !important; color: #ffffff !important; box-shadow: 0 14px 30px rgba(162, 13, 134, 0.20) !important; }
    .vas-header .title-main { color: #ffffff !important; font-size: 22px !important; font-weight: 950 !important; letter-spacing: -0.03em !important; }
    .vas-filters { background: #ffffff !important; border: 1px solid rgba(162, 13, 134, 0.14) !important; border-radius: 18px !important; padding: 14px !important; box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06) !important; }
    .vas-filters label { font-size: 12px !important; font-weight: 900 !important; color: #111827 !important; }
    .admin-txt-box { min-height: 42px !important; border-radius: 14px !important; border: 1px solid #d9dde5 !important; background: #ffffff !important; outline: none !important; transition: all 160ms ease !important; }
    .admin-txt-box:focus { border-color: #a20d86 !important; box-shadow: 0 0 0 4px rgba(162, 13, 134, 0.10) !important; }
    .trip-pdf-btn, .trip-view-btn, .trip-close-btn { border: 0 !important; border-radius: 999px !important; font-weight: 900 !important; box-shadow: 0 9px 20px rgba(162, 13, 134, 0.18) !important; }
    .trip-pdf-btn { min-height: 42px !important; padding: 8px 18px !important; background: linear-gradient(135deg, #570457, #a20d86) !important; color: #ffffff !important; }
    .trip-view-btn { min-width: 88px !important; background: #a20d86 !important; color: #ffffff !important; }
    .trip-close-btn { background: #f3f4f6 !important; color: #111827 !important; box-shadow: none !important; }
    .trip-view-btn:hover, .trip-pdf-btn:hover { filter: brightness(0.96); color: #ffffff !important; }
    .table-responsive, .vas-card table { border-radius: 16px !important; overflow: hidden !important; }
    .vas-card table { border: 1px solid #edf0f5 !important; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05) !important; }
    .vas-card thead th { background: #fff7fb !important; color: #111827 !important; font-size: 12px !important; font-weight: 950 !important; padding: 12px 10px !important; border-bottom: 1px solid rgba(162, 13, 134, 0.12) !important; white-space: nowrap !important; }
    .vas-card tbody td { padding: 11px 10px !important; vertical-align: middle !important; border-bottom: 1px solid #eef1f5 !important; color: #111827 !important; }
    .row-clickable { transition: all 160ms ease !important; }
    .row-clickable:hover { background: #fff7fb !important; transform: translateY(-1px); box-shadow: inset 4px 0 0 #a20d86 !important; }
    .status-badge { border-radius: 999px !important; padding: 6px 10px !important; font-size: 11px !important; font-weight: 950 !important; letter-spacing: 0.02em !important; }
    .modern-modal .modal-content { border: 0 !important; border-radius: 24px !important; overflow: hidden !important; box-shadow: 0 28px 70px rgba(15, 23, 42, 0.28) !important; background: #fffafd !important; }
    .modern-modal-header { background: linear-gradient(135deg, #570457, #a20d86) !important; color: #ffffff !important; border: 0 !important; padding: 20px 22px !important; }
    .modern-modal-title { color: #ffffff !important; font-size: 21px !important; font-weight: 950 !important; letter-spacing: -0.02em !important; }
    .modern-modal-header .btn-close { filter: invert(1) grayscale(100%) brightness(200%) !important; opacity: 0.9 !important; }
    .modern-modal-body { padding: 18px !important; background: linear-gradient(180deg, #fff7fb 0%, #ffffff 65%) !important; max-height: calc(100vh - 210px) !important; overflow-y: auto !important; }
    .modern-modal-footer { border-top: 1px solid rgba(162, 13, 134, 0.12) !important; background: #ffffff !important; padding: 14px 18px !important; }
    .vas-section-block { background: #ffffff !important; border: 1px solid rgba(162, 13, 134, 0.13) !important; border-radius: 20px !important; padding: 14px !important; margin-bottom: 14px !important; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.055) !important; }
    .section-title { color: #a20d86 !important; font-size: 13px !important; font-weight: 950 !important; letter-spacing: 0.03em !important; text-transform: uppercase !important; margin-bottom: 10px !important; }
    .tile { border: 1px solid rgba(162, 13, 134, 0.12) !important; border-radius: 16px !important; padding: 12px !important; background: linear-gradient(135deg, #ffffff, #fff9fd) !important; min-height: 76px !important; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04) !important; }
    .tile__label { color: #7a5470 !important; font-size: 11px !important; font-weight: 850 !important; margin-bottom: 5px !important; }
    .tile__value { color: #111827 !important; font-size: 14px !important; font-weight: 950 !important; overflow-wrap: anywhere !important; }
    .kids-toolbar { background: #fff7fb !important; border: 1px solid rgba(162, 13, 134, 0.12) !important; border-radius: 16px !important; padding: 10px !important; }
    .kids-toolbar button { font-weight: 850 !important; transition: all 160ms ease !important; }
    .vas-kids-table { border-radius: 16px !important; overflow: hidden !important; border: 1px solid #edf0f5 !important; }
    .kid-status-circle { border-radius: 999px !important; padding: 5px 10px !important; font-weight: 900 !important; background: #f3f4f6 !important; color: #374151 !important; }
    .kid-status-circle--present { background: #dcfce7 !important; color: #15803d !important; }
    .kid-status-circle--absent { background: #fee2e2 !important; color: #b91c1c !important; }
    .kids-total-row td { background: #fff0f7 !important; color: #570457 !important; font-weight: 950 !important; }
    .vas-pagination { background: #ffffff !important; border: 1px solid rgba(162, 13, 134, 0.10) !important; border-radius: 16px !important; padding: 10px 12px !important; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04) !important; }
    .page-btn.active { background: linear-gradient(135deg, #570457, #a20d86) !important; border-color: #a20d86 !important; }
    @media (max-width: 991px) { .grid-row { grid-template-columns: 1fr 1fr !important; } }
    @media (max-width: 575px) { .vas-card-body { padding: 12px !important; } .grid-row { grid-template-columns: 1fr !important; } .modern-modal-body { max-height: calc(100vh - 170px) !important; } }
  `;


  return (
    <div dir={dir} className="vas-container">
      <style>{modernTripStyle}</style>
      <CCard
        className="vas-card"
        style={{
          borderColor: AppColors?.onPinkBorderColor || undefined,
          borderRadius: 14,
          boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
        }}
      >
        <CCardBody className="vas-card-body">
          {/* Header */}
          <div className="vas-header">
            <div className="vas-header-left">
              <div
                className="title-main"
                style={{ fontSize: 19, fontWeight: 700, color: "#111827" }} // ⬆ a bit bigger
              >
                Trip-Booked Information
              </div>
            </div>

            {/* Right side (kept empty now) */}
          </div>

          {/* 🔍 Filters and page-size selector – all in one row: Search / Status / Show records */}
          <div
            className="vas-filters"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "flex-end",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(248,250,252,0.9)",
              border: "1px solid rgba(229,231,235,0.9)",
            }}
          >
            {/* Search */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "2 1 0%",
                minWidth: 220,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Search
              </label>
              <input
                type="text"
                className="admin-txt-box"
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                placeholder="Ref No / Activity / Date / Time"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Vendor filter kept but hidden from search UI */}
            <div
              style={{
                display: "none",
                flexDirection: "column",
                minWidth: 160,
              }}
            >
              <label style={ts(13, { marginBottom: 4 })}>Vendor</label>
              <select
                className="admin-txt-box"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 0%",
                minWidth: 160,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Status
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Page size (Show records) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 0%",
                minWidth: 140,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Show records
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
              >
                {[10, 20, 50, 100, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Export */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "0 0 160px",
                minWidth: 150,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Export
              </label>
              <CButton
                type="button"
                className="trip-pdf-btn"
                disabled={loading || !sortedItems.length}
                onClick={handleExportPdf}
              >
                Export PDF
              </CButton>
            </div>
          </div>

          {loading && (
            <div className="center-text">
              <CSpinner size="sm" />{" "}
              <span style={{ marginLeft: 6 }}>Loading…</span>
            </div>
          )}

          {!!error && (
            <CAlert color="danger" className="mb-16">
              {error}
            </CAlert>
          )}

          {/* List of many records */}
          {!loading && !error && !!items.length && (
            <div className="mb-16">
              <CTable
                small
                hover
                responsive
                style={{
                  fontSize: 13, // ⬆ a bit bigger grid font
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <CTableHead
                  style={{
                    background: "rgba(248,250,252,0.96)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  <CTableRow>
                    {/* Headers */}
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Ref No."
                        columnKey="actRequestRefNo"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Act Name"
                        columnKey="actName"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Trip Date"
                        columnKey="actRequestDate"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Time"
                        columnKey="actRequestTime"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Status"
                        columnKey="actRequestStatus"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Total Present"
                        columnKey="studentApproved"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    {/* ✅ NEW column header for totalStudentAbsent */}
                    <CTableHeaderCell>
                      <SortHeader
                        label="Total Absense"
                        columnKey="studentAbsent"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Vendor Cost"
                        columnKey="vendorCost"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    {/* Food Profit & Total Profit kept but hidden from grid */}
                    <CTableHeaderCell style={{ display: "none" }}>
                      Food Profit
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ display: "none" }}>
                      Total Profit
                    </CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageItems.map((row, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <CTableRow
                        key={row.RequestID || rowNumber}
                        onClick={() => openModalFor(row)}
                        className="row-clickable"
                        style={{ cursor: "pointer" }}
                      >
                        {/* Serial No. */}
                        <CTableDataCell>{rowNumber}</CTableDataCell>

                        {/* Ref No. */}
                        <CTableDataCell className="mono">
                          {row.actRequestRefNo || "-"}
                        </CTableDataCell>

                        {/* Act Name */}
                        <CTableDataCell>{row.actName || "-"}</CTableDataCell>

                        {/* Trip Date */}
                        <CTableDataCell className="mono">
                          {row.actRequestDate || "-"}
                        </CTableDataCell>

                        {/* Time */}
                        <CTableDataCell className="mono">
                          {row.actRequestTime || "-"}
                        </CTableDataCell>

                        {/* Status */}
                        <CTableDataCell>
                          <CBadge
                            className={`status-badge ${statusClassName(
                              row.actRequestStatus
                            )}`}
                          >
                            {row.actRequestStatus}
                          </CBadge>
                        </CTableDataCell>

                        {/* Student Summary Approved (Total Student) */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.studentSummary.totalStudentApproved)}
                        </CTableDataCell>

                        {/* ✅ NEW cell: Total Absense Student from API */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.studentSummary.totalStudentAbsent)}
                        </CTableDataCell>

                        {/* Vendor Cost */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.tripPayment.totalTripVendorCost)}
                        </CTableDataCell>

                        {/* Food Vendor Price (Total) - hidden */}
                        <CTableDataCell
                          className="mono"
                          style={{ display: "none" }}
                        >
                          {fmtNum(row.foodExtrasSummary.totalFoodVendorPrice)}
                        </CTableDataCell>

                        {/* Vendor Trip Profit (Total) - hidden */}
                        <CTableDataCell
                          className="mono"
                          style={{ display: "none" }}
                        >
                          {fmtNum(
                            row.totalPaymentSummary.totalVendorTripProfit
                          )}
                        </CTableDataCell>

                        {/* Open */}
                        <CTableDataCell>
                          <CButton
                            size="sm"
                            className="trip-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModalFor(row);
                            }}
                            style={{
                              borderRadius: 999,
                              fontSize: 12,
                              padding: "3px 10px",
                            }}
                          >
                            View
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })}
                </CTableBody>
              </CTable>

              {sortedItems.length === 0 && (
                <div
                  className="center-text muted"
                  style={{ marginTop: 8, fontSize: 13 }}
                >
                  No records match current filters.
                </div>
              )}
            </div>
          )}

          {!loading && !error && !items.length && (
            <div className="center-text muted">No data available.</div>
          )}

          {/* 🔢 Pagination under grid footer */}
          {!loading && !error && sortedItems.length > 0 && (
            <div
              className="vas-pagination"
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <div style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Showing {showingFrom} to {showingTo} of {sortedItems.length}{" "}
                entries
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`page-btn ${
                        page === currentPage ? "active" : ""
                      }`}
                      style={{
                        minWidth: 32,
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        backgroundColor:
                          page === currentPage ? "#4b5563" : "#ffffff",
                        color:
                          page === currentPage ? "#ffffff" : "#111827",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ===== Modal with details ===== */}
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        alignment="center"
        backdrop="static"
        size="xl"
        className="modern-modal"
      >
        <CModalHeader closeButton className="modern-modal-header">
          <CModalTitle className="modern-modal-title">
            Payment Request Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="modern-modal-body">
          {!selected ? (
            <div className="muted">No record selected.</div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="vas-section-block">
                <SectionTitle>Basic Info</SectionTitle>
                <RowGrid columns={5}>
                  <Tile
                    label="Reference No."
                    value={selected.actRequestRefNo}
                    mono
                  />
                  <Tile label="Activity Name" value={selected.actName} />
                  <div className="tile tile--status">
                    <div className="tile__label">Status</div>
                    <div>
                      <CBadge
                        className={`status-badge ${statusClassName(
                          selected.actRequestStatus
                        )}`}
                      >
                        {selected.actRequestStatus}
                      </CBadge>
                    </div>
                  </div>
                  <Tile
                    label="Request Date"
                    value={selected.actRequestDate}
                    mono
                  />
                  <Tile
                    label="Request Time"
                    value={selected.actRequestTime}
                    mono
                  />
                </RowGrid>
              </div>

              {/* Payment Information (Vendor Cost only, PRESENT students only) */}
              <div className="vas-section-block">
                <SectionTitle>Payment Information</SectionTitle>
                {(() => {
                  // Use ONLY PRESENT students for all amounts
                  let presentCount = 0;
                  let presentCost = 0;

                  if (kids && kids.length) {
                    kids.forEach((kid) => {
                      if (isPresentStatus(kid.tripKidsStatus)) {
                        presentCount += 1;
                        presentCost += Number(kid.TripVendorCost) || 0;
                      }
                    });
                  } else {
                    // Fallback if kids data is not available
                    presentCount = Number(
                      selected.studentSummary?.totalStudentApproved || 0
                    );
                    presentCost = Number(
                      selected.tripPayment?.totalTripVendorCost || 0
                    );
                  }

                  const totalVendorCost = presentCost;
                  const totalPresentStudent = presentCount;
                  const costPerStudent =
                    totalPresentStudent > 0
                      ? totalVendorCost / totalPresentStudent
                      : 0;
                  const taxRatePercent = 15;
                  const taxAmount =
                    totalVendorCost * (taxRatePercent / 100);
                  const totalWithTax = totalVendorCost + taxAmount;

                  return (
                    <RowGrid columns={6}>
                      <Tile
                        label="Vendor Cost Per Student (Present)"
                        value={fmtNum(costPerStudent.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(totalPresentStudent)}
                        mono
                      />
                      <Tile
                        label="Total Vendor Cost (Present)"
                        value={fmtNum(totalVendorCost.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Tax %"
                        value={`${taxRatePercent}%`}
                        mono
                      />
                      <Tile
                        label="Tax Amount"
                        value={fmtNum(taxAmount.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Total Amount With Tax"
                        value={fmtNum(totalWithTax.toFixed(2))}
                        mono
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Student Summary + Student Information in ONE section */}
              <div className="vas-section-block">
                <SectionTitle>Student Summary & Information</SectionTitle>
                {(() => {
                  const { totalKids, presentCount, absentCount } =
                    computeKidsPresence(kids);

                  return (
                    <RowGrid columns={7}>
                      {/* From Student Summary */}
                      <Tile
                        label="Total Paid"
                        value={fmtNum(
                          selected.studentSummary.totalStudentPaid
                        )}
                      />
                      <Tile
                        label="Approved"
                        value={fmtNum(
                          selected.studentSummary.totalStudentApproved
                        )}
                      />
                      <Tile
                        label="Failed"
                        value={fmtNum(
                          selected.studentSummary.totalStudentFailed
                        )}
                      />
                      <Tile
                        label="Trying Paying"
                        value={fmtNum(
                          selected.studentSummary.totalStudentNew
                        )}
                      />
                      {/* From Student Information (kids presence) */}
                      <Tile
                        label="Total Student"
                        value={fmtNum(totalKids)}
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(presentCount)}
                        mono
                        style={{
                          borderColor: "rgba(22,163,74,0.5)",
                          backgroundColor: "rgba(34,197,94,0.15)",
                          color: "#166534",
                        }}
                      />
                      <Tile
                        label="Total Absent Student"
                        value={fmtNum(absentCount)}
                        mono
                        style={{
                          borderColor: "rgba(248,113,113,0.8)",
                          backgroundColor: "rgba(248,113,113,0.15)",
                          color: "#b91c1c",
                        }}
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Kids Information */}
              <div className="vas-section-block">
                <SectionTitle>Kids Information</SectionTitle>

                {/* Filter + Export toolbar */}
                <div
                  className="kids-toolbar"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={ts(13, { color: "#000000" })}>
                      Filter:
                    </span>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("ALL")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "ALL"
                            ? "1px solid #4b5563"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "ALL" ? "#4b5563" : "#ffffff",
                        color:
                          kidsFilter === "ALL" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      All Kids
                    </button>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("PRESENT")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "PRESENT"
                            ? "1px solid #16a34a"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "PRESENT" ? "#16a34a" : "#ffffff",
                        color:
                          kidsFilter === "PRESENT" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      PRESENT
                    </button>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("ABSENT")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "ABSENT"
                            ? "1px solid #dc2626"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "ABSENT" ? "#dc2626" : "#ffffff",
                        color:
                          kidsFilter === "ABSENT" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      ABSENT
                    </button>
                  </div>

                  <div>
                    <CButton
                      size="sm"
                      color="success"
                      variant="outline"
                      disabled={!sortedKids.length}
                      onClick={handleExportKids}
                      style={{
                        borderRadius: 999,
                        fontSize: 12,
                        padding: "4px 12px",
                        marginInlineEnd: 8,
                      }}
                    >
                      Export Excel
                    </CButton>
                    <CButton
                      size="sm"
                      className="trip-pdf-btn"
                      disabled={!sortedKids.length}
                      onClick={handleExportKidsPdf}
                      style={{
                        minHeight: 30,
                        fontSize: 12,
                        padding: "4px 12px",
                      }}
                    >
                      Export PDF
                    </CButton>
                  </div>
                </div>

                {sortedKids && sortedKids.length > 0 ? (
                  <>
                    <CTable
                      small
                      hover
                      responsive
                      className="mt-2 vas-kids-table"
                      style={{ fontSize: 13 }}
                    >
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>#</CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="School No"
                              columnKey="TripKidsSchoolNo"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Kid Name"
                              columnKey="TripKidsName"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Class Name"
                              columnKey="tripKidsClassName"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Status"
                              columnKey="tripKidsStatus"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Payment Type"
                              columnKey="tripPaymentTypeID"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Trip Vendor Cost"
                              columnKey="TripVendorCost"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {sortedKids.map((kid, index) => {
                          const statusRaw =
                            (kid.tripKidsStatus || "").toString();
                          const present = isPresentStatus(statusRaw);
                          const absent = isAbsentStatus(statusRaw);

                          const circleClass =
                            "kid-status-circle " +
                            (present
                              ? "kid-status-circle--present"
                              : absent
                              ? "kid-status-circle--absent"
                              : "");

                          return (
                            <CTableRow key={kid.KidsID || index}>
                              <CTableDataCell>
                                {index + 1}
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {kid.TripKidsSchoolNo || ""}
                              </CTableDataCell>
                              <CTableDataCell>
                                {kid.TripKidsName || "-"}
                              </CTableDataCell>
                              <CTableDataCell>
                                {kid.tripKidsClassName || "-"}
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="kid-status-cell">
                                  <span className={circleClass}>
                                    {statusRaw || "-"}
                                  </span>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {kid.tripPaymentTypeID || "-"}
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {fmtNum(kid.TripVendorCost ?? 0)}
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })}

                        {/* Total Trip Vendor Cost row - PRESENT ONLY + Total Absent */}
                        {(() => {
                          const { absentCount } =
                            computeKidsPresence(kids);
                          return (
                            <CTableRow className="kids-total-row">
                              <CTableDataCell
                                colSpan={6}
                                style={{
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                Total Trip Vendor Cost (Present Only) | Total
                                Absent Student: {fmtNum(absentCount)}
                              </CTableDataCell>
                              <CTableDataCell
                                className="mono"
                                style={{ fontWeight: "bold" }}
                              >
                                {fmtNum(kidsVendorTotal.toFixed(2))}
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })()}
                      </CTableBody>
                    </CTable>
                  </>
                ) : (
                  <div
                    className="muted"
                    style={{ marginTop: 4, fontSize: 13 }}
                  >
                    No kids information found for this trip.
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter className="modern-modal-footer">
          <CButton
            color="secondary"
            className="trip-close-btn"
            variant="outline"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: 999,
              fontSize: 13,
              paddingInline: 16,
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default ViewActivityScreen;
