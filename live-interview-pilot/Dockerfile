FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent.py .
RUN python agent.py download-files && useradd --create-home agent && chown -R agent:agent /app
USER agent
CMD ["python","agent.py","start"]
