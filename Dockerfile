FROM python:3.11-slim

WORKDIR /app

RUN ls
RUN apt update -y && apt install -y git build-essential

COPY . .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r src/requirements.txt

CMD ["ls"]
CMD ["python", "src/main.py"]