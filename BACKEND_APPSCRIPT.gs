
/**
 * BACK-END GOOGLE APPS SCRIPT - VERSÃO CHAT DINÂMICO & UPLOAD & E-MAIL
 */

const FOLDER_ID = "0AOXxdWFOmscbUk9PVA"; 
const SHEETS = {
  AWB: "AWB",
  USERS: "CADASTRO USUÁRIO",
  CHAT: "CHAT"
};

function doGet(e) {
  try {
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : SHEETS.AWB;
    return createJsonResponse(getRows(sheetName));
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ error: "Conteúdo vazio" });
    }

    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.data;
    const currentSheet = body.sheet || SHEETS.AWB;

    switch (action) {
      case "CREATE_CHAT_SHEET":
        return createChatSheet(body.sheetName);
      case "GET":
        return createJsonResponse(getRows(currentSheet));
      case "SAVE":
        return saveRow(currentSheet, payload);
      case "DELETE":
        return deleteRow(currentSheet, payload.id || payload.ID);
      case "UPLOAD":
        return uploadToDrive(body.filename, body.mimeType, body.data);
      default:
        return createJsonResponse({ error: "Ação inválida" });
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createChatSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["ID", "Data e hora", "usuário", "Mensagem", "Editada"]);
    sheet.getRange(1, 1, 1, 5).setBackground("#111827").setFontColor("#ffffff").setFontWeight("bold");
    return createJsonResponse({ success: true, message: "Aba criada com sucesso" });
  }
  return createJsonResponse({ success: true, message: "Aba já existente" });
}

function uploadToDrive(filename, mimeType, base64Data) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return createJsonResponse({ success: true, url: file.getUrl(), id: file.getId() });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEETS.AWB) {
      sheet.appendRow(["ID", "Fornecedor", "Saída", "NF's", "AWB", "Status", "Chegada", "Marca", "Material", "Observação", "Rastreio", "Documentos"]);
    } else if (name === SHEETS.CHAT) {
      sheet.appendRow(["ID", "Data e hora", "usuário", "Mensagem", "Editada"]);
    } else if (name === SHEETS.USERS) {
      sheet.appendRow(["ID", "USUÁRIO", "E-MAIL", "SENHA", "PAPEL", "STATUS", "Permissões de Tela (Módulos)"]);
    }
  }
  return sheet;
}

function getRows(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => { obj[header] = row[i]; });
    return obj;
  });
}

function saveRow(sheetName, payload) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idInput = String(payload.ID || payload.id || "").trim();
  
  let rowIndex = -1;
  if (data.length > 1 && idInput) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idInput) { rowIndex = i + 1; break; }
    }
  }

  // Extração de campos de e-mail (não salvos na planilha diretamente)
  const cleanPayload = { ...payload };
  const sendEmail = cleanPayload.send_email;
  const emailTo = cleanPayload.email_to;
  const emailCc = cleanPayload.email_cc;
  const emailBcc = cleanPayload.email_bcc;
  const emailBody = cleanPayload.email_body;
  
  delete cleanPayload.send_email;
  delete cleanPayload.email_to;
  delete cleanPayload.email_cc;
  delete cleanPayload.email_bcc;
  delete cleanPayload.email_body;

  const rowData = headers.map(header => cleanPayload[header] || "");

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Notificação por e-mail se solicitado
  if (sheetName === SHEETS.AWB && sendEmail && emailTo) {
    enviarEmailPersonalizado(cleanPayload, emailTo, emailCc, emailBcc, emailBody);
  }

  return createJsonResponse({ success: true, message: rowIndex > -1 ? "Atualizado" : "Inserido" });
}

function enviarEmailPersonalizado(awb, to, cc, bcc, customBody) {
  const subject = `Notificação de Embarque AWB: ${awb.AWB || awb.awbNumber}`;
  
  // Se o usuário forneceu um corpo personalizado, substitui a seção de observações padrão ou integra nela
  const bodyText = customBody ? customBody : (awb.Observação || awb.observacao || 'Sem observações adicionais.');

  let htmlBody = `
    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background-color: #2563eb; padding: 32px; color: white;">
        <h2 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Relatório de Embarque</h2>
        <p style="margin: 6px 0 0 0; font-size: 11px; opacity: 0.8; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Cloud Sync Enterprise 4.0</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">AWB NUMBER</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; color: #2563eb; font-family: monospace; font-size: 16px;">${awb.AWB || awb.awbNumber}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">FORNECEDOR</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${awb.Fornecedor || awb.fornecedor}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">MARCA</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; text-transform: uppercase; font-weight: 600;">${awb.Marca || awb.marca}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">STATUS ATUAL</td><td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; color: #10b981;">${awb.Status || awb.status}</td></tr>
        </table>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 12px 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Mensagem do Operador</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${bodyText}</p>
        </div>

        ${awb.Rastreio || awb.rastreio ? `
        <div style="margin-top: 24px; text-align: center;">
          <a href="${awb.Rastreio || awb.rastreio}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Acompanhar Rastreio Real-Time</a>
        </div>
        ` : ''}
      </div>
      <div style="padding: 20px 32px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Sistema Automatizado de Logística • Notificação Follow-UP</p>
      </div>
    </div>
  `;

  const attachments = [];
  const docLinks = String(awb.Documentos || awb.documentos || "").split("|").filter(l => l.trim().startsWith("http"));
  
  docLinks.forEach(link => {
    try {
      let fileId = "";
      if (link.includes("/d/")) {
        fileId = link.split("/d/")[1].split("/")[0];
      } else if (link.includes("id=")) {
        fileId = link.split("id=")[1].split("&")[0];
      }
      
      if (fileId) {
        const file = DriveApp.getFileById(fileId);
        attachments.push(file.getBlob());
      }
    } catch (e) {
      console.error("Erro ao anexar arquivo ao e-mail: " + link, e);
    }
  });

  // MailApp.sendEmail suporta strings separadas por vírgula nativamente para múltiplos destinatários
  MailApp.sendEmail({
    to: to,
    cc: cc || "",
    bcc: bcc || "",
    subject: subject,
    htmlBody: htmlBody,
    attachments: attachments
  });
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const idStr = String(id).trim();
  let rowIndexToDelete = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idStr) { rowIndexToDelete = i + 1; break; }
  }
  if (rowIndexToDelete !== -1) {
    sheet.deleteRow(rowIndexToDelete);
    return createJsonResponse({ success: true });
  }
  return createJsonResponse({ success: false, error: "Não encontrado" });
}
