
import * as fs from 'fs'
import * as INFO from './public/js/info.mjs'
import * as sqlite3 from 'sqlite3'

const max_users             = 100                         // максимальное количество игроков на сервер
const users                 = new Array(max_users)        // список всех доступных ячеек
const free_users            = new Uint16Array(max_users)  // список свободных ячеек
let active_users_count      = 0                           // количество активных ячеек
const users_by_id           = new Map()                   // хеш таблица пользователи по id
export const users_data     = new Map()

sqlite3.default.verbose()
const DB = new sqlite3.default.Database('./users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users.db database.');
})

DB.serialize(() => {
    DB.run('CREATE TABLE IF NOT EXISTS users(email text NOT NULL UNIQUE PRIMARY KEY, password text, name text, active integer)', (err) => {
        if (err) {
            console.log(err);
            //throw err;
        }
    })
    // 2nd operation (insert into users table statement)
/*    DB.run(`INSERT INTO users(email,password)
              VALUES('petran@pkoulianos.com','QxLUF1bgIAdeQX'),
                    ('petranb2@gmail.com','bv5PehSMfV11Cd')`, (err) => {
        if (err) {
            console.log(err);
            //throw err;
        }
    });
    // 3rd operation (retrieve data from users table)
    DB.each(`SELECT rowid,email FROM users`, (err, row) => {
        if (err) {
            console.log(err);
            //throw err;
        }
        console.log(row);
    }, () => {
        console.log('query completed')
    });
*/
});

// создаем запись о соединении, занимается свободная ячейка
export const new_connection = (socket)=>{
    if (active_users_count<max_users){
        let n = free_users[active_users_count]
        let a = users[n]
        //
        active_users_count = active_users_count + 1
        a.socket = socket
        a.id     = 0
        a.data   = null
        //
        socket.n = a.n
        return true
    }else{
        return false
    }
}

// отправляем игроку по сокету бинарные данные
export function send_bin(user,message){
    //if (user.socket===null){return}
    //if (user.socket.readyState===1){
        try{
            user.socket.send(message)
        }catch(e){
            console.log(message)
        }
    //}else{
    //    user.socket.close()
    //}
}

// отправляем игроку по сокету строку
export function send_str(user,message){
    //if (user.socket===null){return}
    //if (user.socket.readyState===1){
        try{
            user.socket.send(message)
        }catch(e){
            console.log(message)
        }
    //}else{
    //    user.socket.close()
    //}
}



// освобождаем запись о соедниении
export const free_connection = (socket)=>{
    //if (socket===null) { return }
    if (socket.n===undefined){ return }
    let u = users[socket.n]
    u.socket    = null
    u.data      = null
    active_users_count = active_users_count - 1
    free_users[active_users_count] = u.n
    if (u.id!==0){ // освобождаем из активных
        users_by_id.delete(u.id);
        u.id = 0
    }
}


const pass_valid = (pass,min,max)=>{
    const l = pass.length
    if (l > max || l < min){
        return false
    }
    return true
}

const alphanumeric = (name,min,max)=>{
    const f = /^[0-9a-zA-Z]+$/
    if(name.match(f)){
        const l = name.length
        if (l > max || l < min){
            return false
        }
        return true
    }else{
        return false
    }
}

const email_valid = (email)=>{
    const f = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if( email.match(f)){
        return true
    }else{
        return false
    }
}


export const reg = (user,name,email,pass)=>{
    if (    
            !alphanumeric(name,4,20)
         || !email_valid(email)
         || !pass_valid(pass,6,20) 
    ){
        send_str(user,JSON.stringify({
            i   : INFO.MSG_REG,
            err : 1,
        }))
        return 
    }
    //
    DB.run(`INSERT INTO users(email,password,name,active) VALUES(?,?,?,?)`, [email,pass,name,1],(err) => {
        if (err) {
            send_str(user,JSON.stringify({
                i   : INFO.MSG_REG,
                err : 2,
            }))
            //console.log(err)
            //throw err;
            return
        }
        send_str(user,JSON.stringify({
            i   : INFO.MSG_REG,
            err : 0,
        }))
    })
}

export const login = (user,email,pass)=>{
    if (    
            !email_valid(email)
         || !pass_valid(pass,6,20) 
    ){
        send_str(user,JSON.stringify({
            i   : INFO.MSG_LOGIN,
            err : 1,
        }))
        return 
    }
    //
    DB.get(`SELECT rowid,email,name,active FROM users WHERE email=? and password=?`,[email,pass],(err,row) => {
        if (err) {
            //console.log(err)
            //throw err;
            return
        }
        if (row!==undefined && row!==null){
            //
            user.id   = row.rowid
            user.data = row
            users_by_id.set(user.id,user)
            //
            send_str(user,JSON.stringify({
                i   : INFO.MSG_LOGIN,
                err : 0,
                id  : row.rowid,
                name: row.name,
            }))
        }else{
            send_str(user,JSON.stringify({
                i   : INFO.MSG_LOGIN,
                err : 1,
            }))
        }
    })
}

// возращает объект по его n в списке ячеек 
export const get_by_n = n=>users[n]

/*
export function set_user(user){
    let u = users_by_id.get(user.id)
    if (u!==undefined){
        send_str(user,JSON.stringify({
            i   : INFO.MSG_LOGIN,
            err : 2,
        }))
        u.socket.close()
    }
    users_by_id.set(user.id,user)
}
*/

// ----------------------------
//  Инициализация
// ----------------------------
const prepare_users_data = ()=>{

    //db_get_user.get('test@test.ru',(r)=>{
    //    console.log(r)
    //})
    /*
    const users_list = JSON.parse(fs.readFileSync('./users.json'))
    for (let i=0;i<users_list.length;i++){
        let a = users_list[i]
        users_data.set(a.email,a)
    }
    */
}

export function save(){
/*
    let u = []
    for (let [email,a] of users_data){
        u.push(a)
    }
*/
    console.log('close db')
    DB.close((err)=>console.log(err))
}

for (let i=0;i<max_users;i++){
    users[i] = Object.seal({
        n           : i,            // номер в списке
        id          : 0,            // id в БД, 0 - пользователь анонимный
        socket      : null,         // сокет
        data        : null,         // данные из БД
        //
        game_n      : 0,            // номер в которой сейчас находиться игрок
        //
        prev        : null,         // положение в активном списке
        next        : null,         //
    })
    free_users[i] = i
}

prepare_users_data()
