import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { iaaLogoBase64, hsAalenLogoBase64 } from './logos';

export function exportCSV(data, fileName = 'IAA_Asset_Report.csv') {
  let csv = "Timestamp,Vibration_RMS,Temperature,RPM,Anomaly_Score\n";
  data.forEach(r => {
    csv += `${r.timestamp},${r.vibration},${r.temp},${r.rpm},${r.anomaly}\n`;
  });
  const link = document.createElement("a"); 
  link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
  link.download = fileName; 
  link.click();
}

export function exportJSON(data, fileName = 'IAA_Asset_Payload.json') {
  const payload = JSON.stringify({ asset: "Test Rig A", generatedAt: new Date().toISOString(), records: data }, null, 2);
  const link = document.createElement("a"); 
  link.href = encodeURI("data:application/json;charset=utf-8," + payload);
  link.download = fileName; 
  link.click();
}

export function exportPDF(data, fileName = 'IAA_Executive_Report.pdf') {
  try {
    const doc = new jsPDF();
    
    // Add Logos in top corners
    if (iaaLogoBase64) {
      doc.addImage(iaaLogoBase64, 'PNG', 14, 10, 40, 20);
    }
    
    if (hsAalenLogoBase64) {
      try {
        doc.addImage(hsAalenLogoBase64, 'PNG', 160, 10, 35, 15);
      } catch (e) {
        doc.setFontSize(10);
        doc.text("HS Aalen", 180, 15);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("IAA Condition Monitor", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Executive Asset Health Report", 105, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: "center" });
    
    doc.setDrawColor(200);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Asset: Test Rig A — Drive Train", 14, 48);
    doc.text("Status: Caution (Warning)", 14, 54);
    doc.text("Latest AI Diagnostics: Minor outer race defect signature detected.", 14, 60);
    
    const tableData = data.map(row => [
      row.timestamp,
      `${row.vibration.toFixed(2)} mm/s`,
      `${row.temp.toFixed(1)} °C`,
      row.rpm,
      row.anomaly.toFixed(2)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Timestamp', 'Vibration', 'Temperature', 'RPM', 'Anomaly Score']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 150;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Confidential — Hochschule Aalen & IAA", 14, finalY);

    doc.save(fileName);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Could not generate PDF. Check console for details.");
  }
}
