/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

/**
 * Format page count with thousands separator
 */
export const formatPages = (pages) => {
  if (pages === null || pages === undefined) return "0";
  return pages.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format ink level with color
 */
export const formatInkLevel = (level) => {
  if (level === null || level === undefined)
    return { text: "N/A", color: "#bfbfbf" };

  if (level < 10) return { text: `${level}%`, color: "#f5222d" };
  if (level < 20) return { text: `${level}%`, color: "#fa8c16" };
  if (level < 50) return { text: `${level}%`, color: "#faad14" };
  return { text: `${level}%`, color: "#52c41a" };
};

/**
 * Format printer status
 */
export const formatPrinterStatus = (status) => {
  const statusMap = {
    ready: { text: "Ready", color: "green" },
    error: { text: "Error", color: "red" },
    offline: { text: "Offline", color: "gray" },
    paused: { text: "Paused", color: "blue" },
    printing: { text: "Printing", color: "orange" },
    stopped: { text: "Stopped", color: "red" },
  };

  return (
    statusMap[status?.toLowerCase()] || {
      text: status || "Unknown",
      color: "default",
    }
  );
};

/**
 * Calculate daily total from report
 */
export const calculateDailyTotal = (dailyReport) => {
  if (!dailyReport || typeof dailyReport !== "object") return 0;

  return Object.values(dailyReport).reduce((total, pages) => {
    const pageValue = typeof pages === "number" ? pages : 0;
    return total + pageValue;
  }, 0);
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format printer name (singkatkan jika terlalu panjang)
 */
export const formatPrinterName = (name, maxLength = 30) => {
  if (!name) return "Unknown Printer";
  if (name.length <= maxLength) return name;

  const parts = name.split(" ");
  let result = "";
  let currentLength = 0;

  for (const part of parts) {
    if (currentLength + part.length + 1 <= maxLength - 3) {
      result += (result ? " " : "") + part;
      currentLength = result.length;
    } else {
      break;
    }
  }

  return result ? `${result}...` : `${name.substring(0, maxLength - 3)}...`;
};

/**
 * Format ink status untuk printer card
 */
export const formatInkForCard = (inkStatus) => {
  if (!inkStatus || !inkStatus.levels) return null;

  const levels = inkStatus.levels;
  const colors = Object.keys(levels);

  if (colors.length === 0) return null;

  // Hitung rata-rata level ink
  const total = colors.reduce((sum, color) => {
    const level = levels[color];
    return sum + (typeof level === "number" ? level : 0);
  }, 0);
  const average = Math.round(total / colors.length);

  // Cek jika ada ink rendah
  const lowInk = Object.values(levels).some(
    (level) => typeof level === "number" && level < 20,
  );
  const criticalInk = Object.values(levels).some(
    (level) => typeof level === "number" && level < 10,
  );

  return {
    average,
    lowInk,
    criticalInk,
    levels,
    lastChecked: inkStatus.lastChecked,
  };
};

/**
 * Format waktu dari timestamp API
 */
export const formatAPITimestamp = (timestamp) => {
  if (!timestamp) return "Unknown";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

/**
 * Format uptime seconds to human readable
 */
export const formatUptime = (seconds) => {
  if (!seconds || seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format printer status dari raw status number
 */
export const formatRawPrinterStatus = (rawStatus) => {
  const statusMap = {
    0: "Ready",
    1: "Paused",
    2: "Error",
    3: "Pending Deletion",
    4: "Paper Jam",
    5: "Paper Out",
    6: "Manual Feed",
    7: "Paper Problem",
    8: "Offline",
    9: "IO Active",
    10: "Busy",
    11: "Printing",
    12: "Output Bin Full",
    13: "Not Available",
    14: "Waiting",
    15: "Processing",
    16: "Initializing",
    17: "Warming Up",
    18: "Toner Low",
    19: "No Toner",
    20: "Page Punt",
    21: "User Intervention Required",
    22: "Out of Memory",
    23: "Door Open",
    24: "Server Unknown",
    25: "Power Save",
  };

  return statusMap[rawStatus] || `Unknown (${rawStatus})`;
};

/**
 * Format health percentage untuk progress bar
 */
export const formatHealthPercentage = (percentage) => {
  if (percentage >= 90) return { color: "#52c41a", status: "success" };
  if (percentage >= 70) return { color: "#faad14", status: "warning" };
  return { color: "#f5222d", status: "exception" };
};
