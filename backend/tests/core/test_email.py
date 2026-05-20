import pytest
from unittest.mock import patch, MagicMock
from app.core import email

def test_individual_template_builders():
    """Validate that template composition handles token string generation parameters securely."""
    with patch("app.core.email._send") as mock_send:
        email.send_verification_email("user@test.com", "Negil", "security_token_xyz")
        mock_send.assert_called_once()
        assert "security_token_xyz" in mock_send.call_args[0][2]

    with patch("app.core.email._send") as mock_send:
        email.send_welcome_email("user@test.com", "Negil")
        mock_send.assert_called_once()
        assert "Welcome to Veritas" in mock_send.call_args[0][1]

    with patch("app.core.email._send") as mock_send:
        email.send_password_changed_email("user@test.com", "Negil")
        mock_send.assert_called_once()
        # FIX: Matches your exact implementation phrasing: "successfully updated"
        assert "successfully updated" in mock_send.call_args[0][2]

def test_send_email_unconfigured_log(caplog):
    """Verify that execution exits early with a warning if credentials are blank."""
    with patch("app.core.email.SMTP_USER", ""):
        email._send("dest@test.com", "Subject", "html")
        assert "SMTP not configured" in caplog.text

@patch("smtplib.SMTP_SSL")
def test_send_email_port_465_ssl(mock_smtp_ssl):
    """Test standard direct SSL connection workflow branch for port 465."""
    with patch("app.core.email.SMTP_USER", "user@test.com"), \
         patch("app.core.email.SMTP_PASSWORD", "secret"), \
         patch("app.core.email.SMTP_PORT", 465):
         
        mock_session = MagicMock()
        mock_smtp_ssl.return_value.__enter__.return_value = mock_session
        
        email._send("target@test.com", "Test Title", "<body>Content</body>")
        mock_smtp_ssl.assert_called_with(email.SMTP_HOST, 465, timeout=15)
        mock_session.login.assert_called_once()

@patch("smtplib.SMTP")
def test_send_email_port_587_tls(mock_smtp):
    """Test STARTTLS secure upscaling pipeline branch for port 587 or custom rules."""
    with patch("app.core.email.SMTP_USER", "user@test.com"), \
         patch("app.core.email.SMTP_PASSWORD", "secret"), \
         patch("app.core.email.SMTP_PORT", 587):
         
        mock_session = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_session
        
        email._send("target@test.com", "Test Title", "<body>Content</body>")
        mock_session.starttls.assert_called_once()
        mock_session.login.assert_called_once()