// Browser-only PDF generator. Captures a DOM node with html2canvas-pro and
// stitches it across A4 pages with jsPDF. The libraries are dynamically
// imported so they don't end up in the SSR bundle and don't cost anything
// until the user actually clicks "Download".

export async function captureNodeToPdf(node: HTMLElement, filename: string) {
  if (typeof window === "undefined") {
    throw new Error("PDF generation is only available in the browser.");
  }

  const [{ default: html2canvas }, jspdfModule] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const { jsPDF } = jspdfModule;

  // Render at 2x for sharper text. html2canvas-pro tolerates oklch/lab
  // colours that Tailwind v4 emits.
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#0a0e1a",
    useCORS: true,
    logging: false,
    // Wait until web fonts are loaded so headings render in Cormorant.
    onclone: async (doc) => {
      try {
        await doc.fonts?.ready;
      } catch {
        /* not all browsers expose document.fonts in the cloned tree */
      }
    },
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Scale the canvas width to the page width and slice it across pages.
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
