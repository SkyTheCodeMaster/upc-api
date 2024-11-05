FROM python:3.13-slim

WORKDIR /app

RUN echo $(ls)

COPY . .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r src/requirements.txt

CMD ["python", "main.py"]