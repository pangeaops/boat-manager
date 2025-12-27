import { jsPDF } from 'jspdf';
import { Tour, AuditLog, AppData, Boat, Personnel } from '../types';

export const generateTourPDF = (tour: Tour, boat?: Boat, captain?: Personnel) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(67, 67, 67); // PANGEA_DARK
  doc.text("PANGEA BOCAS - TRIP REPORT", 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 181, 25); // PANGEA_YELLOW
  doc.text(`TRIP ID: ${tour.id}`, 20, 32);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  let y = 45;

  const addField = (label: string, value: string | number | undefined) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${value || 'N/A'}`, 70, y);
    y += 10;
  };

  addField("Date", tour.date);
  addField("Vessel", boat?.name || tour.boatId);
  addField("Captain", captain?.name || tour.captainId);
  addField("PAX Count", tour.paxCount);
  addField("Tour Type", tour.tourType);
  addField("Route", tour.route);
  addField("Departure Time", tour.departureTime);
  addField("Arrival Time", tour.arrivalTime);
  addField("Gas Start", tour.startGas);
  addField("Gas End", tour.endGas);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Operational Notes:", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  const notes = doc.splitTextToSize(tour.arrivalNotes || tour.generalTripNotes || "No specific notes recorded.", 170);
  doc.text(notes, 20, y);
  
  y += (notes.length * 6) + 10;
  if (tour.mechanicalNotes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // Red
    doc.text("Mechanical Notes:", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const mNotes = doc.splitTextToSize(tour.mechanicalNotes, 170);
    doc.text(mNotes, 20, y);
  }

  return doc;
};

export const generateAuditLogPDF = (logs: AuditLog[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("PANGEA BOCAS - OPERATIONS AUDIT LOG", 20, 25);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 32);

  let y = 45;
  logs.forEach((log) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${log.timestamp.split('T')[1].substring(0, 5)} - ${log.action}`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(`[${log.category}] ${log.details}`, 20, y + 5);
    y += 15;
  });
  return doc;
};

export const sendEmailReport = (subject: string, body: string, to: string = 'ops@pangeabocas.com') => {
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
};