from flask import Flask, flash, jsonify, redirect, render_template, request, url_for, get_flashed_messages
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from ai_service import get_ai_response
from models import db, User, Folder, ChatSession, Message, GenType, RoleType

app = Flask(__name__)
# Configuration
app.config['SECRET_KEY'] = 'testgen_app_sn_2_2568'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:wanzaza123@localhost:5432/testgen-app' #your postgresql
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = None

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

# <--- main pages --->
@app.route('/')
@login_required
def index():
    recent_chats = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.created_at.desc()).limit(5).all()
    return render_template('index.html', active_page='home', recent_chats=recent_chats)

# แก้ไข: เปลี่ยนจาก redirect ไปเป็นการเปิด Template เปล่า (Session ยังไม่ถูกสร้างใน DB)
@app.route('/test-case')
@login_required
def test_case():
    return render_template('test_case.html', session=None, active_page='case')

@app.route('/test-script')
@login_required
def test_script():
    return render_template('test_script.html', session=None, active_page='script')


# <--- Auth --->
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        pwd = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, pwd):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')
            
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fname = request.form.get('first_name')
        lname = request.form.get('last_name')
        email = request.form.get('email')
        pwd = request.form.get('password')
        
        user_exists = User.query.filter_by(email=email).first()
        if user_exists:
            flash('This email is already registered!', 'error') 
            return redirect(url_for('signup'))

        hashed_password = generate_password_hash(pwd)
        new_user = User(
            first_name=fname,
            last_name=lname,
            email=email,
            password=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
        
    return render_template('signup.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))


# <--- Chats --->
@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.json
        session_id = data.get('session_id') # รับค่า session_id (อาจเป็น null หรือ "null")
        user_content = data.get('message')
        gen_type_str = data.get('type') # รับประเภทหน้า (case/script) จาก Frontend
        
        # 1. Logic การจัดการ Session (สร้างใหม่เฉพาะเมื่อไม่มี session_id)
        if not session_id or session_id == "null":
            g_type = GenType.case if gen_type_str == 'case' else GenType.script
            chat_session = ChatSession(
                user_id=current_user.id, 
                generator_type=g_type,
                title=user_content[:40] + ( '...' if len(user_content) > 40 else '' )
            )
            db.session.add(chat_session)
            db.session.flush() # ดึง ID มาใช้โดยยังไม่ปิด Transaction
            session_id = chat_session.id
        else:
            chat_session = ChatSession.query.get_or_404(session_id)
            if chat_session.user_id != current_user.id:
                return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # 2. ตั้งค่า System Instruction
        system_instructions = ""
        if chat_session.generator_type == GenType.case:
            system_instructions = "You are a QA Expert. Generate detailed Test Cases in Markdown Table format."
        else:
            system_instructions = "You are a Senior Developer. Generate clean, executable Test Scripts (e.g., Robot Framework or Python)."

        # 3. เตรียมประวัติการแชท (รวม System Prompt)
        history = [{"role": "system", "content": system_instructions}]
        for m in chat_session.messages:
            history.append({"role": m.role.name, "content": m.content})
        
        # 4. บันทึกข้อความ User
        user_msg = Message(session_id=session_id, role=RoleType.user, content=user_content)
        db.session.add(user_msg)
        
        # 5. เรียก AI Service
        ai_content = get_ai_response(user_content, history)
        
        # 6. บันทึกคำตอบ AI
        ai_msg = Message(session_id=session_id, role=RoleType.assistant, content=ai_content)
        db.session.add(ai_msg)
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "session_id": session_id, # ส่งกลับไปเพื่อให้ Frontend เก็บไว้ส่งในครั้งหน้า
            "answer": ai_content,
            "chat_title": chat_session.title
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/new-chat/<type>')
@login_required
def new_chat(type):
    g_type = GenType.case if type == 'case' else GenType.script
    new_session = ChatSession(user_id=current_user.id, generator_type=g_type)
    db.session.add(new_session)
    db.session.commit()
    return redirect(url_for('view_chat', session_id=new_session.id))

@app.route('/chat/<int:session_id>')
@login_required
def view_chat(session_id):
    chat_session = ChatSession.query.get_or_404(session_id)
    if chat_session.user_id != current_user.id:
        return redirect(url_for('index'))
    
    active_page = chat_session.generator_type.name
    template = 'test_case.html' if active_page == 'case' else 'test_script.html'
    return render_template(template, session=chat_session, active_page=active_page)


# <--- chat management --->
@app.route('/api/chat/<int:session_id>/rename', methods=['POST'])
@login_required
def rename_chat(session_id):
    chat = ChatSession.query.get_or_404(session_id)
    if chat.user_id != current_user.id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    new_title = request.json.get('title')
    if new_title:
        chat.title = new_title
        db.session.commit()
        return jsonify({"status": "success", "message": "Chat renamed"})
    return jsonify({"status": "error", "message": "Title is required"}), 400

@app.route('/api/chat/<int:session_id>/delete', methods=['DELETE'])
@login_required
def delete_chat(session_id):
    chat = ChatSession.query.get_or_404(session_id)
    if chat.user_id != current_user.id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    db.session.delete(chat)
    db.session.commit()
    return jsonify({"status": "success", "message": "Chat deleted"})

@app.route('/api/chat/<int:session_id>/move', methods=['POST'])
@login_required
def move_chat(session_id):
    chat = ChatSession.query.get_or_404(session_id)
    folder_id = request.json.get('folder_id') # ส่งมาเป็น null ได้ถ้าจะเอาออกนอกโฟลเดอร์
    chat.folder_id = folder_id
    db.session.commit()
    return jsonify({"status": "success"})


# <--- folder management --->
@app.route('/api/folder/create', methods=['POST'])
@login_required
def create_folder():
    name = request.json.get('name', 'New Folder')
    new_folder = Folder(name=name, user_id=current_user.id)
    db.session.add(new_folder)
    db.session.commit()
    return jsonify({"status": "success", "id": new_folder.id})

@app.route('/api/folder/<int:folder_id>/rename', methods=['POST'])
@login_required
def rename_folder(folder_id):
    folder = Folder.query.get_or_404(folder_id)
    if folder.user_id != current_user.id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    new_name = request.json.get('name')
    if new_name:
        folder.name = new_name
        db.session.commit()
        return jsonify({"status": "success", "message": "Folder renamed"})
    return jsonify({"status": "error", "message": "Name is required"}), 400

@app.route('/api/folder/<int:folder_id>/delete', methods=['DELETE'])
@login_required
def delete_folder(folder_id):
    folder = Folder.query.get_or_404(folder_id)
    if folder.user_id != current_user.id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    db.session.delete(folder)
    db.session.commit()
    return jsonify({"status": "success", "message": "Folder deleted"})


if __name__ == "__main__":
    app.run(debug=True)