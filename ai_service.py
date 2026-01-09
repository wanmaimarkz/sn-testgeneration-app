import requests

def get_ai_response(prompt, history_messages):
    """
    prompt: ข้อความใหม่จาก User
    history_messages: รายการ dict [{'role': 'user', 'content': '...'}, ...] จากฐานข้อมูล
    """
    url = "http://localhost:11434/api/chat"
    
    # รวมประวัติแชททั้งหมดส่งไปให้ Model เพื่อให้มันจำบริบทได้
    payload = {
        "model": "llama3.2:latest",
        "messages": history_messages + [{"role": "user", "content": prompt}],
        "stream": False # ตั้งเป็น False เพื่อให้ส่งคำตอบกลับมาทีเดียว (ง่ายต่อการเริ่มเขียน)
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()['message']['content']
    except Exception as e:
        return f"ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}"