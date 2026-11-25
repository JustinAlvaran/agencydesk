/**
 * AgencyDesk CRM <-> Google Sheets Two-Way Automation Script
 * Account: kinggucci195@gmail.com
 *
 * Setup:
 * 1. In your Google Sheet, click Extensions > Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Set SCRIPT PROPERTIES (Project Settings > Script Properties):
 *    - N8N_SYNC_WEBHOOK: https://justinautomaton.app.n8n.cloud/webhook/agencydesk-sheets-sync
 *    - AGENCYDESK_API_URL: https://agencydesk-theta.vercel.app/api/integrations/n8n/leads/upsert
 *    - AUTOMATION_SECRET: (your configured AUTOMATION_SECRET)
 * 4. Add an installable trigger (Triggers > Add Trigger):
 *    - Function: onSheetEdit
 *    - Event source: From spreadsheet
 *    - Event type: On edit
 */

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 AgencyDesk CRM')
    .addItem('Sync Selected Row to CRM', 'syncSelectedRow')
    .addItem('Sync All Rows to CRM', 'syncAllRows')
    .addSeparator()
    .addItem('Initialize Master Headers', 'initializeHeaders')
    .addToUi();
}

function initializeHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = [
    'Timestamp',
    'Lead ID',
    'Contact Name',
    'Email',
    'WhatsApp',
    'WhatsApp Opt-in',
    'Instagram',
    'Company',
    'Service',
    'Budget',
    'Score',
    'Status',
    'Source',
    'Brief',
    'Notes',
    'Website CRM Link',
    'Sync Hash',
    'Last Synced By'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  SpreadsheetApp.getUi().alert('Master headers initialized successfully!');
}

function onSheetEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Leads_Master' && sheet.getName() !== 'Sheet1') return;

  const row = e.range.getRow();
  if (row <= 1) return; // Header row

  const headers = getHeaders(sheet);
  const lastSyncedByIndex = headers.indexOf('Last Synced By') + 1;
  if (lastSyncedByIndex > 0) {
    const lastSyncedByVal = sheet.getRange(row, lastSyncedByIndex).getValue();
    if (lastSyncedByVal === 'agencydesk_crm') {
      // Loop prevention: do not re-sync changes made by the CRM inbound webhook
      return;
    }
  }

  syncRow(sheet, row);
}

function syncSelectedRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Please select a data row (row 2 or higher).');
    return;
  }
  syncRow(sheet, row);
  SpreadsheetApp.getUi().alert('Row ' + row + ' synced to AgencyDesk CRM Kanban!');
}

function syncAllRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  for (let r = 2; r <= lastRow; r++) {
    syncRow(sheet, r);
  }
  SpreadsheetApp.getUi().alert('All ' + (lastRow - 1) + ' rows processed.');
}

function syncRow(sheet, row) {
  const headers = getHeaders(sheet);
  const rowValues = sheet.getRange(row, 1, 1, headers.length).getValues()[0];

  const rowData = {};
  headers.forEach((header, idx) => {
    rowData[header] = rowValues[idx];
  });

  if (!rowData['Email'] || !rowData['Contact Name']) return;

  const payload = {
    lead_id: rowData['Lead ID'] || null,
    contact_name: rowData['Contact Name'],
    email: rowData['Email'],
    phone: rowData['WhatsApp'] || null,
    whatsapp: rowData['WhatsApp'] || null,
    whatsapp_opt_in: rowData['WhatsApp Opt-in'] === 'YES' || Boolean(rowData['WhatsApp Opt-in']),
    instagram: rowData['Instagram'] || null,
    company: rowData['Company'] || 'Unassigned Company',
    service: rowData['Service'] || 'Web & Mobile Applications',
    brief: rowData['Brief'] || 'Lead entered via Google Sheets',
    budget: Number(rowData['Budget']) || 0,
    status: (rowData['Status'] || 'new').toLowerCase().replace(/\s+/g, '_'),
    score: Number(rowData['Score']) || 50,
    notes: rowData['Notes'] || '',
    source: 'google_sheets',
    last_synced_by: 'sheets_user'
  };

  const webhookUrl = PropertiesService.getScriptProperties().getProperty('N8N_SYNC_WEBHOOK') ||
    'https://justinautomaton.app.n8n.cloud/webhook/agencydesk-sheets-sync';
  const automationSecret = PropertiesService.getScriptProperties().getProperty('AUTOMATION_SECRET') || '';

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'X-AgencyDesk-Signature': automationSecret,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const resCode = response.getResponseCode();
    if (resCode >= 200 && resCode < 300) {
      const resData = JSON.parse(response.getContentText());
      const leadId = resData.lead_id || (resData.sync_result && resData.sync_result.lead_id);

      const leadIdIdx = headers.indexOf('Lead ID') + 1;
      const crmLinkIdx = headers.indexOf('Website CRM Link') + 1;
      const syncedByIdx = headers.indexOf('Last Synced By') + 1;

      if (leadId && leadIdIdx > 0 && !sheet.getRange(row, leadIdIdx).getValue()) {
        sheet.getRange(row, leadIdIdx).setValue(leadId);
      }
      if (leadId && crmLinkIdx > 0) {
        sheet.getRange(row, crmLinkIdx).setValue('https://agencydesk-theta.vercel.app/crm/leads?lead=' + leadId);
      }
      if (syncedByIdx > 0) {
        sheet.getRange(row, syncedByIdx).setValue('sheets_user');
      }
    }
  } catch (err) {
    Logger.log('Error syncing row ' + row + ': ' + err.message);
  }
}
