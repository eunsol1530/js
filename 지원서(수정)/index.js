const express = require('express');
const app = express();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

mongoose.connect('mongodb://127.0.0.1:27017/loginDemo', {
  
})
.then(() => {
    console.log("몽고 연결완료!!!!!!!!!!!!!!!!!");
})
.catch(err => {
    console.log("MONGO Error connecting to MongoDB");
    console.error(err);
})

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true}));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'fallbacksecret', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        maxAge: 60000, // Example expiration time (1 minute)
        path: '/',
        domain: 'localhost' // Adjust as necessary
    }
}))

const requireLogin = (req, res, next) => {
    if(!req.session.user_id) {
        return res.redirect('/notlogin')
    }
    next();
} //미들웨어에 로그인 판별여부를 시험하는 기능을 추가하여 아래에서 로그인 해야
  //볼수있는 페이지를 설정할때 활용한다.

app.get('/notlogin', (req, res) => {
    res.send('로그인을 해야 확인할 수 있습니다.')
})

app.get('/err', (req, res) => {
    res.send('username이나 password가 올바르지 않습니다!!!')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async (req, res) => {
    const { password, username, name, motivated } = req.body;
    const hash = await bcrypt.hash(password, 12)
    const user = new User({ //회원가입에 입력한 정보를DB에 저장
        username,
        password: hash,
        name,
        motivated
    })
    await user.save();
    req.session.user_id = user._id;
    res.redirect('/login')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => { //로그인 라우트
    const { password, username, name, motivated } = req.body;
    const user = await User.findOne({ username });
    const vaildPassword = await bcrypt.compare(password, user.password) //입력한 비밀번호를 해시하여 DB에 저장된 해시된 비밀번호와 비교
    if (vaildPassword) {
        req.session.user_id = user._id; //페이지를 새로고침할때 생성되는 쿠키와 함께
        res.redirect('/secret'); //성공->이후 페이지
    }
    else {
        res.redirect('/err'); //실패->다시 로그인창
    }
})

app.post('/logout', (req, res) => { //로그아웃 라우트
    req.session.user_id = null;
    res.redirect('/login');
})

app.get('/secret', requireLogin, (req, res) => {
    // if(!req.session.user_id) {
    //     return res.redirect('/login') //return을 사용하는 이유는 밑에 코드와 충돌하지안도록
    // } //로그인을 하지않았다면 로그인창으로 이동
    //위의 코드를 미들웨어에 저장
    res.render('secret')
})

app.get('/topsecret', requireLogin, (req, res) => {
    res.send("TOP SECRET!!!")
})

app.listen(3000, () => { //nodemon(서버 열기)
    console.log("서버 접속 완료!!!")
})