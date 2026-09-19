/**
 * Dukaan Bill - Google Apps Script Web App Backend Database
 * 
 * SETUP INSTRUCTIONS:
 * -------------------
 * 1. Open a new Google Sheet at https://sheets.new
 * 2. In Google Sheets, click Extensions > Apps Script
 * 3. Delete any code in Code.gs, paste this entire file, and click Save (Ctrl+S)
 * 4. Replace 'MY_SECRET_TOKEN_123' below with your desired secret password/token
 * 5. Run the setup() function once in Apps Script editor to create tabs & headers:
 *    - Click the function dropdown next to "Debug", select "setup", and click "Run"
 * 6. Click Deploy > New deployment:
 *    - Select type: "Web app"
 *    - Description: "Dukaan Bill API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Security token is verified in request body)
 * 7. Click Deploy, authorize permissions, and copy the "Web App URL".
 * 8. Open Dukaan Bill app > Shop Settings > Connect Google Sheet, paste Web App URL & Secret Token!
 */

var SECRET_TOKEN = "MY_SECRET_TOKEN_123";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = { success: false };
  
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var token = data.token;
    if (token !== SECRET_TOKEN) {
      output.error = "Unauthorized: Invalid secret token";
      return createJsonResponse(output);
    }

    var action = data.action;

    if (action === "test") {
      output.success = true;
      output.message = "Connected to Dukaan Bill Google Sheet successfully!";
      return createJsonResponse(output);
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // 10s max wait

    try {
      if (action === "sync") {
        output = handleSyncAction(data);
      } else {
        output.error = "Unknown action: " + action;
      }
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    output.success = false;
    output.error = err.toString();
  }

  return createJsonResponse(output);
}

function handleSyncAction(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = Date.now();
  var lastSrvUpdatedAt = Number(data.lastSrvUpdatedAt) || 0;
  var outbox = data.outbox || [];

  // 1. Process incoming outbox batch writes
  for (var i = 0; i < outbox.length; i++) {
    var item = outbox[i];
    var table = item.table;
    var rowData = item.data;

    if (table === "invoices" && rowData.invoice && rowData.items) {
      upsertRow(ss, "Invoices", rowData.invoice, now);
      // Replace invoice items for this invoice
      replaceInvoiceItems(ss, rowData.invoice.id, rowData.items, now);
    } else if (table === "products") {
      upsertRow(ss, "Products", rowData, now);
    } else if (table === "customers") {
      upsertRow(ss, "Customers", rowData, now);
    } else if (table === "shop") {
      upsertRow(ss, "Shop", rowData, now);
    }
  }

  // 2. Fetch server updates since lastSrvUpdatedAt
  var serverChanges = {
    shop: fetchChangedRows(ss, "Shop", lastSrvUpdatedAt),
    products: fetchChangedRows(ss, "Products", lastSrvUpdatedAt),
    customers: fetchChangedRows(ss, "Customers", lastSrvUpdatedAt),
    invoices: fetchChangedRows(ss, "Invoices", lastSrvUpdatedAt),
    invoiceItems: fetchChangedRows(ss, "InvoiceItems", lastSrvUpdatedAt)
  };

  return {
    success: true,
    srvUpdatedAt: now,
    serverChanges: serverChanges
  };
}

function upsertRow(ss, sheetName, rowObject, srvTimestamp) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length < 1) return;

  var headers = data[0];
  var idColIdx = headers.indexOf("id");
  if (idColIdx === -1) return;

  var srvUpdatedColIdx = headers.indexOf("srvUpdatedAt");

  var targetRowIdx = -1;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idColIdx]) === String(rowObject.id)) {
      targetRowIdx = r + 1; // 1-indexed
      break;
    }
  }

  var rowValues = headers.map(function (colName) {
    if (colName === "srvUpdatedAt") return srvTimestamp;
    var val = rowObject[colName];
    return val !== undefined && val !== null ? val : "";
  });

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function replaceInvoiceItems(ss, invoiceId, itemsArray, srvTimestamp) {
  var sheet = ss.getSheetByName("InvoiceItems");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length < 1) return;

  var headers = data[0];
  var invIdColIdx = headers.indexOf("invoiceId");
  if (invIdColIdx === -1) return;

  // Delete existing rows for invoiceId in reverse order
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][invIdColIdx]) === String(invoiceId)) {
      sheet.deleteRow(r + 1);
    }
  }

  // Insert new items
  for (var i = 0; i < itemsArray.length; i++) {
    var item = itemsArray[i];
    var rowValues = headers.map(function (colName) {
      if (colName === "srvUpdatedAt") return srvTimestamp;
      var val = item[colName];
      return val !== undefined && val !== null ? val : "";
    });
    sheet.appendRow(rowValues);
  }
}

function fetchChangedRows(ss, sheetName, minSrvUpdatedAt) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var srvColIdx = headers.indexOf("srvUpdatedAt");
  var result = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var srvTime = srvColIdx !== -1 ? Number(row[srvColIdx]) || 0 : 0;
    if (srvTime > minSrvUpdatedAt || minSrvUpdatedAt === 0) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = row[c];
      }
      result.push(obj);
    }
  }
  return result;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var schemas = {
    Shop: [
      "id", "shopName", "proprietor", "address", "phone", "email", "gstin",
      "declaration", "signatureLabel", "invoicePrefix", "nextInvoiceNo",
      "roundOffEnabled", "language", "updatedAt", "srvUpdatedAt"
    ],
    Products: ["id", "name", "unit", "price", "updatedAt", "srvUpdatedAt", "deleted"],
    Customers: ["id", "name", "address", "phone", "updatedAt", "srvUpdatedAt", "deleted"],
    Invoices: [
      "id", "invoiceNo", "date", "customerId", "customerName", "customerAddress",
      "customerPhone", "subtotal", "roundOff", "total", "amountInWords", "note",
      "status", "createdAt", "updatedAt", "srvUpdatedAt", "deleted"
    ],
    InvoiceItems: ["id", "invoiceId", "slNo", "description", "qty", "unit", "rate", "amount", "srvUpdatedAt"],
    Meta: ["key", "value"]
  };

  for (var tabName in schemas) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    sheet.clear();
    sheet.appendRow(schemas[tabName]);
  }

  // Delete default Sheet1 if exists and others created
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log("Dukaan Bill Google Sheet setup completed successfully!");
}
