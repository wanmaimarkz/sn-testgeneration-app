from flask import Flask, flash, jsonify, redirect, render_template, request, url_for, get_flashed_messages
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_mail import Mail, Message as MailMessage
from itsdangerous import URLSafeTimedSerializer as Serializer
from werkzeug.security import generate_password_hash, check_password_hash
from ai_service import get_ai_response
from models import db, User, Folder, ChatSession, Message, GenType, RoleType
from datetime import datetime

app = Flask(__name__)
# Configuration
# DB config.
app.config['SECRET_KEY'] = 'testgen_app_sn_2_2568'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:wanzaza123@localhost:5432/testgen-app' #your postgresql
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email config.
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'yyyyyyy2345678901@gmail.com'
app.config['MAIL_PASSWORD'] = 'hstj wjnj aayi gfhj'
mail = Mail(app)


db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = None

def get_reset_token(user_id, expires_sec=1800):
    s = Serializer(app.config['SECRET_KEY'])
    return s.dumps({'user_id': user_id})

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

# <--- Main Pages --->
@app.route('/')
@login_required
def index():
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    folders = Folder.query.filter_by(user_id=current_user.id).all()
    return render_template('index.html', active_page='home', sessions=sessions, folders=folders)

@app.route('/test-case')
@login_required
def test_case():
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return render_template('test_case.html', session=None, active_page='case', sessions=sessions)

@app.route('/test-script')
@login_required
def test_script():
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return render_template('test_script.html', session=None, active_page='script', sessions=sessions)


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

# <--- Profile Management --->
@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', active_page='profile')

@app.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    # 1. เช็ครหัสผ่านปัจจุบันก่อนเสมอ
    if not check_password_hash(current_user.password, current_password):
        flash("The current password is incorrect.", "error-current") # ส่งเข้าหมวด error-current
        return redirect(url_for('profile'))

    # 2. กรณีอัปเดตรหัสผ่านใหม่
    if new_password:
        if new_password != confirm_password:
            flash("The new password does not match the one that was verified.", "error-confirm") # ส่งเข้าหมวด error-confirm
            return redirect(url_for('profile'))
        
        if len(new_password) < 6:
            flash("The new password must be at least 6 characters long.", "error-confirm")
            return redirect(url_for('profile'))
        
        current_user.password = generate_password_hash(new_password)

    # 3. อัปเดตข้อมูลทั่วไป
    current_user.first_name = first_name
    current_user.last_name = last_name

    try:
        db.session.commit()
        flash("Data edited successfully!", "success")
    except Exception as e:
        db.session.rollback()
        flash("An error occurred recording.", "error-current")

    return redirect(url_for('profile'))


# <--- Chats --->
@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.json
        session_id = data.get('session_id')
        user_content = data.get('message')
        gen_type_str = data.get('type') # รับค่า 'case' หรือ 'script' มาจาก Frontend

        # เลือก Model ตามประเภทงานที่ระบุมา
        if gen_type_str == 'case':
            model_name = "qwen2.5:7b-instruct"
        elif gen_type_str == 'script':
            model_name = "qwen2.5-coder:7b-instruct"
        else:
            model_name = "llama3.2"
        
        # 1. Logic การจัดการ Session
        if not session_id or session_id == "null":
            g_type = GenType.case if gen_type_str == 'case' else GenType.script
            chat_session = ChatSession(
                user_id=current_user.id, 
                generator_type=g_type,
                title=user_content[:40] + ( '...' if len(user_content) > 40 else '' )
            )
            db.session.add(chat_session)
            db.session.flush() 
            session_id = chat_session.id
        else:
            chat_session = ChatSession.query.get_or_404(session_id)
            if chat_session.user_id != current_user.id:
                return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # 2. ตั้งค่า System Instruction (ปรับปรุงให้ดึงประสิทธิภาพ Qwen 2.5)
        if chat_session.generator_type == GenType.case:
            system_instructions = (
                "You are a top software tester. Your sole task is to generate a detailed Markdown table "
                "of test cases based on a given requirement. Consider edge cases and negative cases. "
                "The table MUST include the following columns: "
                "| ID | Scenario | Prerequisites | Steps | Test Data | Expected Results | Actual Results | Status |\n"
                "|---|---|---|---|---|---|---|---|\n"
                "Instructions:\n"
                "1. Start ID at 'TC-001' if not specified.\n"
                "2. 'Steps' must be a bulleted list within the table cell.\n"
                "3. 'Actual Results' and 'Status' must be left empty.\n"
                "4. Output ONLY the table. Do not write any conversational text."
            )
        else:
            # เน้นความสามารถของ Qwen Coder ในการเขียน Code และ Syntax
            system_instructions = (
                "You are a Senior Automation Engineer. Your task is to generate clean, executable, "
                "and well-documented Test Scripts (e.g., Robot Framework, Selenium with Python, or Cypress). "
                "ALWAYS wrap your code in Markdown code blocks (e.g., ```python). "
                "Explain the logic briefly with comments inside the code block."
            )

        # 3. เตรียมประวัติการแชท
        history = [{"role": "system", "content": system_instructions}]
        for m in chat_session.messages:
            history.append({"role": m.role.name, "content": m.content})
        
        # 4. บันทึกข้อความ User ก่อนเรียก AI
        user_msg = Message(session_id=session_id, role=RoleType.user, content=user_content)
        db.session.add(user_msg)
        
        # 5. เรียก AI Service
        ai_content = get_ai_response(user_content, history, model=model_name)
        
        # 6. บันทึกคำตอบ AI และอัปเดตเวลาล่าสุด
        ai_msg = Message(session_id=session_id, role=RoleType.assistant, content=ai_content)
        db.session.add(ai_msg)
        chat_session.updated_at = datetime.now() # เพื่อให้แชทล่าสุดอยู่บนสุดในหน้า Index
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "session_id": session_id,
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
    
    # ดึงข้อมูล sessions ทั้งหมดส่งไปด้วยเพื่อให้ Sidebar อัปเดตลิสต์
    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).all()
    active_page = chat_session.generator_type.name
    template = 'test_case.html' if active_page == 'case' else 'test_script.html'
    return render_template(template, session=chat_session, active_page=active_page, sessions=sessions)


# <--- Chat Management --->
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


# <--- Folder Management --->
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


# <--- Reset Password --->
@app.route("/reset_password", methods=['GET', 'POST'])
def reset_request():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            token = get_reset_token(user.id)
            try:
                msg = MailMessage(
                    subject='Password Reset Request',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[user.email]
                )
                msg.body = f'''To reset your password, visit the following link:
                {url_for('reset_token', token=token, _external=True)}

                If you did not make this request, simply ignore this email.
                '''
                mail.send(msg)
                flash('An email has been sent with instructions to reset your password.', 'success')
                return redirect(url_for('login'))
            except Exception as e:
                flash(f'Error sending email: {str(e)}', 'error')
                return redirect(url_for('reset_request'))
        else:
            flash('This email address is not registered in our system.', 'error')
            return redirect(url_for('reset_request'))
            
    return render_template('reset_request.html')

@app.route("/reset_password/<token>", methods=['GET', 'POST'])
def reset_token(token):
    s = Serializer(app.config['SECRET_KEY'])
    try:
        user_id = s.loads(token)['user_id']
    except:
        flash('That is an invalid or expired token', 'danger')
        return redirect(url_for('reset_request'))
    
    user = User.query.get(user_id)
    if request.method == 'POST':
        new_password = request.form.get('password')
        user.password = generate_password_hash(new_password)
        db.session.commit()
        flash('Your password has been updated!', 'success')
        return redirect(url_for('login'))
    return render_template('reset_token.html')

if __name__ == "__main__":
    app.run(debug=True)