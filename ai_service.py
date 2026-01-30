import requests

def get_ai_response(prompt, history_messages, model="llama3.2:latest"):
    """
    prompt: ข้อความใหม่จาก User
    history_messages: รายการ dict [{'role': 'system', 'content': '...'}, {'role': 'user', 'content': '...'}, ...]
    model: ชื่อ Model ที่ต้องการใช้ (ส่งมาจาก app.py)
    """
    url = "http://localhost:11434/api/chat"
    
    # รวมข้อความใหม่เข้าไปในชุดข้อมูลที่จะส่ง
    # หมายเหตุ: history_messages ในที่นี้ควรมี System Instruction รวมอยู่ด้วยแล้วจาก app.py
    payload = {
        "model": model, # ใช้ค่าที่ส่งมาจาก app.py เช่น qwen2.5:7b-instruct
        "messages": history_messages + [{"role": "user", "content": prompt}],
        "stream": False 
    }
    
    try:
        # กำหนด timeout ให้เหมาะสมกับ Model ขนาด 7B
        response = requests.post(url, json=payload, timeout=240) 
        response.raise_for_status()
        return response.json()['message']['content']
    except requests.exceptions.Timeout:
        return "❌ AI ตอบสนองช้าเกินไป (Timeout) กรุณาลองใหม่อีกครั้ง"
    except Exception as e:
        return f"ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}"