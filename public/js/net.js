/*
    Модуль сетевого взаимодействия
    copyright 2019-2022, Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as INFO    from './info.mjs'

let _url = location.hostname;
    _url = 'ws://'+_url + ':3001';

let socket   = null            //
export let game_id  = 0

const empty_func = ()=>{}
let on_message = empty_func
let on_auth    = empty_func

//
export const set_game_id = id=>game_id=id

export const load_game = id=>{
    game_id = id
    send_json([ INFO.MSG_EDITOR_GET_GAME, game_id ])  
}


// отправляет сообщение на сервер
export const send = d => { if (socket!==null && socket.readyState===1){ socket.send(d) } }

// отправляет сообщение на сервер
export const send_json = d=>send(JSON.stringify(d))

// устанавливает соединение с сервером
const restart_connection = ()=>{ 
    let s = new WebSocket(_url)
    s.binaryType ='arraybuffer'
    s.onopen     = onopen
    s.onmessage  = message
    s.onclose    = onclose
    socket = s
}

// инициализируем работу
export const prepare = (_on_message,_on_auth)=>{
    //let token = window.localStorage.getItem('token');
    //if (token!==null){ 
    //   token  = new String(token).toString()
    //}
    on_message = _on_message
    on_auth = _on_auth
    restart_connection()
}

// действие при установлении соединения
const onopen = ()=>on_message(INFO.MSG_READY,null)

// действие при закрытии соединения
const onclose = ()=>{
    socket = null
    setTimeout(restart_connection,1000)
}

export const dispatch = (type,data)=>on_message(type,data)

// пришло сообщение с сервера
const message = (data)=>{
    if (data.data instanceof ArrayBuffer){ // получаем данные по кадрам
        //message_is_binnary = true
        //message_data = data.data
    }else{
        const a = JSON.parse(data.data)
        const type = parseInt(a.i)
        if (type===INFO.MSG_REG || type===INFO.MSG_LOGIN){
            on_auth(type,a)
        }else{
            on_message(type,a)
        }
    }
}

// выход 
const exit = ()=>{
    //token = ''
    //window.localStorage.removeItem('token')
    if (socket!==null){
        socket.close();
    }
    //clearInterval(timer)
}