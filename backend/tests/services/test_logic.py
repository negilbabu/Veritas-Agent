import pytest
from unittest.mock import patch, MagicMock
from app.services.ingestor import process_pdf

@patch("app.services.ingestor.pypdf.PdfReader")
@patch("app.services.ingestor.vector_service.client.upsert")
@patch("app.services.ingestor.embeddings_model")
def test_process_pdf_logic(mock_embeddings, mock_upsert, mock_pdf):
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Clinical text contents."
    mock_pdf.return_value.pages = [mock_page]
    mock_embeddings.embed_query.return_value = [0.1] * 384
    
    # Test execution trace path including user_id injection
    num_chunks = process_pdf(b"dummy", "test.pdf", "sess-1", user_id="user-123")
    assert num_chunks > 0
    mock_upsert.assert_called()

@patch("app.services.ingestor.pypdf.PdfReader")
@patch("app.services.ingestor.vector_service.client.upsert")
@patch("app.services.ingestor.embeddings_model")
def test_process_pdf_empty(mock_embeddings, mock_upsert, mock_pdf):
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "   "
    mock_pdf.return_value.pages = [mock_page]
    
    num_chunks = process_pdf(b"dummy", "empty.pdf", "sess-2")
    assert num_chunks == 0