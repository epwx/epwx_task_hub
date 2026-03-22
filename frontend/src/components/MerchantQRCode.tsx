import React, { useRef, useState, useEffect } from "react";
// Utility to detect in-app browsers (Metamask, TrustWallet, etc.) and mobile
function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  // Common wallet/in-app browser indicators
  return /MetaMask|Trust|Coinbase|imToken|TokenPocket|WalletConnect|Opera Mini|OPR\//i.test(ua) ||
    (/android|iphone|ipad|ipod|mobile/i.test(ua) && /wv|; wv\)/i.test(ua));
}

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
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  // Helper to generate a professional SVG for download
  const generateStyledSVG = () => {
    // SVG size and layout
    const width = 340;
    const height = 600;
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

    // Claim instructions (SVG text, multi-line)
    const howToClaim = [
      'How to Claim:',
      '1. Scan the QR code above using your phone camera or QR app.',
      '2. Enable location access when prompted.',
        '3. Connect your wallet (Metamask, TrustWallet, etc.)',
        '   if required.',
      '4. Follow the link to the merchant’s claim page.',
      '5. Submit your bill and details as required.',
      '6. Wait for approval and receive your reward!',
      '',
      'For Merchants: Print and display this QR code at your shop counter for customers to claim rewards easily.'
    ];

    // Compose SVG with border, merchant info, QR code, and instructions
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" fill="${bgColor}" stroke="${borderColor}" stroke-width="4"/>
  <text x="50%" y="48" text-anchor="middle" font-size="22" font-family="${fontFamily}" fill="${textColor}" font-weight="bold">${esc(merchantName || '')}</text>
  <text x="50%" y="78" text-anchor="middle" font-size="14" font-family="${fontFamily}" fill="${textColor}">${esc(merchantAddress || '')}</text>
  <g transform="translate(${(width - qrSize) / 2}, 100)">
    ${qrSvg}
  </g>
  <text x="50%" y="${100 + qrSize + 40}" text-anchor="middle" font-size="16" font-family="${fontFamily}" fill="${textColor}">Scan to claim rewards</text>
  <g font-family="${fontFamily}" font-size="13" fill="#333">
    <text x="20" y="${100 + qrSize + 70}" font-weight="bold">${esc(howToClaim[0])}</text>
    <text x="28" y="${100 + qrSize + 95}">${esc(howToClaim[1])}</text>
    <text x="28" y="${100 + qrSize + 115}">${esc(howToClaim[2])}</text>
    <text x="28" y="${100 + qrSize + 135}">${esc(howToClaim[3])}</text>
    <text x="28" y="${100 + qrSize + 155}">${esc(howToClaim[4])}</text>
    <text x="28" y="${100 + qrSize + 175}">${esc(howToClaim[5])}</text>
      <text x="28" y="${100 + qrSize + 195}">${esc(howToClaim[6])}</text>
      <text x="28" y="${100 + qrSize + 225}" font-size="12" fill="#666">${esc(howToClaim[8])}</text>
  </g>
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
        {!inApp ? (
          <button onClick={downloadQR} style={{ padding: '8px 16px', borderRadius: 4, background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Download QR Code
          </button>
        ) : (
          <div style={{ color: '#b91c1c', fontWeight: 500, fontSize: 15, marginTop: 8, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
            <span>Download not supported in this browser.<br />
            <span style={{ color: '#222' }}>Long-press the QR code above to save it as an image.</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantQRCode;
