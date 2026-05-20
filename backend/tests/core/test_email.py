from app.core.email import send_verification_email, send_welcome_email
from unittest.mock import patch
from app.core import email

@patch("app.core.email._send")
def test_send_verification_email(mock_send):
    send_verification_email("test@user.com", "Negil", "token123")
    mock_send.assert_called_once()
    args, _ = mock_send.call_args
    assert "Verify your Veritas account" in args[1]
    assert "token123" in args[2]

@patch("app.core.email._send")
def test_send_welcome_email(mock_send):
    send_welcome_email("test@user.com", "Negil")
    mock_send.assert_called_once()
    assert "Welcome to Veritas" in mock_send.call_args[0][1]

@patch("smtplib.SMTP_SSL")
def test_send_ssl_logic(mock_smtp_ssl):
    with patch("app.core.email.SMTP_PORT", 465):
        email._send("to@test.com", "Sub", "<html></html>")
        mock_smtp_ssl.assert_called_with(email.SMTP_HOST, 465, timeout=15)

@patch("smtplib.SMTP")
def test_send_tls_logic(mock_smtp):
    with patch("app.core.email.SMTP_PORT", 587):
        email._send("to@test.com", "Sub", "<html></html>")
        mock_smtp.assert_called()