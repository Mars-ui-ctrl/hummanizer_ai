const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Rewrite text using the specified method.
 * @param {string} text - The text to rewrite
 * @param {string} endpoint - The method endpoint (e.g., '/method1')
 * @returns {Promise<{result: string, method: number}>}
 */
export async function rewriteText(text, endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Rewrite failed (${response.status})`);
  }

  return response.json();
}

/**
 * Upload a PDF file and extract text.
 * @param {File} file - The PDF file to upload
 * @returns {Promise<{text: string, pages: number, filename: string}>}
 */
export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed (${response.status})`);
  }

  return response.json();
}

/**
 * Download text as a file in the specified format.
 * @param {string} text - The text to download
 * @param {'pdf' | 'docx' | 'txt'} format - The output format
 * @param {string} [filename] - Optional filename
 */
export async function downloadFile(text, format, filename = 'humanized-text') {
  const response = await fetch(`${API_URL}/download/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Download failed (${response.status})`
    );
  }

  // Create a blob from the response and trigger download
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
