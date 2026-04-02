import logging
import sys


def setup_logging():
    logger = logging.getLogger("veritas")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - [%(name)s] [%(filename)s:%(lineno)d] - %(message)s'
        )
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


log = setup_logging()