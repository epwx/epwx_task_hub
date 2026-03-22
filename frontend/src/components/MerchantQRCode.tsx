import React, { useRef } from "react";
import QRCode from "react-qr-code";

interface MerchantQRCodeProps {
  url: string;
  merchantName?: string;
}

const MerchantQRCode: React.FC<MerchantQRCodeProps> = ({ url, merchantName }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const downloadQR = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const urlBlob = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = urlBlob;
    link.download = `${merchantName || "merchant"}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlBlob);
  };

  return (
    <div style={{ textAlign: "center", margin: "2rem 0" }}>
      {merchantName && <h3 style={{ marginBottom: "1rem" }}>{merchantName}</h3>}
      <div style={{ background: "white", padding: "16px", display: "inline-block" }}>
        {/* @ts-ignore: react-qr-code does not type ref, but it works */}
        <QRCode ref={svgRef} value={url} size={200} />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button onClick={downloadQR} style={{ padding: "8px 16px", borderRadius: 4, background: "#0070f3", color: "white", border: "none", cursor: "pointer" }}>
          Download QR Code
        </button>
      </div>
    </div>
  );
};

export default MerchantQRCode;
