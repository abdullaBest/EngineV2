/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
export let flags        = 0
export let input_active = false
export const mouse      = Object.seal({
    ox          : 0,
    oy          : 0,
    button      : 0,
    x           : 0,
    y           : 0,
    wheel_delta : 0,
    btn_active  : 0,
    dx          : 0,
    dy          : 0,
})

export const FLAG_UP          = 1
export const FLAG_DOWN        = 2
export const FLAG_LEFT        = 4
export const FLAG_RIGHT       = 8
export const FLAG_EDITOR      = 16     // редактор
export const FLAG_CTRL        = 32     // копание
export const FLAG_INTERACTION = 64     // взаимодействие
export const FLAG_FIRE        = 128    // выстрел
export const FLAG_SPACE       = 256    // пробел
export const FLAG_ACTION      = 512    // 
export const FLAG_ROT_LEFT    = 1024   // 
export const FLAG_ROT_RIGHT   = 2048   // 
export const FLAG_CAMERA_UP   = 4096   // 
export const FLAG_CAMERA_DOWN = 8192   // 

export const MOUSE_BTN_LEFT  = 1
export const MOUSE_BTN_RIGHT = 2
export const MOUSE_CLICK     = 4
export const KEY_SHIFT       = 8

const MOUSE_BTN = [MOUSE_BTN_LEFT,0,MOUSE_BTN_RIGHT]

const KBD = new Uint16Array(255)

KBD[38] = FLAG_UP           // up
KBD[87] = FLAG_UP           // w
KBD[37] = FLAG_LEFT         // left
KBD[65] = FLAG_LEFT         // a
KBD[40] = FLAG_DOWN         // down
KBD[83] = FLAG_DOWN         // s
KBD[39] = FLAG_RIGHT        // right
KBD[68] = FLAG_RIGHT        // d
KBD[81] = FLAG_ROT_LEFT     // q
KBD[69] = FLAG_ROT_RIGHT    // e
KBD[90] = FLAG_CAMERA_UP    // z
KBD[67] = FLAG_CAMERA_DOWN  // c

KBD[32] = FLAG_SPACE        // space
KBD[17] = FLAG_CTRL         // CTRL
/*
KBD[69] = FLAG_INTERACTION  // e
KBD[89] = 0 // y
KBD[27] = 0 // esc
KBD[13] = 0 // return
KBD[192] = 0 // ~
KBD[49] = 0 // 1
KBD[50] = 0 // 2
KBD[51] = 0 // 3
KBD[52] = 0 // 4
*/

const getRelativeCoordinates = (e)=>{
    let x = e.target.offsetLeft
    let y = e.target.offsetTop
    let ref = e.target.offsetParent
    while ( ref ) {
        x += ref.offsetLeft
        y += ref.offsetTop
        ref = ref.offsetParent
    }
    x = e.clientX - x
    y = e.clientY - y
    return {x:x,y:y}
}

document.addEventListener('focusin', (e)=>{
    if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA' ){
        input_active = true
    }
},false)

document.addEventListener('focusout', (e)=>{ input_active = false },false)

document.addEventListener( 'keydown', function(e){
    //console.log(event.keyCode)
    if (input_active){ return }
    flags = flags | KBD[e.keyCode]
    if (e.shiftKey){
        mouse.btn_active = mouse.btn_active | KEY_SHIFT
    }else{
        mouse.btn_active = mouse.btn_active & (~KEY_SHIFT)
    }
}, false )

document.addEventListener( 'keyup', function(e){
    if (!input_active){
        flags = flags & (~KBD[e.keyCode])
    } 
}, false )

document.addEventListener( 'keypress', function(event){
    //console.log(event)
    if (!input_active){
       /* 
        if (event.code==='KeyT'){
            if (window.$.INFO){
                if (window.$.INFO.el.style.display==='block'){
                    window.$.INFO.el.style.display = 'none'
                    window.$.MINIMAP.el.style.display = 'none'
                }else{
                    window.$.INFO.el.style.display = 'block'
                    window.$.MINIMAP.el.style.display = 'block'
                }
            }
        }
        if (event.code==='KeyQ'){
        }
        if (event.code==='KeyR'){
        }
        if (event.code==='Backquote'){
            if (EDITOR.active){
                close_editor()
            }else{
                show_editor()
            }
        }
        if (event.code==='KeyM'){
        }
        if (event.code==='KeyE'){
        }
        if (event.code==='KeyQ'){
        }
        if (event.code==='KeyT'){
        }
        if (event.keyCode===49){ //'1'
        }
        if (event.keyCode===50){ //'2'
        }
        if (event.keyCode===51){ //'3'
        }
        if (event.keyCode===52){ //'4'
        }
        if (event.keyCode===32){ //'Space'
        }
        */
    }
}, false )

document.addEventListener( 'mousedown', (e)=>{
    if (e.target.nodeName==='CANVAS'){
        mouse.btn_active = mouse.btn_active | MOUSE_BTN[e.button]
    }
}, false )

document.addEventListener( 'mouseup', (e)=>{
    if (e.target.nodeName==='CANVAS'){
        mouse.btn_active = mouse.btn_active & (~MOUSE_BTN[e.button])
    }
}, false )

document.addEventListener( 'mousewheel', (e)=>{
    if (e.target.nodeName==='CANVAS'){
        mouse.wheel_delta = mouse.wheel_delta+e.deltaY
        //event.preventDefault()
        e.stopPropagation()
    }
}, false )

document.addEventListener( 'click', (e)=>{
    if (e.target.nodeName==='CANVAS'){
        mouse.btn_active = mouse.btn_active | MOUSE_CLICK
        //main_left_click()
       /* if (EDITOR.active) { 
            editor_left_click() 
        }else{
        }
        */    
    }
}, false )

document.addEventListener( 'contextmenu', (e)=>{
    //if (event.target.nodeName==='CANVAS'){
    //    if (EDITOR.active) { editor_right_click() }    
    //}
    e.preventDefault()
})

/*
document.addEventListener( 'pointerlockchange', ()=>{
}, false )
*/

document.addEventListener( 'mousemove', ( e )=>{
    let x = e.clientX/window.innerWidth
    let y = e.clientY/window.innerHeight
    mouse.x  = e.clientX
    mouse.y  = e.clientY
    mouse.ox =  x*2-1
    mouse.oy = -y*2+1
    mouse.dx = mouse.dx + e.movementX
    mouse.dy = mouse.dy + e.movementY
}, false )

document.addEventListener( 'mouseout', ( e )=>{ mouse.btn_active = 0 })

window.onblur = (e)=>{
    flags = 0
    mouse.btn_active = 0
}

window.onscroll = (e)=>window.scrollTo(0,0)

export const click_release = ()=>{mouse.btn_active = mouse.btn_active & (~MOUSE_CLICK)}
export const set_input_active = (b)=>{input_active = b}
