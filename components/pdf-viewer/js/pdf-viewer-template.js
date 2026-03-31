export const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" data-pdf-viewer-css>
  <div class="pdf-container">
    <iframe id="pdf-viewer-iframe" src="" frameborder="0" allowfullscreen></iframe>
  </div>
`;