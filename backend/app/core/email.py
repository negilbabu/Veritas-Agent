import os
import socket
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.utils import log

# ── Environment Variables ─────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME     = os.getenv("FROM_NAME", "Veritas")
FROM_EMAIL    = os.getenv("FROM_EMAIL", SMTP_USER)
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:3000")
CUSTOM_LOGO_URL = os.getenv("LOGO_URL", "").strip()

# ── CRITICAL FIX: Force IPv4 for SMTP ─────────────────────────────────────────
# Render does not support outbound IPv6. If Python tries to resolve Gmail via IPv6,
# it hangs for 2 minutes and returns [Errno 101] Network is unreachable.
# This forces the socket to ONLY use IPv4 (AF_INET) for the SMTP host.
_orig_getaddrinfo = socket.getaddrinfo

def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == SMTP_HOST:
        family = socket.AF_INET # Strictly force IPv4
    return _orig_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = _ipv4_getaddrinfo
# ──────────────────────────────────────────────────────────────────────────────


def _get_base_url() -> str:
    if not FRONTEND_URL:
        return "http://localhost:3000"
    return FRONTEND_URL.split(",")[0].strip().rstrip("/")

def _get_logo_url(base_url: str) -> str:
    if CUSTOM_LOGO_URL:
        return CUSTOM_LOGO_URL
    if "localhost" in base_url or "127.0.0.1" in base_url:
        return "https://veritas.negilbabu.com/veritas.svg"
    return f"{base_url}/veritas.svg"

def _send(to: str, subject: str, html: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        log.warning("[email] SMTP not configured — skipping send")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))
    
    try:
        # Added timeout=15 so if the network fails, it fails instantly instead of hanging your server
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
            s.ehlo()
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(FROM_EMAIL, to, msg.as_string())
        log.info(f"[email] Sent '{subject}' → {to}")
    except Exception as e:
        log.error(f"[email] Failed to send to {to}: {e}")

def send_verification_email(to: str, name: str, token: str):
    base_url = _get_base_url()
    link = f"{base_url}/auth/verify?token={token}"
    logo_url = _get_logo_url(base_url)
    
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="{logo_url}" alt="Veritas Logo" style="width:48px;height:48px;margin-bottom:12px;display:inline-block;" />
        <h1 style="margin:8px 0 4px;font-size:20px;color:#fff;font-weight:800;">Verify your email</h1>
        <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:0.05em;text-transform:uppercase;">Veritas · Clinical Intelligence</p>
      </div>
      <p style="font-size:14px;color:#cbd5e1;line-height:1.6;">Hi <strong style="color:#fff;">{name}</strong>,</p>
      <p style="font-size:14px;color:#cbd5e1;line-height:1.6;">Please verify your email address to activate your Veritas account. This link expires in <strong style="color:#fff;">24 hours</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{link}" style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;display:inline-block;">Verify Email Address →</a>
      </div>
      <p style="font-size:12px;color:#64748b;line-height:1.6;">If you didn't create an account with Veritas, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0;" />
      <p style="font-size:11px;color:#475569;text-align:center;line-height:1.5;">
        Veritas · Clinical Intelligence Agent<br/>
        This email was sent as part of account registration.<br/>
        Your data is processed in accordance with GDPR (EU 2016/679).
      </p>
    </div>
    """
    _send(to, "Verify your Veritas account", html)

def send_welcome_email(to: str, name: str):
    base_url = _get_base_url()
    logo_url = _get_logo_url(base_url)

    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="{logo_url}" alt="Veritas Logo" style="width:48px;height:48px;margin-bottom:12px;display:inline-block;" />
        <h1 style="margin:8px 0 4px;font-size:20px;color:#fff;font-weight:800;">You're in, {name}!</h1>
        <p style="margin:0;font-size:13px;color:#94a3b8;">Welcome to Veritas</p>
      </div>
      <p style="font-size:14px;color:#cbd5e1;line-height:1.6;">Your account is now active. You can upload clinical documents, ask questions, and access your full chat history — all securely stored.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{base_url}" style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;display:inline-block;">Open Veritas →</a>
      </div>
      <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Your data rights (GDPR)</p>
        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">You can view, export, or permanently delete all your data at any time from your profile settings. We store only what's necessary to provide the service.</p>
      </div>
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
      <p style="font-size:11px;color:#475569;text-align:center;">Veritas · Clinical Intelligence · GDPR-compliant</p>
    </div>
    """
    _send(to, "Welcome to Veritas 🎉", html)

def send_password_changed_email(to: str, name: str):
    base_url = _get_base_url()
    logo_url = _get_logo_url(base_url)

    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="{logo_url}" alt="Veritas Logo" style="width:48px;height:48px;margin-bottom:12px;display:inline-block;" />
      </div>
      <h2 style="color:#fff;margin-top:0;">Password Changed</h2>
      <p style="font-size:14px;color:#cbd5e1;line-height:1.6;">Hi <strong style="color:#fff;">{name}</strong>,</p>
      <p style="font-size:14px;color:#cbd5e1;line-height:1.6;">Your Veritas password was successfully updated. If you made this change, no further action is needed.</p>
      <div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;padding:14px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">⚠️ If you did <strong>not</strong> make this change, please contact support immediately and change your password.</p>
      </div>
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
      <p style="font-size:11px;color:#475569;text-align:center;">Veritas · Clinical Intelligence</p>
    </div>
    """
    _send(to, "Your Veritas password was changed", html)