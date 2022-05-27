/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/

import * as fs from 'fs'
import * as path from 'path'
import * as INFO from './public/js/info.mjs'

import express from 'express'
import bodyParser from 'body-parser'
import uWS from 'uWebSockets.js'

import * as USER from './user.mjs'
import * as EDITOR from './editor.mjs'
//import * as LAND from './land.mjs'
//import * as GAMES from './games.mjs'
import { exec, execSync } from 'child_process'

console.log('Process versions: ',process.versions)
console.log('time', new Date())
console.log('запускаем сервер обмена данными.');

const config =  JSON.parse(fs.readFileSync('./config.json'))

EDITOR.prepare()
//GAMES.prepare(config.mode)

const messagesJSON = (user,s)=>{
    const type = parseInt(s[0])

    switch (type){
        case INFO.MSG_REG:{
            if (user.data===null){
                const name  = new String(s[1]).toString()
                const email = new String(s[2]).toString()
                const pass  = new String(s[3]).toString()
                USER.reg(user,name,email,pass)
            }
        }
        break;
        case INFO.MSG_LOGIN:{
            if (user.data===null){
                const email = new String(s[1]).toString()
                const pass  = new String(s[2]).toString()
                USER.login(user,email,pass)
            }
        }
        break;
        case INFO.MSG_EDITOR_INIT:{
            if (user.data===null){ break; }
            EDITOR.init(user)
        }
        break;
        case INFO.MSG_EDITOR_SAVE_TXT:{
            if (user.data===null){ break; }
            EDITOR.texture_set(s[1])
        }
        break;
        case INFO.MSG_EDITOR_GET_GAME:{
            if (user.data===null){ break; }
            const game_id = parseInt(s[1])
            EDITOR.get_game(user,game_id)
        }
        break;
        case INFO.MSG_EDITOR_FBX_CONV:
            EDITOR.convert_fbx(null,null)
        break;
        case INFO.MSG_EDITOR_MODEL:{
            if (user.data===null){ break; }
            EDITOR.set_glb(null,s[1])
        }
        break;
        case INFO.MSG_EDITOR_LIBRARY:{
            let id   = parseInt(s[1])
            EDITOR.save_library(id,s[2])
        }
        break;
        case INFO.MSG_EDITOR_PAINT_LIST:{
            let id   = parseInt(s[1])
            EDITOR.save_paint_list(id,s[2])
        }
        break;
        case INFO.MSG_EDITOR_LAND_PARAM:{
            let id   = parseInt(s[1])
            EDITOR.save_land_param(id,s[2])
        }
        break;
        case INFO.MSG_EDITOR_SAVE_HEX:{
            let id   = parseInt(s[1])
            EDITOR.save_hexgrid(id,s[2])
        }
        break;
        case INFO.MSG_EDITOR_SAVE_TMAP:{
            let id     = parseInt(s[1])
            let width  = parseInt(s[2])
            let height = parseInt(s[3])
            //EDITOR.set_bigmap(id,width,height)
        }
        break;
        case INFO.MSG_EDITOR_SAVE_LAYER:{
            let id     = parseInt(s[1])
            let width  = parseInt(s[2])
            let height = parseInt(s[3])
            EDITOR.set_pic(id,width,height,7)
        }
        break;
        case INFO.MSG_EDITOR_SAVE_HM:{
            let id     = parseInt(s[1])
            let width  = parseInt(s[2])
            EDITOR.set_pic(id,width,width,8)
        }
        break;
        /*
        case INFO.MSG_GAMES:{
            if (user.data){
                USER.send_str(user,JSON.stringify({
                    i : INFO.MSG_GAMES,
                    d : GAMES.list_info,
                }))
            }
        }
        break;
        case INFO.MSG_GAME_START:{
            if (user.data){
                GAMES.leave(user)
                GAMES.join(user,parseInt(s[1]))
            }
        }
        break;
        case INFO.MSG_EDITOR_GET_GAME:{
            if (user.data===null){
                let id = parseInt(s[1])
                let game = GAMES.get(id)
                if (game){
                    USER.send_str(user,JSON.stringify({
                        i       : INFO.MSG_EDITOR_GAME,
                        id      : game.id,
                        global  : game.global,
                        library : game._info.objects,
                        user    : game.global_user,
                        spec    : game.spec
                    }))
                }
            }
        }
        break;
        case INFO.MSG_EDITOR_SAVE:{
            if (user.data===null){
                let id     = parseInt(s[1])
                let width  = parseInt(s[2])
                let height = parseInt(s[3])
                let type   = parseInt(s[4])
                EDITOR.set(id,width,height,type)
                if (type===2){
                    EDITOR.save_grid(s[5])
                }
                if (type===3){
                    let map_width    = parseInt(s[2])
                    let fill         = parseInt(s[3])
                    let fill_size    = parseInt(s[5])

                    let camera_min_y     = parseInt(s[6])
                    let camera_min_angle = parseInt(s[7])
                    let camera_min_fov   = parseInt(s[8])
                    let camera_mid_y     = parseInt(s[9])
                    let camera_mid_angle = parseInt(s[10])
                    let camera_mid_fov   = parseInt(s[11])
                    let camera_max_y     = parseInt(s[12])
                    let camera_max_angle = parseInt(s[13])
                    let camera_max_fov   = parseInt(s[14])

                    let zone_left    = parseInt(s[15])
                    let zone_top     = parseInt(s[16])
                    let zone_right   = parseInt(s[17])
                    let zone_bottom  = parseInt(s[18])

                    let layer_textures = s[19]

                    GAMES.edit(
                        id,
                        map_width,
                        fill,
                        fill_size,
                        camera_min_y,
                        camera_min_angle,
                        camera_min_fov,
                        camera_mid_y,
                        camera_mid_angle,
                        camera_mid_fov,
                        camera_max_y,
                        camera_max_angle,
                        camera_max_fov,
                        zone_left,
                        zone_top,
                        zone_right,
                        zone_bottom,
                        layer_textures
                    )
                }
                if (type===4){
                    let name     = s[5]
                    let r_width  = parseInt(s[6])
                    let r_height = parseInt(s[7])
                    let type     = parseInt(s[8])
                    EDITOR.set_basis(name,r_width,r_height,type)
                }
                if (type===5){
                    let name     = s[5]
                    let r_width  = parseInt(s[6])
                    let r_height = parseInt(s[7])
                    let type     = parseInt(s[8])
                    EDITOR.set_basis(name,r_width,r_height,type)
                }
                if (type===6){
                    let name     = s[5]
                    EDITOR.del_basis(user,name)
                }
                if (type===7){
                    let name     = s[5]
                    EDITOR.set_fbx(name)
                }
                if (type===8){
                    let model_name  = s[5]
                    let object_name = s[6]
                    let m           = s[7]
                    EDITOR.set_material(model_name,object_name,m)
                }
                if (type===9){
                    let model_name  = s[5]
                    let gltf        = s[6]
                    EDITOR.bundle(model_name,gltf)
                }
                if (type===10){
                    let model_name  = s[5]
                    EDITOR.model_del(user,model_name)
                }
                if (type===11){
                    let bundle_id   = s[5]
                    let gltf        = s[6]
                    let info        = s[7]
                    EDITOR.bundle2(bundle_id,gltf,info)
                }
            }
        }
        break;
        case INFO.MSG_EDITOR_CREATE:{
            if (user.data===null){
                let id        = parseInt(s[1])
                let name      = s[2]
                let map_width = parseInt(s[3])

                let h_width = map_width*32
                let l_width = map_width*16
                let cx      = map_width*9
                let cy      = Math.trunc(cx/0.75)

                let game = GAMES.get(id)
                if (game){
                    if (map_width!==game.global.map_width){
                        GAMES.create(id,name,map_width,cx,cy)
                    }
                    GAMES.edit(
                        id,
                        map_width,
                        1,
                        3,
                        1,
                        1,
                        55,
                        25,
                        35,
                        55,
                        50,
                        90,
                        55,
                        0,
                        0,
                        cx,
                        cy
                    )
                }else{
                    GAMES.create(id,name,map_width,cx,cy)
                }
                GAMES.save()
                //
                EDITOR.create(id,h_width,h_width,l_width,l_width,cx,cy)   
                //
                fs.writeFileSync('./interface/'+id+'.html','')
                fs.writeFileSync('./interface/'+id+'.css','')
                fs.writeFileSync('./interface/'+id+'.js','')
            }
        }
        break;
        case INFO.MSG_EDITOR_INTERFACE:{
            if (user.data===null){
                let id = parseInt(s[1])
                let html   = fs.readFileSync('./interface/'+id+'.html','utf8')
                let css    = fs.readFileSync('./interface/'+id+'.css','utf8')
                let script = fs.readFileSync('./interface/'+id+'.js','utf8')
                USER.send_str(user,JSON.stringify({
                    i       : INFO.MSG_EDITOR_INTERFACE,
                    html    : html,
                    css     : css,
                    script  : script,
                }))
            }
        }
        break;
        case INFO.MSG_GD_UNIT_MOVE:{
            if (user.data){
                GAMES.gd_move_unit(user,s)
            }
        }
        break;
        case INFO.MSG_EDITOR_LIBRARY:{
            let id   = parseInt(s[1])
            let info = s[2]
            GAMES.edit_info_objects(id,info)
        }
        break;
        case INFO.MSG_GD_UNIT_ATTACK:{
            if (user.data){
                let sx  = parseInt(s[1])
                let sy  = parseInt(s[2])
                let sid = parseInt(s[3])
                let tx  = parseInt(s[4])
                let ty  = parseInt(s[5])
                let tid = parseInt(s[6])
                GAMES.gd_attack_unit(user,sx,sy,sid,tx,ty,tid)
            }
        }
        break;
        case INFO.MSG_EDITOR_INIT:{
            USER.send_str(user,JSON.stringify({
                i       : INFO.MSG_EDITOR_INIT,
                ...
                EDITOR.init()
            }))                    
        }
        break;
        case INFO.MSG_GD_MSG:{
            if (user.data){
                const t = parseInt(s[1]) || 0
                GAMES.gd_onMsg(user,t,s[2])
            }
        }
        break;
        case INFO.MSG_EDITOR_GRID:{
            if (user.data!==null){
                return
            }

            let id    = parseInt(s[1])
            let path  = s[2]
            let _data  = s[3]
            let _spec  = s[4]

            let game = GAMES.get(id)
            if (game){
                if (path.length===3){
                    game.global[path[0]][parseInt(path[1])][path[2]] = _data
                    if (_spec){
                        game.spec.global[path[0]+'.'+path[2]] = _spec
                    }
                }else{
                    game.global[path[0]] = _data
                    game.spec.global[path[0]] = _spec
                }
            }
        }
        break;
        case INFO.MSG_EDITOR_GRID_NEW:{
            if (user.data!==null){
                return
            }

            let id    = parseInt(s[1])
            let name  = s[2]

            let game = GAMES.get(id)
            if (game){
                game.global[name] = []
                game.spec.global[name] = {
                    n: {
                        title : "n",
                        type  : "i",
                        desc  : "",
                        link  : "",
                        width : 30
                    }
                }
            }
        }
        break;
        */
    }
}

const messageBINARY = (user,message)=>{
    switch(EDITOR.mode){
        case 0 :
                break;
        //---------------------------
        case 1 :
                EDITOR.save_texture_original(message)
                break;
        case 2 :
                EDITOR.save_texture_resized(user,message)
                break;
        case 3 :
                EDITOR.save_texture_preview(message)
                break;
        //---------------------------
        case 4 :
                EDITOR.convert_fbx(user,message)
                break;
        //---------------------------
        case 5 :
        case 6 :
                EDITOR.set_glb(user,message)
                break
        case 7 :
                EDITOR.save_layer(message)
                break;
        case 8 :
                EDITOR.save_heightmap(message)
                break;
            
        /*
        case 5 :
                EDITOR.save_bigmap(message)
                break;
        case 7 : 
                EDITOR.save_heightmap(message)
                break;
        case 8 : 
                //EDITOR.save_bigmap(user,message)
                break;
        case 9 :
                EDITOR.save_gltf(message)
                break
        */
    }
}

const prepare_server = ()=>{

    const SERVER = express()
    SERVER.use(bodyParser.json())
    SERVER.use(express.static( './public'))
    SERVER.listen(config.port)

    // WS
    const app = uWS./*SSL*/App({
        //key_file_name: 'misc/key.pem',
        //cert_file_name: 'misc/cert.pem',
        //passphrase: '1234'
    }).ws('/*', {

        compression      : 0,
        maxPayloadLength : 300 * 1024 * 1024, // для редактора нужны большие объемы
        idleTimeout      : 60,  // секунды

        open: (ws, req) => {
            if ( !USER.new_connection(ws) ){
                ws.close()
            }
        },
        message: (ws, message, isBinary) => {
            let user = USER.get_by_n(ws.n)
            if (!isBinary){
                const ss = Buffer.from(message).toString()
                let s=null
                try{
                    s = JSON.parse(ss)
                }catch(e){
                    console.log(ss,e)
                    return
                }

                messagesJSON(user,s)
            }else{
                messageBINARY(user,message)
            }
        },
        drain: (ws) => {

        },
        close: (ws, code, message) => {
            if (ws.n!==undefined){
                let user = USER.get_by_n(ws.n)
                if (user.data){
                    //GAMES.leave(user)
                }
            }
            USER.free_connection(ws)
        }
    }).any('/*', (res, req) => {
        res.end('Nothing to see here!')
    }).listen(config.ws_port, (token) => {
        if (token) {
            console.log('Listening to port ' + config.ws_port)
        } else {
            console.log('Failed to listen to port ' + config.ws_port)
        }
    })
}

prepare_server()

exec('start chrome http://localhost', err => {
	if (err) { //process error
	}
	else {
		console.log("success open")
	}
})


//setInterval(()=>{
    //GAMES.update(100)
//},100)

const exitHandler = (options, exitCode)=>{
    if (options.cleanup) {
        console.log('clean')
        //GAMES.save()
        EDITOR.save()
        USER.save()
    }
    if (exitCode || exitCode === 0) console.log(exitCode)
    if (options.exit) process.exit()
}


//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true, cleanup:true}))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true, cleanup:true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit:true, cleanup:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));