
// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// PDF viewer variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let canvas = document.getElementById('pdfCanvas');
let ctx = canvas.getContext('2d');

// Get PDF URL from query parameter
const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = urlParams.get('pdf');

// PDF viewer controls
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageNumSpan = document.getElementById('pageNum');
const pageCountSpan = document.getElementById('pageCount');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomLevelSpan = document.getElementById('zoomLevel');
const downloadBtn = document.getElementById('downloadPdf');
const loader = document.getElementById('pdfLoader');

// Render page
function renderPage(num) {
  pageRendering = true;
  loader.style.display = 'flex';
  
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({scale: scale});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    
    renderTask.promise.then(function() {
      pageRendering = false;
      loader.style.display = 'none';
      
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  pageNumSpan.textContent = num;
}

// Queue page rendering
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

// Show previous page
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

// Show next page
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

// Zoom in
function onZoomIn() {
  scale += 0.25;
  zoomLevelSpan.textContent = Math.round(scale * 100) + '%';
  queueRenderPage(pageNum);
}

// Zoom out
function onZoomOut() {
  if (scale <= 0.5) return;
  scale -= 0.25;
  zoomLevelSpan.textContent = Math.round(scale * 100) + '%';
  queueRenderPage(pageNum);
}

// Download PDF
function downloadPdf() {
  if (pdfUrl) {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfUrl.split('/').pop();
    link.click();
  }
}

// Event listeners
prevBtn.addEventListener('click', onPrevPage);
nextBtn.addEventListener('click', onNextPage);
zoomInBtn.addEventListener('click', onZoomIn);
zoomOutBtn.addEventListener('click', onZoomOut);
downloadBtn.addEventListener('click', downloadPdf);

// Load PDF
if (pdfUrl) {
  pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageCountSpan.textContent = pdfDoc.numPages;
    
    // Initial page render
    renderPage(pageNum);
  }).catch(function(error) {
    console.error('Error loading PDF:', error);
    loader.innerHTML = '<p>Error loading PDF. Please try again.</p>';
  });
} else {
  loader.innerHTML = '<p>No PDF specified. Please go back and select a PDF.</p>';
}
