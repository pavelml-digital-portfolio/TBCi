import { useEffect, useState } from "react";
import QRCode from "qrcode";
export default function QrCode({
  value,
  label = "Demo QR code",
}: {
  value: string;
  label?: string;
}) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    QRCode.toDataURL(value, {
      width: 224,
      margin: 3,
      errorCorrectionLevel: "M",
      color: { dark: "#1d223b", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [value]);
  return (
    <div className="wallet-qr" data-payload={value}>
      {src ? (
        <img src={src} width="224" height="224" alt={label} />
      ) : (
        <span role="status">
          {error ? "QR unavailable; copy the address below." : "Generating QR…"}
        </span>
      )}
    </div>
  );
}
