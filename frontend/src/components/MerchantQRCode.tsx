import React, { useRef } from "react";
import QRCode from "react-qr-code";

interface MerchantQRCodeProps {
  url: string;
  merchantName?: string;
}

interface MerchantQRCodeProps {
  url: string;
  merchantName?: string;
  merchantAddress?: string;
}

const MerchantQRCode: React.FC<MerchantQRCodeProps> = ({ url, merchantName, merchantAddress }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Helper to generate a professional SVG for download
  const generateStyledSVG = () => {
    // SVG size and layout
    const width = 320;
    const height = 420;
    const qrSize = 200;
    const borderRadius = 24;
    const borderColor = '#0070f3';
    const bgColor = '#fff';
    const textColor = '#222';
    const fontFamily = 'Arial, sans-serif';
    // Escape XML special chars
    const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Get QR code SVG markup from the rendered QRCode
    const qrSvg = svgRef.current ? svgRef.current.outerHTML : '';

    // Compose SVG with border, merchant info, and QR code
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" fill="${bgColor}" stroke="${borderColor}" stroke-width="4"/>
  <text x="50%" y="48" text-anchor="middle" font-size="22" font-family="${fontFamily}" fill="${textColor}" font-weight="bold">${esc(merchantName || '')}</text>
  <text x="50%" y="78" text-anchor="middle" font-size="14" font-family="${fontFamily}" fill="${textColor}">${esc(merchantAddress || '')}</text>
  <g transform="translate(${(width - qrSize) / 2}, 100)">
    ${qrSvg}
  </g>
  <text x="50%" y="${100 + qrSize + 40}" text-anchor="middle" font-size="16" font-family="${fontFamily}" fill="${textColor}">Scan to claim rewards</text>
</svg>`;
  };

  const downloadQR = () => {
    const svgContent = generateStyledSVG();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const urlBlob = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = `${merchantName || 'merchant'}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlBlob);
  };

  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      {merchantName && <h3 style={{ marginBottom: '0.5rem' }}>{merchantName}</h3>}
      {merchantAddress && <div style={{ marginBottom: '1rem', color: '#555', fontSize: 14 }}>{merchantAddress}</div>}
      <div style={{ background: '#fff', padding: '16px', display: 'inline-block', border: '2px solid #0070f3', borderRadius: 16 }}>
        {/* @ts-ignore: react-qr-code does not type ref, but it works */}
        <QRCode ref={svgRef} value={url} size={200} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={downloadQR} style={{ padding: '8px 16px', borderRadius: 4, background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Download QR Code
        </button>
      </div>
    </div>
  );
};

export default MerchantQRCode;
