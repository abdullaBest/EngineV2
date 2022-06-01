/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as INFO      from './info.mjs'
import * as GUI       from './strapony.js'
import * as AUTH      from './auth.js'
import * as NET       from './net.js'
import * as RENDER    from './render.js'
import * as CONTROL   from './controls.js'
import * as CAMERA    from './camera_orbit.js'
import * as LAND      from './land.js'
import * as ASSETS    from './assets.js'
import * as LIBRARY   from './library.js'
import * as HEXGRID   from './hexgrid.js'

import { prepare as texture_prepare, set_texture} from './editor/textures.js' 
import { prepare as models_prepare, render as models_editor_render, fbx_converted, set_model } from './editor/models.js' 
import { prepare as land_prepare, prepare_game as land_prepare_game, set_mouse_position, set_point} from './editor/land.js' 
import { prepare as hexgrid_prepare, setParam as hexgrid_set_param, set_position as hex_set_position, select as hex_select } from './editor/hexgrid.js' 
import { prepare as lib_prepare } from './editor/library.js' 

let ping_timer = 0
let game_timer = 0
let last_x     = 0
let last_y     = 0

let editor_mode = -1 // 0-land   1-hex

const calc_angle = (d)=>{
    CAMERA.orbit_calc_angle(d)
    /*
    let c = directionalLight.shadow.camera
    let dd = CAMERA.orbit_distance
    c.left   = -dd*2.5
    c.top    = -dd*2.5
    c.right  = dd*2.5
    c.bottom = dd*2.5
    c.updateProjectionMatrix()
    //directionalLight.shadow.updateMatrices(directionalLight,c,0)
    */
}

const camera_control = ()=>{
    // сдвиг камеры на правый кнопку мыши
    if (CONTROL.mouse.btn_active & CONTROL.MOUSE_BTN_RIGHT) {
        let dx = last_x - RENDER.mouse.x
        let dy = last_y - RENDER.mouse.y
        CAMERA.orbit_move_center(dx,0,dy)
    }
    
    // поворот камеры  
    const sense_x = 5   // чувствительность при повороте клавиатурой
    if (CONTROL.flags & CONTROL.FLAG_ROT_LEFT){
        CAMERA.orbit_set_angle(-RENDER.deg_to_rad(sense_x))
    }
    if (CONTROL.flags & CONTROL.FLAG_ROT_RIGHT){
        CAMERA.orbit_set_angle(RENDER.deg_to_rad(sense_x))
    }
    CAMERA.orbit_set_angle_up(CAMERA.orbit_angle_up)

    // управление камерой на wasd 
    const move_distance = CAMERA.orbit_distance*0.03
    if (CONTROL.flags & CONTROL.FLAG_UP){
        CAMERA.orbit_move_center_relative(0,0,-move_distance)
    }
    if (CONTROL.flags & CONTROL.FLAG_DOWN){
        CAMERA.orbit_move_center_relative(0,0,move_distance)
    }
    if (CONTROL.flags & CONTROL.FLAG_LEFT){
        CAMERA.orbit_move_center_relative(-move_distance,0,0)
    }
    if (CONTROL.flags & CONTROL.FLAG_RIGHT){
        CAMERA.orbit_move_center_relative(move_distance,0,0)
    }
    // управление камерой роликом мышки
    if (CONTROL.mouse.wheel_delta !== 0) {
        calc_angle(CONTROL.mouse.wheel_delta * 0.012)
        CONTROL.mouse.wheel_delta = 0
    }
    // управляем высотой камеры с клавиатуры
    if (CONTROL.flags & CONTROL.FLAG_CAMERA_UP){
        calc_angle(0.5)
    }
    if (CONTROL.flags & CONTROL.FLAG_CAMERA_DOWN){
        calc_angle(-0.5)
    }
}


const editor_tick = ()=>{

    // определяем положение курсора в 3д пространстве
    RENDER.mouse.x = CONTROL.mouse.ox
    RENDER.mouse.y = CONTROL.mouse.oy
    RENDER.mouse.z = 0.0
    RENDER.raycaster.setFromCamera( RENDER.mouse, RENDER.camera )

    LAND.over_heightmap(RENDER.raycaster.ray,RENDER.mouse)

    // editor
    switch(editor_mode){
        // рисуем на поверхности
        case 0:{
                    set_mouse_position(RENDER.mouse)
                    if ( (CONTROL.mouse.btn_active & (CONTROL.MOUSE_BTN_LEFT+CONTROL.MOUSE_CLICK))!==0) {
                        CONTROL.click_release()
                        // editor
                        set_point(RENDER.mouse.x,RENDER.mouse.z)
                    }else{
                        LAND.check_heightmap_data()
                    }
                }
                break;
        // hexgrid
        case 1:{
                    hex_set_position(RENDER.mouse)

                    if ( (CONTROL.mouse.btn_active & (CONTROL.MOUSE_BTN_LEFT+CONTROL.MOUSE_CLICK))!==0) {
                        CONTROL.click_release()
                        // editor
                        hex_select()
                    }
                }
                break;

    }


}

const game_tick = ()=>{
    RENDER.mouse_over_grid(0, 0)
    //RENDER.mouse.x = 0
    //RENDER.mouse.y = 0
    
    LAND.update_view(RENDER.mouse.x,RENDER.mouse.y)

    editor_tick()

    //let camera_x = Math.trunc(CAMERA.orbit_center_x)
    //let camera_z = Math.trunc(CAMERA.orbit_center_z)

    //directionalLight.position.set(camera_x+30, 50, camera_z+30)
    //directionalLight.target.position.set(camera_x,0,camera_z)
    //directionalLight.target.updateMatrixWorld()

    RENDER.mouse_over_grid(CONTROL.mouse.ox, CONTROL.mouse.oy)
    //MAP.hexgrid_position(RENDER.mouse.x,RENDER.mouse.y)
    //MAP.update_hex_selector_position(MAP.selector.hex_x,MAP.selector.hex_y)

    /*
    if (CONTROL.mouse.btn_active & CONTROL.MOUSE_CLICK) {
        CONTROL.click_release()
        //if (selected_x!==MAP.selector.hex_x || selected_y!==MAP.selector.hex_y){
            selected_x = MAP.selector.hex_x
            selected_y = MAP.selector.hex_y
            GD.onCellSelect(selected_x,selected_y)
        //}
    }else{
        if (over_x!==MAP.selector.hex_x || over_y!==MAP.selector.hex_y){
            over_x = MAP.selector.hex_x
            over_y = MAP.selector.hex_y
            GD.onCellOver(over_x,over_y)
        }
    }
    */

    camera_control()

    // запоминаем прошлое положение мышки на карте
    last_x = RENDER.mouse.x
    last_y = RENDER.mouse.y

    //GD.onTick()
}


const on_message = (type,m)=>{
    switch(type){
        // связь с сервером установлена
        case INFO.MSG_READY:
            AUTH.auth()
            //
            clearInterval(game_timer)
            clearInterval(ping_timer)
            ping_timer = setInterval(()=>NET.send_json([INFO.MSG_PING]), 1000)
            //
        break
        // авторизация прошла успешно
        case INFO.MSG_LOGIN:
            NET.send(JSON.stringify([
                INFO.MSG_EDITOR_INIT,
            ]))
        break
        // активируем редактор
        case INFO.MSG_EDITOR_INIT:
            console.log(m)
            ASSETS.prepareEditor(m.t,m.m)

            texture_prepare(m.t)
            models_prepare(m.m)
            land_prepare()
            hexgrid_prepare()
            
            NET.load_game(1)
            
            CAMERA.prepare(0,0,0)
            calc_angle(0)

            game_timer = setInterval(game_tick,100)
        break
        // пришли данные по модели
        case INFO.MSG_EDITOR_FBX_CONV:
            fbx_converted(m.b)
        break;
        // загружаем данные по игре
        case INFO.MSG_EDITOR_GET_GAME:
            const global = m.g.global

            LAND.load( NET.game_id, global.land )

            CAMERA.orbit_set_zone(
                -LAND.half_map_width,
                -LAND.half_map_width,
                 LAND.half_map_width,
                 LAND.half_map_width
            )

            LIBRARY.prepare(m.g.lib)

            HEXGRID.prepareParam(global.hexgrid)
            HEXGRID.prepareGrid(m.h)
            
            // editor
            land_prepare_game(global.land)
            lib_prepare(m.g.lib)
            hexgrid_set_param()
            
            console.log(m)
        break
        // обновляем текстуру
        case INFO.MSG_EDITOR_SAVE_TXT:
            set_texture(m)
        break;
        // обновляем модели
        case INFO.MSG_EDITOR_MODEL:
            set_model(m.d)
        break;
        // начинаем игру
        case INFO.MSG_GAME_START:
            //start()
        break;
    }
    //console.log(m)
}

const main_render_before = ()=>{
    CAMERA.orbit_render_update()

}

const main_render_shadow = ()=>{

}

const main_render = ()=>{
    LAND.render()
    HEXGRID.render()
    // ----------------
    // рисуем миникарту
    /*
    const p = RENDER.renderer.abd_prepareObject( LAND.minimap_mesh, RENDER.scene, RENDER.camera, LAND.minimap_mesh.material )
    const u = p.getUniforms()
    RENDER.renderer.abd_setValue(u,'fogColor', RENDER.scene.fog.color)
    RENDER.renderer.abd_setValue(u,'fogDensity', RENDER.scene.fog.density)
    RENDER.renderer.abd_renderObject( LAND.minimap_mesh, LAND.minimap_mesh.geometry, LAND.minimap_mesh.material, p )
*/

    //----------------
    // EDITOR
    models_editor_render()

}

const main_render_after = ()=>{
    LAND.render_after()
}

const manager_callback = (f)=>{
    if (f===0){
        console.log('asset loaded without flag')
        return
    }

    // тайлы для paint layer загружены
    if ((f & INFO.ASSETS_LAND_TILES)!==0){
        LAND.loaded_paint_tiles()
    }
    // карта покраски загружена
    if ((f & INFO.ASSETS_LAND_LAYER)!==0){
        LAND.loaded_paint_layer()
    }
    // карта высот загружена
    if ((f & INFO.ASSETS_LAND_HEIGHTMAP)!==0){
        LAND.loaded_heightmap()
    }

    // library - модели и текстуры загружены
    if ((f & INFO.ASSETS_LIBRARY)!==0){
        LIBRARY.loaded()
    }

    // подготовка сетки - обычно вызывается после того как все модели загружены
    //if ((f & INFO.ASSETS_HEXGRID)!==0){
    //    HEXGRID.prepareGrid(m.h)
    //}


}

const menu_prepare = ()=>{
    $.MENU.assets.el.onclick = ()=>{
        $.ASSETS.el.style.display = 'block'
    }
    $.MENU.land.el.onclick = ()=>{
        editor_mode = 0
        $.LAND.el.style.display = 'block'
    }
    $.MENU.hex.el.onclick = ()=>{
        editor_mode = 1
        $.HEXGRID.el.style.display = 'block'
    }
}

// Подготовка
Promise.all([
    GUI.prepare,
    ASSETS.prepare,
]).then(()=>{
    AUTH.prepare()

    NET.prepare(on_message,AUTH.on_message)
    //
    //EDITOR.prepare()
    ASSETS.setCallback(manager_callback)
    RENDER.prepare(main_render_before,main_render_shadow,main_render,main_render_after)
    RENDER.classic_render()
    //
    LAND.create({    
        chunks         : 1,
        chunk_width    : 1,
        view           : 1,
        texture_size   : 64,
        normalf        : 0.1,
        layer_cx       : 4,
        layer_t0_scale : 1,
        layer_t1_scale : 1,
        hm_cx          : 4,
        hm_max         : 1,
        minimap_cx     : 4,
    })

    HEXGRID.create(10,10)

    menu_prepare()

    game_timer = setInterval(game_tick,100)
})