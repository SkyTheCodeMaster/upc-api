FROM python:3.13-slim

WORKDIR /app

CMD ["git", "clone", "https://github.com/SkyTheCodeMaster/upc-api.git", "/app/"]

CMD ["ls"]
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]