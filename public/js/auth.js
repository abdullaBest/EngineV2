/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/

import * as NET  from './net.js'
import * as INFO from './info.mjs'

const show    = (a)=>a.el.style.display='block'
const hide    = (a)=>a.el.style.display='none'
const disable = (a)=>a.el.disabled=true
const enable  = (a)=>a.el.disabled=false

const pass_valid = (pass,min,max)=>{
    const l = pass.value.length
    if (l > max || l < min){
        alert('Password should not be empty / length be between '+min+' to '+max)
        pass.focus()
        return false
    }
    return true
}

const alphanumeric = (name,min,max)=>{
    const f = /^[0-9a-zA-Z]+$/
    if(name.value.match(f)){
        const l = name.value.length
        if (l > max || l < min){
            alert('name should not be empty / length be between '+min+' to '+max)
            name.focus()
            return false
        }
        return true
    }else{
        alert('User name must have alphanumeric characters only')
        name.focus()
        return false
    }
}

const email_valid = (email)=>{
    const f = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if( email.value.match(f)){
        return true
    }else{
        alert('You have entered an invalid email address!')
        email.focus()
        return false
    }
}

export const on_message = (type,m)=>{
    if (type===INFO.MSG_REG){
        enable($.AUTH.reg.name)
        enable($.AUTH.reg.email)
        enable($.AUTH.reg.pass)
        enable($.AUTH.reg.btn)
        enable($.AUTH.reg.switch_login)    
        enable($.AUTH.login.switch_reg)
        if (m.err===0){
            // регистрация прошла успешно
            hide($.AUTH.reg)
            show($.AUTH.login)
            $.AUTH.login.email.el.value = $.AUTH.reg.email.el.value
            $.AUTH.login.pass.el.value = $.AUTH.reg.pass.el.value
            //
            if ('credentials' in navigator) {
                navigator.credentials.store(new window.PasswordCredential({
                    id      : $.AUTH.reg.email.el.value,
                    password: $.AUTH.reg.pass.el.value
                }))
            }
            //
            $.AUTH.reg.email.el.value = ''
            $.AUTH.reg.pass.el.value = ''
            $.AUTH.reg.name.el.value = ''
        }else{
            alert('email already registered')
        }
    }
    if (type===INFO.MSG_LOGIN){
        enable($.AUTH.login.email)
        enable($.AUTH.login.pass)
        enable($.AUTH.login.btn)
        enable($.AUTH.reg.switch_login)    
        enable($.AUTH.login.switch_reg)
        if (m.err===0){
            // авторизация прошла успешно
            hide($.AUTH.reg)
            hide($.AUTH.login)
            hide($.AUTH)
            $.AUTH.login.email.el.value = ''
            $.AUTH.login.pass.el.value = ''
            $.AUTH.reg.email.el.value = ''
            $.AUTH.reg.pass.el.value = ''
            $.AUTH.reg.name.el.value = ''
            //
            NET.dispatch(INFO.MSG_LOGIN,null)
        }else{
            alert('email or password incorrect')
        }
    }
}

export const prepare = ()=>{
    hide($.AUTH)
    hide($.AUTH.login)
    hide($.AUTH.reg)
    //
    $.AUTH.reg.el.onsubmit = (e)=>{
        if (    
               !alphanumeric($.AUTH.reg.name.el,4,20)
            || !email_valid($.AUTH.reg.email.el)
            || !pass_valid($.AUTH.reg.pass.el,6,20) 
        ){
            return false
        }

        disable($.AUTH.reg.name)
        disable($.AUTH.reg.email)
        disable($.AUTH.reg.pass)
        disable($.AUTH.reg.btn)
        disable($.AUTH.reg.switch_login)    
        disable($.AUTH.login.switch_reg)
        NET.send(JSON.stringify([
            INFO.MSG_REG,
            $.AUTH.reg.name.el.value,
            $.AUTH.reg.email.el.value,
            $.AUTH.reg.pass.el.value
        ]))

        return false
    }
    //
    $.AUTH.login.el.onsubmit = (e)=>{
        if (    
               !email_valid($.AUTH.login.email.el)
            || !pass_valid($.AUTH.login.pass.el,6,20) 
        ){
            return false
        }

        disable($.AUTH.login.email)
        disable($.AUTH.login.pass)    
        disable($.AUTH.login.btn)    
        disable($.AUTH.reg.switch_login)    
        disable($.AUTH.login.switch_reg)
        //
        NET.send(JSON.stringify([
            INFO.MSG_LOGIN,
            $.AUTH.login.email.el.value,
            $.AUTH.login.pass.el.value
        ]))

        return false
    }
    //
    $.AUTH.reg.switch_login.el.onclick = ()=>{
        show($.AUTH.login)
        hide($.AUTH.reg)
        return false
    }
    $.AUTH.login.switch_reg.el.onclick = ()=>{
        hide($.AUTH.login)
        show($.AUTH.reg)
        return false
    }
}

export const auth = ()=>{
    show($.AUTH)
    show($.AUTH.login)
    hide($.AUTH.reg)
    //
    if ('credentials' in navigator) {
        navigator.credentials.get({password: true})
        .then((creds)=>{
            if (creds!==null){
                disable($.AUTH.login.email)
                disable($.AUTH.login.pass)    
                disable($.AUTH.login.btn)    
                disable($.AUTH.reg.switch_login)    
                disable($.AUTH.login.switch_reg)
                // отправляем
                NET.send(JSON.stringify([
                    INFO.MSG_LOGIN,
                    creds.id,
                    creds.password
                ]))
            }
        })
    }
}
