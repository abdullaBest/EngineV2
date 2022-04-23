import { camera }  from './render.js'

// управление по принципу orbit
export let orbit_center_x          = 0.0
export let orbit_center_y          = 0.0
export let orbit_center_z          = 0.0
export let orbit_distance   = 10.0
export let orbit_angle      = 0.0
export let orbit_angle_up   = 30*Math.PI/180
export let orbit_v1_x       = 0.0
export let orbit_v1_y       = 0.0
export let orbit_v1_z       = 0.0
export let orbit_v2_x       = 0.0
export let orbit_v2_y       = 0.0
export let orbit_v2_z       = 0.0
let orbit_v1a_x             = 0.0
let orbit_v1a_y             = 0.0
let orbit_v1a_z             = 0.0
//
export let hangle                  = 0
export let vangle                  = 0 
export let fps_center              =[0,0,0]

// настройки камеры в 3 положениях высоты, минимальная высота, средняя высота и максимальная высота камеры
let orbit_camera_min_y     = 1              // высота 
let orbit_camera_min_angle = 35*Math.PI/180  // угол наклона
let orbit_camera_min_fov   = 55             // угол обзора
let orbit_camera_mid_y     = 50
let orbit_camera_mid_angle = 90*Math.PI/180
let orbit_camera_mid_fov   = 55
let orbit_camera_max_y     = 100
let orbit_camera_max_angle = 90*Math.PI/180
let orbit_camera_max_fov   = 50

let orbit_zone_left    = 0                // зона в которой можно передвигаться
let orbit_zone_top     = 0
let orbit_zone_right   = 100
let orbit_zone_bottom  = 100
let fov = 45

export const prepare = (x,y,z)=>{

    camera.rotation.order = 'YXZ'

    orbit_set_angle(0)

    orbit_set_angle_up(orbit_angle_up)

    orbit_set_center(x,y,z,false)

    orbit_render_update()

    camera.position.x = orbit_center_x
    camera.position.y = orbit_center_y
    camera.position.z = orbit_center_z

}

export const orbit_set_angle = (angle_delta)=>{
    const v1x = 0
    const v1z = 1
    const v2x = 1
    const v2z = 0

    orbit_angle = orbit_angle + angle_delta

    orbit_v1_x = v1x*Math.cos(orbit_angle) + v2x*Math.sin(orbit_angle)
    orbit_v1_y = 0
    orbit_v1_z = v1z*Math.cos(orbit_angle) + v2z*Math.sin(orbit_angle)

    orbit_v2_x = v2x*Math.cos(orbit_angle) - v1x*Math.sin(orbit_angle)
    orbit_v2_y = 0
    orbit_v2_z = v2z*Math.cos(orbit_angle) - v1z*Math.sin(orbit_angle)
}

export const orbit_set_angle_up = (angle)=>{
    orbit_angle_up = angle
    orbit_v1a_x = orbit_v1_x*Math.cos(orbit_angle_up) + 0*Math.sin(orbit_angle_up)
    orbit_v1a_y = orbit_v1_y*Math.cos(orbit_angle_up) + 1*Math.sin(orbit_angle_up)
    orbit_v1a_z = orbit_v1_z*Math.cos(orbit_angle_up) + 0*Math.sin(orbit_angle_up)
}

const orbit_position_zone = ()=>{
    orbit_center_x = Math.min(Math.max(orbit_center_x,orbit_zone_left),orbit_zone_right)
    orbit_center_z = Math.min(Math.max(orbit_center_z,orbit_zone_top),orbit_zone_bottom)
}

export const orbit_set_center = (x,y,z,move=true)=>{
    orbit_center_x = x
    orbit_center_y = y
    orbit_center_z = z
    orbit_position_zone()  
    if (!move){
        camera.position.x = orbit_center_x
        camera.position.y = orbit_center_y
        camera.position.z = orbit_center_z
    }
}

export const orbit_set_center_offset = (x,y,z)=>{
    orbit_center_x = orbit_zone_left + x*(orbit_zone_right - orbit_zone_left)
    orbit_center_y = y
    orbit_center_z = orbit_zone_top + z*(orbit_zone_bottom - orbit_zone_top)
    orbit_position_zone()  
}


export const orbit_move_center = (dx,dy,dz)=>{
    orbit_center_x = orbit_center_x + dx
    orbit_center_y = orbit_center_y + dy
    orbit_center_z = orbit_center_z + dz
    orbit_position_zone()
}

export const orbit_move_center_relative = (dx,dy,dz)=>{
    orbit_center_x = orbit_center_x + orbit_v1_x*dz + orbit_v2_x*dx
    orbit_center_y = orbit_center_y + orbit_v1_y*dz + orbit_v2_y*dx
    orbit_center_z = orbit_center_z + orbit_v1_z*dz + orbit_v2_z*dx
    orbit_position_zone()
}

export const orbit_render_update = ()=>{
    let c = camera
    let lerp_delta = 0.05
    c.position.x = c.position.x + ((orbit_center_x + orbit_v1a_x*orbit_distance) - c.position.x)*lerp_delta
    c.position.y = c.position.y + ((orbit_center_y + orbit_v1a_y*orbit_distance) - c.position.y)*lerp_delta 
    c.position.z = c.position.z + ((orbit_center_z + orbit_v1a_z*orbit_distance) - c.position.z)*lerp_delta 
    
    // поворот камеры
    lerp_delta = 0.03
    let dx = (orbit_angle - c.rotation.y)
    if (Math.abs(dx)>Math.PI){
        if (orbit_angle<c.rotation.y){
            c.rotation.y = c.rotation.y - 2*Math.PI
        }else{
            c.rotation.y = c.rotation.y + 2*Math.PI
        }
        dx = (orbit_angle - camera.rotation.y)
    }
    let a1 = c.rotation.y + dx*lerp_delta

    dx = -orbit_angle_up - c.rotation.x
    let a2 = c.rotation.x + dx*lerp_delta
    camera.rotation.set(a2,a1,0)
    //
    camera.fov = camera.fov + (fov - camera.fov)*0.1
    camera.updateProjectionMatrix()

}

// angle - in degrees
export const orbit_set_config = (min_y,min_angle,min_fov,mid_y,mid_angle,mid_fov,max_y,max_angle,max_fov)=>{
    orbit_camera_min_y     = min_y
    orbit_camera_min_angle = min_angle*Math.PI/180
    orbit_camera_min_fov   = min_fov
    orbit_camera_mid_y     = mid_y
    orbit_camera_mid_angle = mid_angle*Math.PI/180
    orbit_camera_mid_fov   = mid_fov
    orbit_camera_max_y     = max_y
    orbit_camera_max_angle = max_angle*Math.PI/180
    orbit_camera_max_fov   = max_fov
    //
    orbit_calc_angle(0)
}

export const orbit_set_zone = (left,top,right,bottom)=>{
    orbit_zone_left = left
    orbit_zone_top = top
    orbit_zone_right = right
    orbit_zone_bottom = bottom
    orbit_position_zone()  
}


export const orbit_calc_angle = (delta)=>{
    let d = Math.min( Math.max(orbit_distance + delta, orbit_camera_min_y), orbit_camera_max_y)
    
    if (orbit_distance<orbit_camera_mid_y){

        if (d>orbit_camera_mid_y){
            orbit_distance = orbit_camera_mid_y
        }else{
            orbit_distance = d
        }

        // угол
        let t = (orbit_distance-orbit_camera_min_y)/(orbit_camera_mid_y-orbit_camera_min_y)
        t = orbit_camera_min_angle + (orbit_camera_mid_angle - orbit_camera_min_angle)*t
        orbit_set_angle_up(t)
        // fov
        let f = orbit_distance/orbit_camera_mid_y
        fov = orbit_camera_min_fov + (orbit_camera_mid_fov - orbit_camera_min_fov)*f

    }else{

        if (delta>=0){
            orbit_distance = orbit_camera_max_y
            // угол
            orbit_set_angle_up(orbit_camera_max_angle)
            // fov
            fov = orbit_camera_max_fov
        }else{
            orbit_distance = orbit_camera_mid_y-1
            // угол
            orbit_set_angle_up(orbit_camera_mid_angle)
            // fov
            fov = orbit_camera_mid_fov
        }
    }
}
