
import { jsPDF } from 'jspdf';
import { Tour, AuditLog, AppData, Boat, Personnel } from '../types';

const PANGEA_YELLOW = [255, 181, 25];
const PANGEA_DARK = [67, 67, 67];

export const generateTourPDF = (tour: Tour, boat?: Boat, captain?: Personnel) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(PANGEA_DARK[0], PANGEA_DARK[1], PANGEA_DARK[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PANGEA OPS", 20, 20);
  
  doc.setFontSize(10);
  doc.text("TRIP REPORT / DEPARTURE LOG", 20, 30);
  
  doc.setTextColor(PANGEA_YELLOW[0], PANGEA_YELLOW[1], PANGEA_YELLOW[2]);
  doc.text(`ID: ${tour.id}`, 150, 20);

  // Content
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  let y = 55;

  const addField = (label: string, value: string | number) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${value}`, 70, y);
    y += 8;
  };

  addField("Vessel", boat?.name || tour.boatId);
  addField("Captain", captain?.name || tour.captainId);
  addField("Route", tour.route);
  addField("Type", tour.tourType);
  addField("Date", tour.date);
  addField("Pax Count", tour.paxCount);
  addField("Gas Start/End", `${tour.startGas} / ${tour.endGas || 'N/A'}`);
  
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Mechanical & Arrival Notes:", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const notes = doc.splitTextToSize(tour.arrivalNotes || tour.generalTripNotes || "No notes provided.", 170);
  doc.text(notes, 20, y);

  return doc;
};

export const generateLogPDF = (logs: AuditLog[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Pangea Bocas - Audit Log Report", 20, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);

  let y = 40;
  logs.forEach((log, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text(`${log.timestamp.split('T')[1].substring(0,5)} - ${log.action}`, 20, y);
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
