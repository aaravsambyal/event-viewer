import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-gov-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 64, height: 64, background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <ShieldOff size={28} color="var(--color-gov-danger)" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-gov-text)", marginBottom: 10 }}>
          Access Restricted
        </h1>
        <p style={{ color: "var(--color-gov-muted)", lineHeight: 1.7, marginBottom: 24 }}>
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/" className="btn-primary">Go to Home</Link>
          <Link href="/login" className="btn-outline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
